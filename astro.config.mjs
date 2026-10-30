// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

// Tag pages with fewer than 3 tools are noindex, so keep them out of the sitemap too.
const tools = JSON.parse(readFileSync('./src/data/tools.json', 'utf8')).filter((t) => t.verified);
const tagCounts = {};
for (const t of tools) for (const tag of t.tags) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
const thinTags = Object.keys(tagCounts).filter((k) => tagCounts[k] < 3);
const excluded = ['/search', '/404', ...thinTags.map((t) => `/tag/${t}`)];

export default defineConfig({
  site: 'https://raprank.org',
  trailingSlash: 'never',
  build: { format: 'file' },
  // Prefetch on hover makes full-page navigation feel instant.
  prefetch: { prefetchAll: true },
  integrations: [
    sitemap({ filter: (page) => !excluded.some((p) => new URL(page).pathname.replace(/\/$/, '') === p) }),
  ],
  vite: { plugins: [tailwindcss()] },
});
