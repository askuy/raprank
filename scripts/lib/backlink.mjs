// Does `url` contain a followed link to raprank.org?
export async function linksToUs(url) {
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
