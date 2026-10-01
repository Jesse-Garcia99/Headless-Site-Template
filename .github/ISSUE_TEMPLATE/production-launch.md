---
name: Production launch checklist
about: The full pre-launch pass for a site built from this template — every item an agent can verify
title: "Production launch checklist"
labels: launch
---

## Core — enforced by `npm run audit:seo` + `npm run audit:responsive`

- [ ] `src/content/site.json` has the production HTTPS `siteUrl`, real `socialImage`, `favicon`, brand details
- [ ] Unique title and meta description on every public page
- [ ] Canonical URL on every indexable page (plus hreflang set if localized)
- [ ] Exactly one descriptive `h1` per page
- [ ] Breadcrumbs on every inner page, matching BreadcrumbList JSON-LD
- [ ] Alt text on informative images; deliberate `alt=""` on decorative ones
- [ ] Custom HTML 404 with a way home
- [ ] `robots.txt`: rules, sitemap pointer, explicit AI-crawler groups, Content-Signal directive
- [ ] `sitemap.xml`: every indexable route, no admin/API/preview/404 routes
- [ ] `/llms.txt` published
- [ ] JSON-LD structured data; LocalBusiness only if a public local address exists
- [ ] Favicon + apple-touch-icon resolve to real assets
- [ ] OG/Twitter image resolves to a real 1200x630 asset
- [ ] No Vite/React overlay, source maps, placeholder copy, or console errors in production
- [ ] Every internal link resolves; no empty, hash-only, or `javascript:` sources
- [ ] Public JS under the bundle budget
- [ ] Responsive at every breakpoint — `npm run audit:responsive` green: viewport meta, no unguarded fixed widths, tables/pre/images can't overflow; spot-check ~360px, ~768px, desktop
- [ ] Accessibility: WCAG AA contrast, keyboard-only forms/controls with visible focus, clear descriptive button/link labels
- [ ] Content integrity: no fake reviews, no unsupported claims, every image licensed or owned

## Policy pages & consent

- [ ] Privacy policy page — what you collect, retention, third parties, deletion path; linked from footer + every data-collection point
- [ ] Terms of service page linked from footer + sitemap
- [ ] Cookie policy page listing every cookie/storage item (name, purpose, lifetime), linked from footer + sitemap — even if the answer is "we set none"
- [ ] Consent banner gating non-essential cookies until opt-in, with equal-weight Reject — only if the site sets any
- [ ] Refund policy page stating terms plainly (incl. "all sales final" if that's the policy), linked from footer + checkout — only if the site takes payment
- [ ] Forms collect only necessary data; consent captured where required; privacy policy linked at collection points; any tracking inventoried and consent-gated
- [ ] Local laws for served jurisdictions checked — GDPR/ePrivacy, imprint/business details, consumer disclosures

## Agent readiness — enable only what's real

- [ ] `Accept: text/markdown` returns Markdown with `Vary: Accept`; `__agent-markdown/` is not publicly listed
- [ ] Content-Signal response header sent alongside robots.txt directive
- [ ] `Link` headers on the homepage (api-catalog, service-desc, service-doc, describedby) — only when the targets exist
- [ ] `/.well-known/api-catalog` + `/openapi.json` — only when real API endpoints exist
- [ ] `/auth.md` + `/.well-known/oauth-protected-resource` — only when agent auth exists
- [ ] `/.well-known/agent-card.json` + `/.well-known/agent-skills/index.json` (sha256 digests) — only when the site acts as an agent
- [ ] `/.well-known/mcp/server-card.json` — only when a real MCP endpoint is live
- [ ] WebMCP `registerTool` calls — only for actions the page can perform
- [ ] Commerce docs (ACP, UCP, MPP `x-payment-info`, x402, AP2) — only for real payment flows
- [ ] `npm run audit:discovery` green for whatever is enabled

## Localization — only if multi-language

- [ ] `locales/en.json` source strings + one file per target locale
- [ ] Localized routes (`/es/…`) render translated copy; missing keys fall back to English
- [ ] Full hreflang cluster incl. `x-default`, localized title/description, canonical per locale
- [ ] Every locale route in the sitemap
- [ ] `OPENAI_API_KEY` secret set; Auto Translate workflow ran green

## Agent tooling — on project init

- [ ] `impeccable` installed: `npm i -D impeccable` then `npx impeccable install` — design anti-pattern detection and skills for agents; install output stays gitignored (regenerable)
- [ ] `graphify` installed: `uv tool install graphifyy` then `graphify update .` — builds `graphify-out/`; gitignored (regenerable)

## Security — apply where the surface exists

- [ ] No secrets in git history or tracked files; `.env`, `.dev.vars`, credentials gitignored
- [ ] Dependencies updated; `npm audit` clean of known vulnerabilities; unused packages removed
- [ ] No debug mode, test endpoints, dev overlays, or source maps in production
- [ ] No publicly exposed files: dotfiles, configs, backups, `.git`, `.env` return 404
- [ ] Security headers on every response: CSP, HSTS, X-Frame-Options/frame-ancestors, nosniff, Referrer-Policy
- [ ] Third-party embeds/scripts/fonts inventoried — each known, wanted, covered by CSP; cookie-setting embeds gated by consent
- [ ] Forms and API inputs validated at the trust boundary (types, lengths, honeypots); output escaped — no XSS
- [ ] Rate limiting on every mutating/expensive endpoint (POST, auth, scans, sends)
- [ ] CORS scoped: never `Access-Control-Allow-Origin: *` on authenticated or mutation endpoints
- [ ] Admin routes protected (authenticated or absent from the public deploy)
- [ ] Authentication real on protected routes; user-access rules enforced per resource, not just per route
- [ ] Passwords/credentials hashed with a proper KDF (argon2/bcrypt/scrypt/PBKDF2) — never raw SHA-256 or plaintext
- [ ] API keys and tokens only in server-side secrets; never shipped in the client bundle
- [ ] Database access parameterized — no user input string-interpolated into SQL
- [ ] Error responses don't leak internals (stack traces, schema names, tokens)

## CI configuration

- [ ] `SITE_URL` repo variable set — powers agent-readiness scan + ZAP baseline (`gh variable set`)
- [ ] `OPENAI_API_KEY` secret set — only if the site adds `locales/` (Auto Translate)
- [ ] `CI_RUNNER_LABELS` variable — optional, e.g. `["self-hosted","zimacube"]`
- [ ] Build Verification, Security Audit, and Agent Readiness green on `main`

## Human steps — need provider/DNS access

- [ ] Attach the custom domain in Cloudflare; set production `SITE_URL`
- [ ] Tina CMS credentials configured
- [ ] Submit the sitemap in Google Search Console; resolve indexing/canonical reports
- [ ] DNS-AID SVCB/HTTPS records under `_agents` — only once agent endpoints are live
