// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { isIndexable } from './src/lib/indexing.mjs';

export default defineConfig({
  site: 'https://raprank.org',
  trailingSlash: 'never',
  build: { format: 'file' },
  // Prefetch on hover makes full-page navigation feel instant.
  prefetch: { prefetchAll: true },
  integrations: [
    sitemap({ filter: (page) => isIndexable(new URL(page).pathname) }),
  ],
  vite: { plugins: [tailwindcss()] },
});
