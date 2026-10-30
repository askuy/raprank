import { SITE } from './site';

const BRAND = ` — ${SITE.name}`.length;

/** First candidate that fits in `max` chars including " — RapRank". */
export function fitTitle(candidates: string[], max = 60) {
  return candidates.find((c) => c.length + BRAND <= max) ?? candidates[candidates.length - 1];
}

/** Join sentences until the next one would push past `max` chars. */
export function fitDescription(sentences: string[], max = 160) {
  let out = '';
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > max) break;
    out = next;
  }
  return out || sentences[0].slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}
