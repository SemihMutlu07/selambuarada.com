import { config, collection, fields } from '@keystatic/core';
import { block } from '@keystatic/core/content-components';

function turkishSlugify(text: string): string {
  const charMap: Record<string, string> = {
    'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',
    'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o',
    'ı': 'i', 'İ': 'i', 'ç': 'c', 'Ç': 'c',
  };
  return text
    .split('')
    .map((c) => charMap[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const storage = import.meta.env.DEV
  ? ({ kind: 'local' } as const)
  : ({
      kind: 'github',
      repo: 'SemihMutlu07/selambuarada.com',
    } as const);

export default config({
  storage,
  collections: {
    blog: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: { label: 'Title' },
          slug: {
            generate: turkishSlugify,
          },
        }),
        date: fields.date({
          label: 'Date',
          validation: { isRequired: true },
        }),
        description: fields.text({
          label: 'Description',
          validation: { isRequired: true },
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        draft: fields.checkbox({
          label: 'Draft',
          defaultValue: false,
        }),
        og_image: fields.text({ label: 'OG Image URL' }),
        meta_description: fields.text({
          label: 'Meta Description',
          multiline: true,
        }),
        content: fields.mdx({
          label: 'Content',
          options: {
            bold: true,
            italic: true,
            strikethrough: true,
            heading: [1, 2, 3],
            orderedList: true,
            unorderedList: true,
            blockquote: true,
            code: true,
            codeBlock: true,
            link: true,
            image: true,
          },
          components: {
            BlogImage: block({
              label: 'Blog Image',
              schema: {
                src: fields.text({ label: 'Image URL', validation: { isRequired: true } }),
                alt: fields.text({ label: 'Alt Text', validation: { isRequired: true } }),
                layout: fields.select({
                  label: 'Layout',
                  options: [
                    { label: 'Hero (full width, top)', value: 'hero' },
                    { label: 'Full Width', value: 'full' },
                    { label: 'Float Left', value: 'left' },
                    { label: 'Float Right', value: 'right' },
                    { label: 'Inline (centered)', value: 'inline' },
                  ],
                  defaultValue: 'inline',
                }),
                caption: fields.text({ label: 'Caption' }),
              },
            }),
            SpotifyEmbed: block({
              label: 'Spotify Embed',
              schema: {
                url: fields.text({ label: 'Spotify URL', validation: { isRequired: true } }),
              },
            }),
            YouTubeEmbed: block({
              label: 'YouTube Embed',
              schema: {
                url: fields.text({ label: 'YouTube URL', validation: { isRequired: true } }),
              },
            }),
          },
        }),
      },
    }),
  },
});
