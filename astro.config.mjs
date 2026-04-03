import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import keystatic from '@keystatic/astro';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://selambuarada.com',
  adapter: cloudflare(),
  integrations: [keystatic(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['@keystatic/astro', '@keystatic/core'],
    },
  },
});
