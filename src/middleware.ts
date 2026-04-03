import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname.startsWith('/keystatic') || context.url.pathname.startsWith('/api/keystatic')) {
    if (import.meta.env.DEV) return next();

    const secret = import.meta.env.KEYSTATIC_SECRET;
    if (!secret) return new Response('Not Found', { status: 404 });

    const provided =
      context.url.searchParams.get('secret') ||
      context.request.headers.get('x-keystatic-secret');

    if (provided !== secret) return new Response('Not Found', { status: 404 });
  }

  return next();
});
