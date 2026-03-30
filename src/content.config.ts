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
  }),
});

const projects = defineCollection({
  loader: file('./src/content/projects.json'),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tech: z.array(z.string()),
    url: z.string().url().optional(),
    github: z.string().url().optional(),
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
  }),
});

const photosets = defineCollection({
  loader: file('./src/content/photosets.json'),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
    })),
  }),
});

export const collections = { blog, projects, films, photosets };
