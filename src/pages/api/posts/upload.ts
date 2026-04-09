import type { APIRoute } from 'astro';
import { commitFile } from '../../../lib/github-content';
import { slugify } from '../../../lib/slug';

export const prerender = false;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_PREFIXES = ['image/'];

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse(400, { error: 'invalid form data' });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return jsonResponse(400, { error: 'file field missing' });
  }
  if (file.size === 0) {
    return jsonResponse(400, { error: 'empty file' });
  }
  if (file.size > MAX_BYTES) {
    return jsonResponse(413, { error: `file too large (max ${MAX_BYTES} bytes)` });
  }
  if (!ALLOWED_PREFIXES.some((p) => file.type.startsWith(p))) {
    return jsonResponse(415, { error: `unsupported file type: ${file.type}` });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  const originalName = file.name || 'upload';
  const dotIdx = originalName.lastIndexOf('.');
  const rawExt =
    dotIdx > 0 ? originalName.slice(dotIdx + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const ext = rawExt || file.type.split('/')[1] || 'bin';
  const stem = dotIdx > 0 ? originalName.slice(0, dotIdx) : originalName;
  const safeStem = slugify(stem) || 'image';
  const filename = `${Date.now()}-${safeStem}.${ext}`;
  const path = `public/uploads/${filename}`;

  try {
    await commitFile({
      path,
      content: bytes,
      message: `upload: ${filename}`,
    });
    return jsonResponse(200, {
      ok: true,
      url: `/uploads/${filename}`,
      alt: safeStem,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'upload failed';
    return jsonResponse(500, { error: message });
  }
};
