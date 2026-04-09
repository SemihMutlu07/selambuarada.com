import type { APIRoute } from 'astro';
import { listFiles, getFile } from '../../../lib/github-content';
import { parseMdx } from '../../../lib/frontmatter';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const files = await listFiles('src/content/blog');
    const mdxFiles = files.filter((f) => f.name.endsWith('.mdx'));

    const posts = await Promise.all(
      mdxFiles.map(async (f) => {
        try {
          const file = await getFile(f.path);
          if (!file) return null;
          const { meta } = parseMdx(file.content);
          const slug = f.name.replace(/\.mdx$/, '');
          return {
            slug,
            title: meta.title,
            date: meta.date,
            draft: meta.draft,
          };
        } catch {
          return null;
        }
      }),
    );

    const valid = posts.filter((p): p is NonNullable<typeof p> => p !== null);
    valid.sort((a, b) => (a.date < b.date ? 1 : -1));

    return new Response(JSON.stringify({ posts: valid }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
