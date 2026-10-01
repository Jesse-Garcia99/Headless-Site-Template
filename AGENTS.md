# Site quality contract

Every agent changing this site must leave its affected pages more complete than it found them. Make safe, in-scope updates directly rather than merely reporting obvious omissions.

- Before shipping, run `npm run build`, `npm run audit:seo`, `npm run audit:responsive`, and `npm run audit:discovery`. `audit:seo` is the production-build checklist (titles, descriptions, canonicals, headings, alt text, breadcrumbs, favicon, social image, robots, sitemap, llms.txt, 404, structured data, no Vite overlay, no source maps, no placeholder copy, internal links, JS budget). `audit:responsive` is the breakpoint checklist (viewport meta, no unguarded fixed widths above ~380px, tables/pre/images can't overflow small screens, root overflow isn't masked). Custom domain attachment in Cloudflare remains a human step.
- On a new site's initial build, run `npm run launch:issues` to file the launch checklist as individual GitHub issues (requires `gh auth`), then work them one at a time.
- On project init, install the standard agent tooling: `npm i -D impeccable && npx impeccable install` (design anti-pattern detection + skills) and `uv tool install graphifyy` then `graphify update .` (builds `graphify-out/`). Both tools' output is regenerable — never commit it: `graphify-out/`, `.impeccable/`, `**/skills/impeccable/`, `**/agents/impeccable-*`, `**/hooks/impeccable.json`, `.cursor/hooks.json`, and `.codex/hooks.json` are all gitignored; only the npm devDependency and ignore rules belong in git. Then use them when relevant: `graphify query "<question>"` before raw file browsing, `graphify path "<A>" "<B>"` for relationships, `graphify explain "<concept>"` for focused concepts, `graphify-out/wiki/index.md` for navigation; re-run `graphify update .` after modifying code. Run `npx impeccable detect` before shipping visual/UI changes.
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

## Workspace standards

- Comments: follow the code-comment-writer skill (<https://skills.rest/skill/code-comment-writer>). Why over what, minimal, no commented-out code.
- UI/design work: use design-taste-frontend, gpt-taste, impeccable (<https://www.tasteskill.dev/>).
- Always use graphify for codebase questions (`graphify query "<q>"` before raw browsing); `graphify update .` after code changes.
- Long-form docs live in the Obsidian vault (`~/Documents/Obsidian Vault/<project-folder>/`); code keeps a one-line pointer. Extend an existing related note; group docs by feature, never a doc per issue.
- Never place files directly in `~/developer` or `~/developer/Code`; everything goes inside a project folder.

## Delegation

- Offload simple, self-contained work (searches, file lookups, mechanical edits, single-file checks) to subagents; keep the hard reasoning in the main thread.
- Run independent work in parallel: batch independent tool calls in one block, and spawn multiple subagents at once instead of sequentially.
