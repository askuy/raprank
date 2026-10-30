import { getCollection } from 'astro:content';
import { getTools, outboundRel, outboundUrl } from './data';

/**
 * Slim tool records for client-side games (same shape as prototypes/data.js,
 * plus `visit` = outbound URL with ref/affiliate applied).
 * Embed with: <script type="application/json" id="tools-data" set:html={JSON.stringify(tools)} />
 */
export async function getClientTools() {
  const categories = new Map((await getCollection('categories')).map((c) => [c.id, c.data.name]));
  return (await getTools()).map((t) => ({
    id: t.id,
    name: t.data.name,
    url: t.data.url,
    visit: outboundUrl(t),
    rel: outboundRel(t),
    domain: new URL(t.data.url).hostname.replace(/^www\./, ''),
    category: t.data.category.id,
    categoryName: categories.get(t.data.category.id)!,
    tags: t.data.tags.map((x) => x.id),
    tagline: t.data.tagline,
    features: t.data.features,
    pricing: t.data.pricing,
    freeTier: t.data.freeTier,
    featured: t.data.featured,
  }));
}

export async function getClientCategories() {
  return Object.fromEntries((await getCollection('categories')).map((c) => [c.id, c.data.name]));
}
