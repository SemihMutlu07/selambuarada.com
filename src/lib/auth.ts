// Signed-cookie session for the editor.
// HMAC-SHA256 over a JSON payload containing the expiry time.
// No external deps — Web Crypto SubtleCrypto works on Vercel + locally on Node 22+.

const COOKIE_NAME = 'editor_session';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 180; // 180 days

interface SessionPayload {
  exp: number;
}

function base64urlEncode(buf: Uint8Array): string {
  let str = '';
  for (const b of buf) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signSession(
  secret: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string> {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const enc = new TextEncoder();
  const payloadBytes = enc.encode(JSON.stringify(payload));
  const key = await getKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, payloadBytes));
  return `${base64urlEncode(payloadBytes)}.${base64urlEncode(sig)}`;
}

export async function verifySession(
  secret: string,
  token: string | null | undefined,
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  try {
    const payloadBytes = base64urlDecode(parts[0]);
    const sigBytes = base64urlDecode(parts[1]);
    const key = await getKey(secret);
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      payloadBytes as unknown as BufferSource,
    );
    if (!ok) return false;
    const dec = new TextDecoder();
    const payload = JSON.parse(dec.decode(payloadBytes)) as SessionPayload;
    if (typeof payload.exp !== 'number') return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function getCookieFromRequest(
  request: Request,
  name: string = COOKIE_NAME,
): string | null {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

export function buildSessionCookie(
  value: string,
  maxAge: number = DEFAULT_TTL_SECONDS,
): string {
  return `${COOKIE_NAME}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export function buildClearCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
