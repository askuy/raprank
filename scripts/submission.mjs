#!/usr/bin/env node
// Turn an approved GitHub issue (submit-tool.yml form) into a tools.json entry.
// Used by .github/workflows/submission.yml; can also run locally:
//   ISSUE_BODY="$(gh issue view 12 --json body -q .body)" node scripts/submission.mjs
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { linksToUs } from './lib/backlink.mjs';

const FILE = 'src/data/tools.json';
const CATEGORY = {
  'AI Rap Video Generator': 'ai-rap-video',
  'AI Music Video Generator': 'ai-music-video',
  'Lip-Sync & Avatar': 'lip-sync-avatar',
  'AI Video Model': 'ai-video-models',
  'AI Rap Song Generator': 'ai-rap-song',
  'AI Music Generator': 'ai-music-generator',
  'AI Rapper Voice': 'ai-rapper-voice',
  'AI Rap Lyrics': 'ai-rap-lyrics',
};
const TAG = {
  'Lip-Sync': 'lip-sync', 'Lyric Video': 'lyric-sync', 'Beat-Synced': 'beat-sync', 'Photo to Video': 'photo-to-video',
  'No Sign-up': 'no-signup', 'Commercial License': 'commercial-license', 'Voice Cloning': 'voice-cloning', 'Mobile App': 'mobile-app', API: 'api',
};

/** GitHub issue forms render as "### Label\n\nvalue" blocks; empty fields are "_No response_". */
export function parseForm(body) {
  const out = {};
  for (const block of body.split(/^### /m).slice(1)) {
    const [label, ...rest] = block.split('\n');
    const value = rest.join('\n').trim();
    out[label.trim()] = value === '_No response_' ? '' : value;
  }
  return out;
}

const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function toTool(f) {
  const fail = (msg) => { throw new Error(msg); };
  const name = f['Tool name'] || fail('Missing tool name');
  let url;
  try { url = new URL(f['Website URL']).toString().replace(/\/$/, ''); } catch { fail(`Invalid URL: ${f['Website URL']}`); }
  const category = CATEGORY[f['Category']] ?? fail(`Unknown category: ${f['Category']}`);
  const pricing = { Free: 'free', 'Paid only': 'paid' }[f['Pricing']] ?? 'freemium';
  const tags = [...(f['Tags'] ?? '').matchAll(/- \[[xX]\] (.+)/g)].map((m) => TAG[m[1].trim()]).filter(Boolean);
  if (pricing === 'free') tags.unshift('free');
  const features = (f['Key features (one per line, 3–5)'] ?? '').split('\n').map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim()).filter(Boolean).slice(0, 5);
  const tool = {
    id: slug(name),
    name,
    url,
    category,
    tags,
    pricing,
    freeTier: f['Free plan and cheapest paid price'] || null,
    tagline: (f['One-line description'] || fail('Missing description')).replace(/\.$/, '').slice(0, 120),
    features,
    brandKeyword: name.toLowerCase(),
    listing: 'free',
    verified: true,
  };
  // Verified plan: only upgrade if the badge link is actually there.
  const badgeUrl = f['Page with the RapRank badge (Verified only)'];
  let note = '';
  if (f['Listing plan']?.startsWith('Verified')) {
    const r = badgeUrl ? await linksToUs(badgeUrl) : { ok: false, why: 'no badge page given' };
    if (r.ok) {
      tool.listing = 'badge';
      tool.backlink = { url: badgeUrl, checkedAt: new Date().toISOString().slice(0, 10) };
      note = '✅ Badge found, listed as Verified.';
    } else note = `⚠️ Badge not found (${r.why}), listed as Free. Re-run \`pnpm backlinks scan\` once it's live.`;
  }
  if (f['Listing plan']?.startsWith('Sponsored')) note = '💰 Asked about Sponsored: reply on the issue with pricing. Listed as Free until paid.';
  return { tool, note };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tools = JSON.parse(readFileSync(FILE, 'utf8'));
  const { tool, note } = await toTool(parseForm(process.env.ISSUE_BODY ?? ''));
  const host = (u) => new URL(u).hostname.replace(/^www\./, '');
  const dup = tools.find((t) => t.id === tool.id || host(t.url) === host(tool.url));
  if (dup) throw new Error(`Already listed as "${dup.id}" (${dup.url})`);
  if (process.env.ISSUE_NUMBER) tool.submittedIn = Number(process.env.ISSUE_NUMBER);
  tools.push(tool);
  writeFileSync(FILE, '[\n' + tools.map((t) => '  ' + JSON.stringify(t)).join(',\n') + '\n]\n');
  console.log(`Added ${tool.id} (${tool.listing}). ${note}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `id=${tool.id}\nname=${tool.name}\nnote=${note}\n`);
  }
}
