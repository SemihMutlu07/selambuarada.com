import { defineMiddleware } from 'astro:middleware';
import {
  signSession,
  verifySession,
  getCookieFromRequest,
  buildSessionCookie,
} from './lib/auth';

const GUARDED_PREFIXES = ['/write', '/api/posts', '/api/auth'];

function isGuarded(pathname: string): boolean {
  for (const prefix of GUARDED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return true;
  }
  return false;
}

function readEnv(name: string): string | undefined {
  const fromImportMeta = (import.meta.env as Record<string, string | undefined>)[name];
  if (fromImportMeta) return fromImportMeta;
  if (typeof process !== 'undefined' && process.env) return process.env[name];
  return undefined;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;
  const pathname = url.pathname;

  if (!isGuarded(pathname)) return next();

  // The logout endpoint clears the cookie unconditionally — let it through.
  if (pathname === '/api/auth/logout') return next();

  const cookieSecret = readEnv('EDITOR_COOKIE_SECRET');
  if (!cookieSecret) {
    return new Response('EDITOR_COOKIE_SECRET is not configured on the server', {
      status: 500,
    });
  }

  // One-time bootstrap: visit /write?setup=<EDITOR_SECRET> from a new device.
  const setupParam = url.searchParams.get('setup');
  if (setupParam) {
    const editorSecret = readEnv('EDITOR_SECRET');
    if (!editorSecret) {
      return new Response('EDITOR_SECRET is not configured on the server', {
        status: 500,
      });
    }
    // Constant-time-ish compare; lengths must match first.
    if (
      setupParam.length !== editorSecret.length ||
      setupParam !== editorSecret
    ) {
      return new Response('Invalid setup token', { status: 403 });
    }
    const token = await signSession(cookieSecret);
    const cleanUrl = new URL(url);
    cleanUrl.searchParams.delete('setup');
    const location = cleanUrl.pathname + (cleanUrl.search || '');
    return new Response(null, {
      status: 303,
      headers: {
        Location: location,
        'Set-Cookie': buildSessionCookie(token),
      },
    });
  }

  const token = getCookieFromRequest(context.request);
  const valid = await verifySession(cookieSecret, token);
  if (!valid) {
    if (pathname.startsWith('/api/')) {
      return jsonResponse(401, { error: 'unauthorized' });
    }
    // Send unauthorized visitors home — no login screen.
    return new Response(null, {
      status: 303,
      headers: { Location: '/' },
    });
  }

  return next();
});
