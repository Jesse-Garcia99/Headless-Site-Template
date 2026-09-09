# Site quality contract

Every agent changing this site must leave its affected pages more complete than it found them. Make safe, in-scope updates directly rather than merely reporting obvious omissions.

- Before shipping, run `npm run build`, `npm run audit:seo`, and `npm run audit:discovery`.
- Keep `src/content/site.json` accurate: `siteUrl` must be the production HTTPS custom domain; set `socialImage`, `favicon`, and local-business details before launch.
- Every indexable page needs one descriptive `h1`, a unique title and description, a canonical URL, and crawlable internal links. Use the shared metadata helpers rather than hand-writing tags.
- Provide meaningful alt text for informative images. Decorative images must use an empty alt string deliberately.
- Add new public pages to `app/sitemap.ts`; do not include previews, admin, API endpoints, or 404 pages.
- Preserve `app/robots.ts`, `app/sitemap.ts`, `app/not-found.tsx`, structured data, and social metadata when refactoring.
- Preserve `worker/index.ts` agent delivery: every public HTML page must retain its generated Markdown counterpart, `Accept: text/markdown` must return that counterpart with `Vary: Accept`, and the Content Signals policy must be sent both in `robots.txt` and response headers. Do not expose `/__agent-markdown/` directly.
- Do not hand-edit `out/` or its `/__agent-markdown/` directory. `npm run build` regenerates both the static site and the Markdown representations.
- Never add development overlays, placeholder copy, source maps, or unhandled console errors to production. Keep client JavaScript minimal and lazy-load optional interactivity.
- When a task uncovers a crawler, accessibility, metadata, or console issue that can be fixed safely in the touched code, fix it in the same change and rerun validation.
- Never publish a discovery document (`.well-known/agent-card.json`, `openapi.json`, `.well-known/api-catalog`, `.well-known/agent-skills/index.json`, `.well-known/mcp/server-card.json`) describing an endpoint, capability, or issuer that doesn't actually exist and work. The `discovery` config in `src/content/site.json` ships empty; only fill in a section once the thing it describes is real. See docs/agent-operations.md for the full contract.

Read [docs/agent-operations.md](docs/agent-operations.md) before launch work, deployment changes, or adding routes. It separates one-time launch setup from recurring change requirements.

Deployment tasks still require a human with provider access: attach the custom domain, set the production `SITE_URL`, submit the generated sitemap in Search Console, and resolve provider-reported indexing or DNS errors.
