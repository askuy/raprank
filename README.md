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
