import { getCollection, type CollectionEntry } from 'astro:content';

export type Tool = CollectionEntry<'tools'>;
export type Category = CollectionEntry<'categories'>;
export type List = CollectionEntry<'lists'>;

const PRICING_ORDER = { free: 0, freemium: 1, paid: 2 } as const;

/** Featured and sponsored first, then by name. */
function rank(a: Tool, b: Tool) {
  const score = (t: Tool) => (t.data.sponsor ? 2 : 0) + (t.data.featured ? 1 : 0);
  return score(b) - score(a) || a.data.name.localeCompare(b.data.name);
}

export async function getTools() {
  return (await getCollection('tools', (t) => t.data.verified)).sort(rank);
}

export async function getToolMap() {
  return new Map((await getTools()).map((t) => [t.id, t]));
}

/** Directory tree: groups → categories → tools. */
export async function getTree() {
  const [groups, categories, tools] = await Promise.all([
    getCollection('groups'),
    getCollection('categories'),
    getTools(),
  ]);
  return groups
    .sort((a, b) => a.data.priority - b.data.priority)
    .map((group) => ({
      group,
      categories: categories
        .filter((c) => c.data.group.id === group.id)
        .sort((a, b) => a.data.priority - b.data.priority)
        .map((category) => ({
          category,
          tools: tools.filter((t) => t.data.category.id === category.id),
        })),
    }));
}

export async function getCategoryTools(categoryId: string) {
  return (await getTools()).filter((t) => t.data.category.id === categoryId);
}

export function hasFreeTier(t: Tool) {
  return t.data.pricing === 'free' || (t.data.pricing === 'freemium' && t.data.freeTier !== null);
}

/** Resolve a ranked list: explicit order, or a filter over all tools. */
export async function getListTools(list: List) {
  const tools = await getTools();
  if (list.data.tools) {
    const map = new Map(tools.map((t) => [t.id, t]));
    return list.data.tools.map((id) => {
      const t = map.get(id);
      if (!t) throw new Error(`List "${list.id}" references unknown or unverified tool "${id}"`);
      return t;
    });
  }
  const f = list.data.filter ?? {};
  const categories = await getCollection('categories');
  const groupOf = new Map(categories.map((c) => [c.id, c.data.group.id]));
  return tools
    .filter((t) => !f.categories || f.categories.includes(t.data.category.id))
    .filter((t) => !f.groups || f.groups.includes(groupOf.get(t.data.category.id)!))
    .filter((t) => !f.freeOnly || hasFreeTier(t))
    .sort(
      (a, b) =>
        PRICING_ORDER[a.data.pricing ?? 'paid'] - PRICING_ORDER[b.data.pricing ?? 'paid'] || rank(a, b),
    );
}

/** Hand-picked list if set; otherwise same-category tools first, then same-group tools. */
export async function getAlternatives(tool: Tool, limit = 12) {
  const [tools, categories] = await Promise.all([getTools(), getCollection('categories')]);
  if (tool.data.alternatives) {
    const map = new Map(tools.map((t) => [t.id, t]));
    return tool.data.alternatives.flatMap((id) => map.get(id) ?? []).slice(0, limit);
  }
  const groupOf = new Map(categories.map((c) => [c.id, c.data.group.id]));
  const group = groupOf.get(tool.data.category.id);
  const others = tools.filter((t) => t.id !== tool.id);
  const same = others.filter((t) => t.data.category.id === tool.data.category.id);
  const near = others.filter(
    (t) => t.data.category.id !== tool.data.category.id && groupOf.get(t.data.category.id) === group,
  );
  return [...same, ...near].slice(0, limit);
}

export function outboundUrl(t: Tool) {
  if (t.data.affiliateUrl) return t.data.affiliateUrl;
  const u = new URL(t.data.url);
  u.searchParams.set('ref', 'raprank.org');
  return u.toString();
}

export function hostname(t: Tool) {
  return new URL(t.data.url).hostname.replace(/^www\./, '');
}

export function pricingLabel(p: Tool['data']['pricing']) {
  return p ? { free: 'Free', freemium: 'Freemium', paid: 'Paid' }[p] : 'Pricing N/A';
}
