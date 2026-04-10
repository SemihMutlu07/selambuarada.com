import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://selambuarada.com',
  adapter: vercel(),
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/write') &&
        !page.includes('/en/iletisim') &&
        !page.includes('/fr/iletisim'),
      i18n: {
        defaultLocale: 'tr',
        locales: {
          tr: 'tr-TR',
          en: 'en-US',
          fr: 'fr-FR',
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en', 'fr'],
    fallback: {
      en: 'tr',
      fr: 'tr',
    },
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
      fallbackType: 'rewrite',
    },
  },
});
