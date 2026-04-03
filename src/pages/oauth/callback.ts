import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const code = new URL(request.url).searchParams.get('code');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('OAuth credentials not configured', { status: 500 });
  }

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
    const content = JSON.stringify({
      token: tokenData.access_token,
      provider: 'github',
    });

    return new Response(
      `<!doctype html><html><body><script>
        window.opener.postMessage('authorization:github:error:${content}', '*');
      </script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } },
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
          window.opener.postMessage(
            'authorization:github:success:${content}',
            e.origin
          );
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })();
    </script></body></html>`,
    { headers: { 'Content-Type': 'text/html' } },
  );
};
