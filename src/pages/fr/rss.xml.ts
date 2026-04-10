import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { getSlugFromId } from '../../i18n/utils';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft && data.lang === 'fr');
  posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Semih Mutlu',
    description: 'Articles sur la technologie, la science et la vie.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/fr/blog/${getSlugFromId(post.id)}/`,
    })),
  });
}
