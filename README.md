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
