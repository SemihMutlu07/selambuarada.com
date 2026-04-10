import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    og_image: z.string().optional(),
    meta_description: z.string().optional(),
    lang: z.enum(['tr', 'en', 'fr']).default('tr'),
    translationKey: z.string().optional(),
  }),
});

const films = defineCollection({
  loader: file('./src/content/films.json'),
  schema: z.object({
    title: z.string(),
    year: z.number(),
    role: z.string(),
    embedUrl: z.string().url(),
    description: z.string(),
    credits: z.array(z.object({
      role: z.string(),
      name: z.string(),
    })),
    bts: z.string().optional(),
  }),
});

export const collections = { blog, films };
