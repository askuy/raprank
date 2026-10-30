// Which URLs search engines may index. Used by Base.astro (meta robots) and
// astro.config.mjs (sitemap), so the two never disagree.
//
// A new, unlinked domain shouldn't expose 100 thin pages at once. Only pages
// with real substance are indexable; the rest stay live for users (noindex, follow)
// and get opened up one by one as their content gets thicker.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PAGES = new Set([
  '/',
  '/best',
  '/battle',
  '/arena',
  '/about',
  '/free-tools',
  '/rap-lyrics-generator',
  '/rap-name-generator',
  '/alternatives/suno', // "suno alternative" has real demand
]);
const PREFIXES = ['/best/'];

// Tool pages opt in with `"index": true` in tools.json once they have real review content.
const tools = JSON.parse(readFileSync(join(process.cwd(), 'src/data/tools.json'), 'utf8'));
const indexedTools = new Set(tools.filter((t) => t.verified && t.index).map((t) => `/tool/${t.id}`));

// Battle pages are indexable once at least one round has both samples published.
const BATTLES = 'src/data/battles';
const media = (m) => m && existsSync(join(process.cwd(), 'public', m));
const indexedBattles = new Set(
  readdirSync(join(process.cwd(), BATTLES))
    .filter((f) => f.endsWith('.json'))
    .filter((f) => JSON.parse(readFileSync(join(process.cwd(), BATTLES, f), 'utf8')).rounds.some((r) => media(r.a.media) && media(r.b.media)))
    .map((f) => `/battle/${f.replace(/\.json$/, '')}`),
);

export function isIndexable(pathname) {
  const p = pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  return PAGES.has(p) || PREFIXES.some((x) => p.startsWith(x)) || indexedTools.has(p) || indexedBattles.has(p);
}
