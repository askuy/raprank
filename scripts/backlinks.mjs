#!/usr/bin/env node
// Backlink checks for badge listings.
//   pnpm backlinks check   re-check every tool with listing "badge"; downgrade to "free" if the badge is gone
//   pnpm backlinks scan    look for links to raprank.org on every listed tool's homepage (finds new badge partners)
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/data/tools.json';
const tools = JSON.parse(readFileSync(FILE, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

async function linksToUs(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Mozilla/5.0 (RapRank backlink check)' } });
    if (!res.ok) return { ok: false, why: `HTTP ${res.status}` };
    const html = await res.text();
    // An <a> whose href points at raprank.org; ignore links marked nofollow.
    const links = [...html.matchAll(/<a\b[^>]*href=["']https?:\/\/(?:www\.)?raprank\.org[^"']*["'][^>]*>/gi)].map((m) => m[0]);
    if (!links.length) return { ok: false, why: 'no link to raprank.org' };
    if (links.every((l) => /rel=["'][^"']*nofollow/i.test(l))) return { ok: false, why: 'link is nofollow' };
    return { ok: true };
  } catch (e) {
    return { ok: false, why: e.name === 'TimeoutError' ? 'timeout' : e.message };
  }
}

async function check() {
  const partners = tools.filter((t) => t.listing === 'badge');
  if (!partners.length) return console.log('No badge listings yet.');
  let changed = false;
  for (const t of partners) {
    const r = t.backlink ? await linksToUs(t.backlink.url) : { ok: false, why: 'no backlink.url recorded' };
    if (r.ok) {
      t.backlink.checkedAt = today;
      console.log(`✅ ${t.id}  ${t.backlink.url}`);
    } else {
      console.log(`❌ ${t.id}  ${t.backlink?.url ?? ''}  (${r.why}) → downgraded to free`);
      t.listing = 'free';
    }
    changed = true;
  }
  if (changed) save();
}

async function scan() {
  const live = tools.filter((t) => t.verified && t.listing !== 'badge');
  const found = [];
  await Promise.all(
    live.map(async (t) => {
      const r = await linksToUs(t.url);
      if (r.ok) found.push(t);
    }),
  );
  if (!found.length) return console.log(`Scanned ${live.length} homepages: none link to raprank.org yet.`);
  for (const t of found) {
    t.listing = 'badge';
    t.backlink = { url: t.url, checkedAt: today };
    console.log(`🎉 ${t.id} links to us from ${t.url} → listing set to badge`);
  }
  save();
}

function save() {
  writeFileSync(FILE, '[\n' + tools.map((t) => '  ' + JSON.stringify(t)).join(',\n') + '\n]\n');
  console.log(`Updated ${FILE}. Rebuild and deploy to publish.`);
}

const cmd = process.argv[2];
if (cmd === 'check') await check();
else if (cmd === 'scan') await scan();
else console.log('Usage: pnpm backlinks check | pnpm backlinks scan');
