import type { APIRoute } from 'astro';
import { composeMdx, type PostMeta } from '../../../lib/frontmatter';
import { commitFile, deleteFile, getFile } from '../../../lib/github-content';
import { slugify } from '../../../lib/slug';

export const prerender = false;

interface SavePayload {
  action: 'draft' | 'publish';
  meta: {
    title: string;
    subtitle?: string;
    description?: string;
    date?: string;
    tags?: string[];
    slug?: string;
    og_image?: string;
    meta_description?: string;
  };
  body: string; // markdown
  originalSlug?: string;
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function buildPath(slug: string): string {
  return `src/content/blog/tr/${slug}.mdx`;
}

export const POST: APIRoute = async ({ request }) => {
  let payload: SavePayload;
  try {
    payload = (await request.json()) as SavePayload;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const title = (payload.meta?.title || '').trim();
  if (!title) {
    return new Response(JSON.stringify({ error: 'title is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const slug = (payload.meta.slug && payload.meta.slug.trim()) || slugify(title);
  if (!slug) {
    return new Response(JSON.stringify({ error: 'could not derive slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const description =
    (payload.meta.description || payload.meta.subtitle || '').trim() || title;

  const meta: PostMeta = {
    title,
    date: payload.meta.date || todayISO(),
    description,
    tags: Array.isArray(payload.meta.tags) ? payload.meta.tags.filter(Boolean) : [],
    draft: payload.action === 'draft',
    og_image: payload.meta.og_image || undefined,
    meta_description: payload.meta.meta_description || undefined,
  };

  const mdx = composeMdx(meta, payload.body || '');
  const path = buildPath(slug);

  try {
    // If editing an existing file (originalSlug provided OR same-slug exists),
    // we need its current sha for the PUT.
    const existing = await getFile(path);
    const commitMessage =
      payload.action === 'publish'
        ? `post: publish ${slug}`
        : `post: draft ${slug}`;

    await commitFile({
      path,
      content: mdx,
      message: commitMessage,
      sha: existing?.sha,
    });

    // If the slug changed during an edit, remove the old file in a follow-up commit.
    if (
      payload.originalSlug &&
      payload.originalSlug !== slug
    ) {
      const oldPath = buildPath(payload.originalSlug);
      const old = await getFile(oldPath);
      if (old) {
        await deleteFile({
          path: oldPath,
          sha: old.sha,
          message: `post: rename ${payload.originalSlug} → ${slug}`,
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        slug,
        url: `/blog/${slug}`,
        action: payload.action,
        savedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
