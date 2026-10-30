#!/usr/bin/env node
// Backlink checks for badge listings.
//   pnpm backlinks check   re-check every tool with listing "badge"; downgrade to "free" if the badge is gone
//   pnpm backlinks scan    look for links to raprank.org on every listed tool's homepage (finds new badge partners)
import { readFileSync, writeFileSync } from 'node:fs';
import { linksToUs } from './lib/backlink.mjs';

const FILE = 'src/data/tools.json';
const tools = JSON.parse(readFileSync(FILE, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

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
