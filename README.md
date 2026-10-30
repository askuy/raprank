# RapRank

The static Astro directory site for AI rap and music video tools: https://raprank.org

```sh
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # outputs static HTML to dist/; deploy to Cloudflare Pages / Vercel / Netlify
```

## Data model (based on mkdirs: group → category → item)

All data lives in `src/data/*.json`, and its schema is checked by `src/content.config.ts`:

| File | Purpose | Generated pages |
|---|---|---|
| `groups.json` | Top-level groups (Video / Audio / Writing) | Groups in the directory tree |
| `categories.json` | Categories (`group` points to a group) | `/category`, `/category/[id]` |
| `tags.json` | Tags | `/tag/[id]` (noindex if it has fewer than 3 tools) |
| `tools.json` | Listed tools | `/tool/[id]`; `/alternatives/[id]` when `alternativesPage: true` |
| `collections.json` | Ranked lists (`tools` for a manual order, or `filter`) | `/best/[id]` |

Adding a tool means adding one object to `tools.json`. Only `verified: true` tools get published. `featured` / `sponsor` move a tool up the ranking. `affiliateUrl` replaces the outbound link. If it is not set, the link gets `?ref=raprank.org` appended automatically.

Standalone tool page: `/rap-name-generator` (runs entirely in the browser).

## Battles (blind tests): everything is generated locally

Each battle is one file, `src/data/battles/<a>-vs-<b>.json`, holding the roast lyrics, the prompt for each round, and the media paths. Media goes in `public/battles/<id>/`.

1. Create a battle: `pnpm battle new suno udio audio` (use `video` for video tools)
2. In **each** tool, use the exact same `prompt` / `inputs` as the JSON. **Keep the first generation** (no cherry-picking) and trim both to the same length.
3. Name the exports after the `media` field (e.g. `1-suno.mp3`, `1-udio.mp3`) and put them in `public/battles/<id>/`.
4. `pnpm battle check` shows which files are still missing. A round with missing files shows "samples coming" on the site, and the build still passes.

Suggested formats: audio as mp3 128–192 kbps, about 30s; video as mp4 H.264 720p, about 15–30s, kept under 5 MB each.

## Deploy (Cloudflare Workers Static Assets)

`wrangler.jsonc` serves `dist/` as static files only (no server code) and binds raprank.org and www.raprank.org. www is 301-redirected to the apex domain by a Cloudflare Redirect Rule.

```sh
export CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=...   # never commit these
pnpm run deploy   # note: `pnpm deploy` is a built-in pnpm command, so you must use run
```

Note: don't use `wrangler pages ...`. New versions of wrangler auto-install the SSR adapter and modify the astro config.

## Listings and backlinks

The `listing` field in `tools.json` decides how outbound links are marked and where the tool ranks:

| listing | rel | Ranking | How to get it |
|---|---|---|---|
| `free` (default) | `nofollow` | Normal | Submit and pass manual review |
| `badge` | dofollow | Higher, with ✓ Verified | Add the /badge code to your own site; record it in `backlink: {url, checkedAt}` |
| `sponsor` | `sponsored` | Pinned first | Paid (price in `LISTING.sponsorPrice` in `src/lib/site.ts`) |

Tools with `affiliateUrl` always get `sponsored`.

```sh
pnpm backlinks scan    # scan every tool's homepage; any that link to raprank.org are auto-upgraded to badge
pnpm backlinks check   # re-check badge tools; auto-downgrade to free if the badge is gone (run about weekly)
```

## SEO

Implemented following the "SEO 落地" checklist:
- **head**: every page has its own title (content first, brand last, ≤60 chars), description, robots meta, self-referencing canonical, full OG/Twitter tags, and a 1200×630 OG image (generated at build time by `src/lib/og.ts`; edit card copy in `src/lib/og-pages.ts`)
- **JSON-LD**: one `@graph` per page; the home page declares Organization/WebSite and other pages reference them by `@id`. Lists use CollectionPage + ItemList, tools use SoftwareApplication, generators/arena use WebApplication
- **Root files**: `robots.txt`, `sitemap-index.xml` (noindex pages excluded), `llms.txt` (generated from data)
- **Icons**: `public/favicon.svg` is the source; after changing it, run `node scripts/make-icons.mjs` to regenerate apple-touch-icon / logo / ico

```sh
pnpm build && pnpm seo:check   # checks all pages: head tags, one H1, JSON-LD, broken internal links, sitemap, robots, llms.txt
```

### Indexing scope (indexability)

A new site should only expose substantial pages first. **Every** page's robots meta and the sitemap are decided by `src/lib/indexing.mjs`:
- Indexable: home, `/best/*`, free tools, arena, `/about`, `/alternatives/suno`
- Battle pages: become indexable **automatically** once at least one round has both samples
- Tool pages: add `"index": true` in `tools.json` once the review content is thorough
- Everything else (tags, categories, other tool pages, …) is `noindex, follow`: users can still reach them, links still pass on, they just aren't indexed yet
