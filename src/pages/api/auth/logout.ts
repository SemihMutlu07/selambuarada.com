import type { APIRoute } from 'astro';
import { buildClearCookie } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': buildClearCookie(),
    },
  });
};

export const GET: APIRoute = async () => {
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/',
      'Set-Cookie': buildClearCookie(),
    },
  });
};
