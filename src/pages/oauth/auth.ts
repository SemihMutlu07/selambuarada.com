import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const clientId = import.meta.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response('GITHUB_CLIENT_ID is not configured', { status: 500 });
  }

  const redirectUri = new URL('/oauth/callback', request.url).toString();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo,user',
  });

  return Response.redirect(
    `https://github.com/login/oauth/authorize?${params}`,
    302,
  );
};
