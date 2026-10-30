#!/usr/bin/env node
// SEO checks on the built site (run after `pnpm build`). Mirrors the launch checklist:
// per-page head tags, one H1, JSON-LD, internal links, sitemap, robots.txt, llms.txt.
// Exit code 1 on errors; warnings are printed but don't fail.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const SITE = 'https://raprank.org';
const errors = [];
const warnings = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));

/** URL path → file in dist (clean URLs: /tool/x → tool/x.html). */
function fileFor(path) {
  const p = decodeURIComponent(path.split(/[?#]/)[0]).replace(/\/$/, '') || '/';
  if (p === '/') return join(DIST, 'index.html');
  for (const c of [p, `${p}.html`, `${p}/index.html`]) {
    const f = join(DIST, c);
    if (existsSync(f) && statSync(f).isFile()) return f;
  }
  return null;
}
const urlFor = (file) => {
  const r = '/' + relative(DIST, file).replace(/\.html$/, '').replace(/(^|\/)index$/, '');
  return SITE + (r === '/' ? '/' : r.replace(/\/$/, ''));
};

const meta = (html, attr, name) => html.match(new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`, 'i'))?.[1] ?? html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${name}"`, 'i'))?.[1];
const decode = (s) => s?.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const titles = new Map();
const descs = new Map();
const pages = new Map(); // url → { noindex, canonical }

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const url = urlFor(file);
  const page = url.replace(SITE, '') || '/';
  const robots = meta(html, 'name', 'robots') ?? '';
  const noindex = /noindex/.test(robots);
  const is404 = page === '/404';

  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1]);
  const desc = decode(meta(html, 'name', 'description'));
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1];
  pages.set(url, { noindex, canonical });

  if (!title) err(page, 'missing <title>');
  else {
    if (!noindex) titles.set(title, [...(titles.get(title) ?? []), page]);
    if (!noindex && (title.length < 25 || title.length > 70)) warn(page, `title is ${title.length} chars (aim 50–60): "${title}"`);
  }
  if (!desc) err(page, 'missing meta description');
  else {
    if (!noindex) descs.set(desc, [...(descs.get(desc) ?? []), page]);
    if (!noindex && (desc.length < 70 || desc.length > 170)) warn(page, `description is ${desc.length} chars (aim 140–160)`);
  }
  if (!robots) err(page, 'missing meta robots');
  if (/<meta[^>]*name="keywords"/i.test(html)) err(page, 'has meta keywords');

  if (!canonical) err(page, 'missing canonical');
  else {
    if (!canonical.startsWith('https://')) err(page, `canonical not absolute https: ${canonical}`);
    if (canonical.includes('#')) err(page, 'canonical contains #');
    if (!is404 && canonical !== url) err(page, `canonical ${canonical} ≠ page URL ${url}`);
  }

  for (const p of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:type']) {
    if (!meta(html, 'property', p)) err(page, `missing ${p}`);
  }
  if (meta(html, 'property', 'og:url') !== canonical) err(page, 'og:url ≠ canonical');
  const ogImage = meta(html, 'property', 'og:image');
  if (ogImage && !fileFor(new URL(ogImage).pathname)) err(page, `og:image not found in build: ${ogImage}`);
  if (meta(html, 'name', 'twitter:card') !== 'summary_large_image') err(page, 'twitter:card is not summary_large_image');

  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) err(page, `${h1s} <h1> tags (want exactly 1)`);

  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  if (ld.length > 1) warn(page, `${ld.length} JSON-LD scripts (want one @graph)`);
  for (const [, json] of ld) {
    try {
      const data = JSON.parse(json);
      if (JSON.stringify(data).includes('aggregateRating')) err(page, 'JSON-LD has aggregateRating');
    } catch {
      err(page, 'JSON-LD does not parse');
    }
  }
  if (!noindex && !is404 && ld.length === 0) warn(page, 'no JSON-LD');

  for (const icon of html.matchAll(/<link[^>]*rel="(?:icon|apple-touch-icon)"[^>]*href="([^"]*)"/g)) {
    if (!fileFor(icon[1])) err(page, `icon not found: ${icon[1]}`);
  }

  // Internal links must resolve to a built file (no soft 404s, no #/ routes).
  const markup = html.replace(/<script[\s\S]*?<\/script>/g, ''); // links built inside JS aren't crawlable anyway
  for (const [, href] of markup.matchAll(/<a\b[^>]*\shref="([^"]*)"/g)) {
    if (href.startsWith('#/') || href.includes('/#/')) err(page, `hash route link: ${href}`);
    let path;
    if (href.startsWith('/') && !href.startsWith('//')) path = href;
    else if (href.startsWith(SITE)) path = href.slice(SITE.length) || '/';
    else continue;
    if (path.startsWith('/#')) continue;
    if (!fileFor(path)) err(page, `broken internal link: ${href}`);
  }
}

for (const [t, ps] of titles) if (ps.length > 1) err(ps.join(', '), `duplicate title "${t}"`);
for (const [d, ps] of descs) if (ps.length > 1) err(ps.join(', '), `duplicate description "${d.slice(0, 50)}…"`);

// Sitemap: only canonical, indexable, existing pages.
const smIndex = readFileSync(join(DIST, 'sitemap-index.xml'), 'utf8');
const smUrls = [...smIndex.matchAll(/<loc>([^<]*)<\/loc>/g)].flatMap(([, loc]) => {
  const f = join(DIST, new URL(loc).pathname);
  if (!existsSync(f)) return err('sitemap', `listed sitemap missing: ${loc}`), [];
  return [...readFileSync(f, 'utf8').matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
});
for (const loc of smUrls) {
  const p = pages.get(loc) ?? pages.get(loc.replace(/\/$/, ''));
  if (!p) err('sitemap', `URL has no page: ${loc}`);
  else if (p.noindex) err('sitemap', `noindex page in sitemap: ${loc}`);
  else if (p.canonical !== loc) err('sitemap', `non-canonical URL: ${loc}`);
}
for (const [url, p] of pages) {
  if (!p.noindex && !url.endsWith('/404') && !smUrls.includes(url)) warn('sitemap', `indexable page not in sitemap: ${url}`);
}

const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
const smLine = robots.match(/^Sitemap:\s*(\S+)/m)?.[1];
if (!smLine) err('robots.txt', 'no Sitemap: line');
else if (!fileFor(new URL(smLine).pathname)) err('robots.txt', `Sitemap target missing: ${smLine}`);
if (/^Disallow:\s*\/\s*$/m.test(robots)) err('robots.txt', 'disallows the whole site');

const llms = existsSync(join(DIST, 'llms.txt')) ? readFileSync(join(DIST, 'llms.txt'), 'utf8') : null;
if (!llms) err('llms.txt', 'missing');
else for (const [, href] of llms.matchAll(/\]\((https:\/\/raprank\.org[^)]*)\)/g)) {
  if (!fileFor(new URL(href).pathname)) err('llms.txt', `broken link: ${href}`);
}

console.log(`Checked ${htmlFiles.length} pages, ${smUrls.length} sitemap URLs.`);
if (warnings.length) console.log(`\n⚠️  ${warnings.length} warning(s):\n` + warnings.map((w) => '  ' + w).join('\n'));
if (errors.length) {
  console.log(`\n❌ ${errors.length} error(s):\n` + errors.map((e) => '  ' + e).join('\n'));
  process.exit(1);
}
console.log('\n✅ No errors.');
