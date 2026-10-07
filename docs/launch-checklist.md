# Production launch checklist

Each unchecked row becomes one GitHub issue in a repository created from this template.

## Core site

- [ ] `src/content/site.json` has the production HTTPS `siteUrl`, real `socialImage`, `favicon`, and brand details.
- [ ] Every public page has a unique title and meta description.
- [ ] Every indexable page has a canonical URL, plus a complete hreflang set when localized.
- [ ] Every page has exactly one descriptive `h1`.
- [ ] Every inner page has visible breadcrumbs matching its BreadcrumbList JSON-LD.
- [ ] Informative images have meaningful alt text and decorative images use deliberate empty alt text.
- [ ] Unknown URLs render a real HTML 404 with a way home.
- [ ] `robots.txt` declares crawl rules, the sitemap, explicit AI-crawler groups, and the Content-Signal policy.
- [ ] `sitemap.xml` includes every indexable route and excludes admin, API, preview, and 404 routes.
- [ ] `/llms.txt` publishes an accurate machine-readable site summary.
- [ ] Indexable pages publish accurate JSON-LD; LocalBusiness is used only for a real public local business.
- [ ] The favicon and apple-touch-icon resolve to real assets.
- [ ] The Open Graph and Twitter image resolves to a real 1200x630 asset.
- [ ] Production contains no development overlay, source maps, placeholder copy, or console errors.
- [ ] Every internal link resolves and no empty, hash-only, or `javascript:` source remains.
- [ ] Public JavaScript stays below the configured bundle budget.
- [ ] Responsive checks pass and pages are manually checked near 360px, 768px, and desktop widths.
- [ ] Accessibility checks pass for contrast, keyboard use, focus, landmarks, names, labels, and heading order.
- [ ] Public claims are supportable and every image or asset is owned or licensed.
- [ ] Google Preferred Sources is configured only for an eligible news or publication site.

## Policy and consent

- [ ] A privacy policy covers collected data, purpose, retention, third parties, and deletion, and is linked at collection points.
- [ ] Terms of service cover the service, acceptable use, payment or cancellation when applicable, and liability.
- [ ] A cookie policy lists every cookie and storage item, including an explicit statement when none are used.
- [ ] A consent banner blocks non-essential storage until opt-in and gives Reject equal weight, when such storage exists.
- [ ] A refund policy states the actual terms and is linked from checkout, when the site takes payment.
- [ ] Forms collect only necessary data, capture required consent, and link the privacy policy.
- [ ] Third-party embeds, scripts, fonts, and widgets are inventoried, justified, covered by CSP, and consent-gated when needed.
- [ ] Applicable local requirements such as GDPR, ePrivacy, imprint, consumer disclosures, and age rules are satisfied.

## Agent readiness

- [ ] `Accept: text/markdown` returns generated Markdown with `Vary: Accept`, while `/__agent-markdown/` stays private.
- [ ] The Content-Signal policy is sent in both `robots.txt` and the response header.
- [ ] Homepage Link headers advertise only API catalog, service description, documentation, or other targets that exist.
- [ ] `/.well-known/api-catalog` and `/openapi.json` are enabled only for real callable APIs.
- [ ] `/auth.md` and OAuth protected-resource metadata are enabled only when real agent authentication exists.
- [ ] The A2A agent card and agent-skills index are enabled only when the site operates a real agent and skills.
- [ ] The MCP server card is enabled only when its referenced MCP endpoint is deployed and reachable.
- [ ] WebMCP tools are registered only for real actions the page can perform.
- [ ] Commerce documents advertise only real ACP, UCP, MPP, x402, or AP2 payment flows.
- [ ] `npm run audit:discovery` passes for every enabled discovery document.

## Localization

- [ ] `locales/en.json` contains source strings and each supported locale has its own JSON file.
- [ ] Localized routes render translated copy with deliberate fallback behavior.
- [ ] Localized pages have translated titles and descriptions, canonicals, and a complete hreflang cluster including `x-default`.
- [ ] Every localized route is included in the sitemap.
- [ ] `OPENAI_API_KEY` is configured only when Auto Translate is enabled, and the workflow runs green.
- [ ] The SEO audit verifies hreflang completeness for localized pages.

## Agent tooling

- [ ] Impeccable is installed and its regenerable output is gitignored.
- [ ] Graphify is installed, `graphify update .` runs, and `graphify-out/` is gitignored.
- [ ] The accessibility workflow runs on pushes and pull requests and remains green.

## Security

- [ ] Git history and tracked files contain no secrets, and credential files are gitignored.
- [ ] Dependencies have no known high or critical vulnerabilities and unused packages are removed.
- [ ] Production contains no debug mode, test endpoints, development overlays, or source maps.
- [ ] Dotfiles, configuration, backups, `.git`, and `.env` return 404 publicly.
- [ ] CSP, HSTS, frame protection, nosniff, and Referrer-Policy are present on every response.
- [ ] Forms and API inputs are validated at trust boundaries and rendered output is safe from XSS.
- [ ] Every mutating or expensive endpoint is rate-limited.
- [ ] CORS is scoped and never wildcarded for authenticated or mutating endpoints.
- [ ] Admin routes are authenticated or absent from the public deployment.
- [ ] Protected routes enforce authentication and per-resource authorization.
- [ ] Passwords and credentials use a proper KDF rather than raw hashing or plaintext.
- [ ] API keys and tokens remain in server-side secrets and never enter the client bundle.
- [ ] Database access is parameterized and uses least-privilege bindings.
- [ ] Error responses do not expose stack traces, schema names, tokens, or other internals.

## CI configuration

- [ ] The `SITE_URL` repository variable is set for deployed readiness and ZAP scans.
- [ ] The `OPENAI_API_KEY` repository secret is set only when localization is enabled.
- [ ] `CI_RUNNER_LABELS` is set when self-hosted runners are intended.
- [ ] Build Verification, Security Audit, Accessibility, and Agent Readiness workflows pass on `main`.

## Human steps

- [ ] Attach the production custom domain in Cloudflare and set the deployed `SITE_URL`.
- [ ] Configure Tina CMS credentials for the deployed admin.
- [ ] Submit the sitemap in Google Search Console and resolve indexing and canonical reports.
- [ ] Publish DNS-AID records only after the referenced agent endpoints are live.
