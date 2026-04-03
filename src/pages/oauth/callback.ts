import type { APIRoute } from 'astro';

export const prerender = false;

const SITE_ORIGIN = 'https://selambuarada.com';

function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  const storedState = getCookie(request, 'oauth_state');
  if (!state || !storedState || state !== storedState) {
    return new Response('Invalid or missing state parameter', { status: 403 });
  }

  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('OAuth credentials not configured', { status: 500 });
  }

  const clearCookie =
    'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/oauth; Max-Age=0';

  const tokenResponse = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    },
  );

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
  };

  if (tokenData.error || !tokenData.access_token) {
    return new Response(
      `<!doctype html><html><body><script>
        window.opener.postMessage(
          'authorization:github:error:${JSON.stringify({ provider: 'github' })}',
          '${SITE_ORIGIN}'
        );
      </script></body></html>`,
      {
        headers: {
          'Content-Type': 'text/html',
          'Set-Cookie': clearCookie,
        },
      },
    );
  }

  const content = JSON.stringify({
    token: tokenData.access_token,
    provider: 'github',
  });

  return new Response(
    `<!doctype html><html><body><script>
      (function() {
        function receiveMessage(e) {
          if (e.origin !== '${SITE_ORIGIN}') return;
          window.opener.postMessage(
            'authorization:github:success:${content}',
            '${SITE_ORIGIN}'
          );
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "${SITE_ORIGIN}");
      })();
    </script></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html',
        'Set-Cookie': clearCookie,
      },
    },
  );
};
