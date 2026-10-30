// Which pages get their own OG image, and what it says. Keys are URL paths without
// the leading slash ("index" for home); images are served at /og/<key>.png.
import { getCollection } from 'astro:content';
import { getCategoryTools, getTools, pricingLabel } from './data';
import { getBattles } from './battles';
import type { OgCard } from './og';

let cache: Map<string, OgCard> | undefined;

export async function getOgPages() {
  if (cache) return cache;
  const pages = new Map<string, OgCard>();
  const tools = await getTools();

  pages.set('index', { kicker: 'AI rap battles · tools directory', title: 'AI rap tools, battling it out', subtitle: `Roasts, blind tests and ${tools.length} AI rap & music video tools compared.` });
  pages.set('default', { kicker: 'RapRank', title: 'The AI rap & music video tools directory', subtitle: 'Battles, blind tests, rankings and free tools.' });
  pages.set('arena', { kicker: 'Battle arena', title: 'AI rap battle: tool vs tool', subtitle: 'Pick two AI tools, drop the beat, judge the roast.' });
  pages.set('battle', { kicker: 'Blind tests', title: 'Same prompt. Real outputs. You pick.', subtitle: 'Head-to-head blind tests of AI music and rap video tools.' });
  pages.set('rap-name-generator', { kicker: 'Free tool', title: 'Rap Name Generator', subtitle: '20 rapper names per click: trap, drill, old school, Lil/Young.' });
  pages.set('rap-lyrics-generator', { kicker: 'Free tool', title: 'Rap Lyrics Generator', subtitle: 'Rhyming 16-bar verses and full songs, rhymes color-coded.' });
  pages.set('category', { kicker: 'Directory', title: 'All AI rap & music video tool categories' });
  pages.set('best', { kicker: 'Best-of lists', title: 'The best AI rap & music video tools, ranked' });
  pages.set('alternatives', { kicker: 'Alternatives', title: 'Alternatives to Suno, Udio, Freebeat & more' });

  for (const t of tools) {
    pages.set(`tool/${t.id}`, { kicker: `${pricingLabel(t.data.pricing)} · ${t.data.category.id.replace(/-/g, ' ')}`, title: t.data.name, subtitle: t.data.tagline });
  }
  for (const c of await getCollection('categories')) {
    const n = (await getCategoryTools(c.id)).length;
    pages.set(`category/${c.id}`, { kicker: `${n} tools compared`, title: c.data.title, subtitle: c.data.description });
  }
  for (const l of await getCollection('lists')) {
    pages.set(`best/${l.id}`, { kicker: 'Ranked list', title: l.data.title, subtitle: l.data.description });
  }
  for (const t of tools.filter((x) => x.data.alternativesPage)) {
    pages.set(`alternatives/${t.id}`, { kicker: 'Alternatives', title: `Best ${t.data.name} alternatives`, subtitle: `Tools that do what ${t.data.name} does, with pricing and free plans compared.` });
  }
  for (const { battle, a, b } of await getBattles()) {
    pages.set(`battle/${battle.id}`, { kicker: 'Blind test', title: `${a.data.name} vs ${b.data.name}`, vs: [a.data.name, b.data.name], subtitle: 'Same prompt in both tools. Listen blind, then vote.' });
  }
  cache = pages;
  return pages;
}

export async function ogImageFor(pathname: string) {
  const key = pathname.replace(/^\/|\.html$|\/$/g, '') || 'index';
  return (await getOgPages()).has(key) ? `/og/${key}.png` : '/og/default.png';
}
