// llms.txt (https://llmstxt.org): a Markdown map of stable pages for agents. Only stable URLs.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, FREE_TOOLS } from '../lib/site';
import { getTools } from '../lib/data';
import { battleTitle, getBattles } from '../lib/battles';

export const GET: APIRoute = async () => {
  const u = (p: string) => new URL(p, SITE.url).toString();
  const [tools, categories, lists, battles] = await Promise.all([getTools(), getCollection('categories'), getCollection('lists'), getBattles()]);
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    'Pricing and free-plan details are checked by hand; confirm on the official site before buying. Battle pages are blind tests that use the same prompt in both tools.',
    '',
    '## Start here',
    `- [Home](${u('/')}): tonight's battle, directory overview`,
    `- [All categories](${u('/category')}): the directory tree`,
    `- [Best-of lists](${u('/best')}): ranked lists with comparison tables`,
    `- [Battles](${u('/battle')}): blind tests, same prompt in two tools`,
    `- [Arena](${u('/arena')}): pick any two tools and make them battle`,
    '',
    '## Categories',
    ...categories.sort((a, b) => a.data.priority - b.data.priority).map((c) => `- [${c.data.title}](${u(`/category/${c.id}`)}): ${c.data.description}`),
    '',
    '## Rankings',
    ...lists.map((l) => `- [${l.data.title}](${u(`/best/${l.id}`)}): ${l.data.description}`),
    '',
    '## Battles',
    ...battles.map(({ battle, a, b }) => `- [${battleTitle(a, b)}](${u(`/battle/${battle.id}`)}): ${battle.data.intro}`),
    '',
    '## Tools',
    ...tools.map((t) => `- [${t.data.name}](${u(`/tool/${t.id}`)}): ${t.data.tagline}`),
    '',
    '## Free tools',
    ...FREE_TOOLS.map((t) => `- [${t.name}](${u(t.href)}): ${t.blurb}`),
    '',
    '## Optional',
    `- [Submit a tool](${u('/submit')})`,
    `- [About](${u('/about')})`,
    `- [Source on GitHub](https://github.com/askuy/raprank)`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
