import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const groups = defineCollection({
  loader: file('src/data/groups.json'),
  schema: z.object({ name: z.string(), priority: z.number() }),
});

const categories = defineCollection({
  loader: file('src/data/categories.json'),
  schema: z.object({
    name: z.string(),
    group: reference('groups'),
    priority: z.number(),
    title: z.string(),
    description: z.string(),
    intro: z.string(),
  }),
});

const tags = defineCollection({
  loader: file('src/data/tags.json'),
  schema: z.object({ name: z.string() }),
});

const tools = defineCollection({
  loader: file('src/data/tools.json'),
  schema: z.object({
    name: z.string(),
    url: z.url(),
    // Affiliate link takes precedence over url for outbound clicks.
    affiliateUrl: z.url().optional(),
    category: reference('categories'),
    tags: z.array(reference('tags')).default([]),
    tagline: z.string(),
    features: z.array(z.string()).default([]),
    pricing: z.enum(['free', 'freemium', 'paid']).nullable(),
    freeTier: z.string().nullable(),
    brandKeyword: z.string(),
    featured: z.boolean().default(false),
    sponsor: z.boolean().default(false),
    alternativesPage: z.boolean().default(false),
    // Hand-picked, ordered alternatives; unverified ids are skipped.
    alternatives: z.array(z.string()).optional(),
    // Unverified tools are kept in data but not published.
    verified: z.boolean().default(false),
  }),
});

const lists = defineCollection({
  loader: file('src/data/collections.json'),
  schema: z.object({
    keyword: z.string(),
    title: z.string(),
    description: z.string(),
    intro: z.string(),
    // Either an explicit ranked list or a filter.
    tools: z.array(z.string()).optional(),
    filter: z
      .object({
        groups: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
        freeOnly: z.boolean().optional(),
      })
      .optional(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

// One JSON file per matchup in src/data/battles; media lives in public/battles/<id>/.
const side = z.object({
  // Path under public/, e.g. "/battles/suno-vs-udio/suno-1.mp3". Missing files show a placeholder.
  media: z.string().optional(),
  note: z.string().optional(),
});

const battles = defineCollection({
  loader: glob({ pattern: '*.json', base: 'src/data/battles' }),
  schema: z.object({
    a: reference('tools'),
    b: reference('tools'),
    mediaType: z.enum(['audio', 'video']),
    date: z.string(),
    intro: z.string(),
    roast: z.object({ a: z.array(z.string()).length(4), b: z.array(z.string()).length(4) }),
    rounds: z.array(
      z.object({
        title: z.string(),
        // The exact prompt/settings used in both tools, so the test is fair and repeatable.
        prompt: z.string(),
        inputs: z.string().optional(),
        a: side,
        b: side,
      }),
    ),
    verdict: z.string().optional(),
  }),
});

export const collections = { groups, categories, tags, tools, lists, battles };
