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

Ship a discovery document only when the thing it describes exists. If this site has no API, agent, MCP, or checkout, close that issue as not planned with one line of evidence. Never publish a placeholder to satisfy [isitagentready](https://isitagentready.com). Prove enabled items with `POST https://isitagentready.com/api/scan` `{"url":"<siteUrl>"}`. First-ship items below; monthly *Agent discovery honesty* keeps them true.

- [ ] AI crawler robots.txt rules — Add explicit `User-agent` groups for GPTBot, ChatGPT-User, OAI-SearchBot, Google-Extended, CCBot, PerplexityBot, Applebot-Extended, meta-externalagent, ClaudeBot, Claude-SearchBot, Claude-User, and Perplexity-User, with Allow/Disallow matching the site policy. Skill: https://isitagentready.com/.well-known/agent-skills/ai-rules/SKILL.md. Check `checks.discoverability.robotsTxt.status` is `"pass"`.
- [ ] Content-Signal policy — Declare `Content-Signal: ai-train=no, search=yes, ai-input=no` (or the real policy) in `robots.txt` and on HTTP responses. Docs: https://contentsignals.org/ Skill: https://isitagentready.com/.well-known/agent-skills/content-signals/SKILL.md.
- [ ] Markdown for agents — `Accept: text/markdown` returns generated Markdown with `Content-Type: text/markdown` and `Vary: Accept`. HTML stays the default. `/__agent-markdown/` stays private. Skill: https://isitagentready.com/.well-known/agent-skills/markdown-negotiation/SKILL.md Docs: https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
- [ ] RFC 8288 Link headers — Homepage `Link` headers use `api-catalog`, `service-desc`, `service-doc`, and `describedby` only for documents that exist. Example: `Link: </.well-known/api-catalog>; rel="api-catalog"`. Cloudflare Transform Rules or the Worker may add them. Check `checks.discoverability.linkHeaders.status` is `"pass"`.
- [ ] RFC 9727 API catalog — Serve `/.well-known/api-catalog` as `application/linkset+json` with HTTP 200. `linkset` entries need `anchor` plus `service-desc`, `service-doc`, and optionally `status`. Enable only for real callable APIs. See RFC 9727 Appendix A. Check `checks.discovery.apiCatalog.status` is `"pass"`.
- [ ] auth.md agent registration — Serve `/auth.md` with an H1 that contains `auth.md`. Prefer RFC 9728 PRM at `/.well-known/oauth-protected-resource` (`resource`, `authorization_servers`, `scopes_supported`, `bearer_methods_supported` including `header`). Each advertised AS must publish `/.well-known/oauth-authorization-server` with a matching `issuer`. Add `agent_auth` with `skill`, `register_uri`, and one complete registration method (anonymous, verified email, or ID-JAG). If OAuth metadata is unavailable, keep `/auth.md` self-contained. Do not probe `POST /agent/auth` during scans. Enable only when agent registration is real.
- [ ] A2A Agent Card — Serve `/.well-known/agent-card.json` with `name`, `version`, `description`, `supportedInterfaces`, `capabilities`, and `skills` (`id`, `name`, `description`). Enable only if this site operates as an agent. Check `checks.discovery.a2aAgentCard.status` is `"pass"`.
- [ ] Agent Skills Discovery index — Serve `/.well-known/agent-skills/index.json` with `$schema` `https://schemas.agentskills.io/discovery/0.2.0/schema.json` and a `skills` array (`name`, `type` skill-md or archive, `description`, `url`, `digest` as `sha256:{hex}`). Enable only alongside a real agent. Check `checks.discovery.agentSkills.status` is `"pass"`.
- [ ] Web Bot Auth — Publish JWKS at `/.well-known/http-message-signatures-directory` and sign outbound bot/agent requests with `Signature-Agent` and `Signature-Input`. Enable only if this site originates bot HTTP. Check `checks.botAccessControl.webBotAuth.status` is `"pass"`.
- [ ] WebMCP tools — Register `navigator.modelContext.registerTool()` on page load for real page actions (`name`, `description`, `inputSchema`, `execute`). Unregister with `AbortController` when done. Do not advertise tools the page cannot run. Check `checks.discovery.webMcp.status` is `"pass"`.
- [ ] OAuth/OIDC discovery — Serve `/.well-known/oauth-authorization-server` or `/.well-known/openid-configuration` with `issuer`, `authorization_endpoint`, `token_endpoint`, `jwks_uri`, `grant_types_supported`, and `response_types_supported`. Enable only with a live authorization server. Check `checks.discovery.oauthDiscovery.status` is `"pass"`.
- [ ] RFC 9728 Protected Resource Metadata — Serve `/.well-known/oauth-protected-resource` with `resource` and `authorization_servers`. Optionally `scopes_supported` and `WWW-Authenticate` `resource_metadata` on 401. Enable only with a real resource server. Check `checks.discovery.oauthProtectedResource.status` is `"pass"`.
- [ ] MCP Server Card — Serve `/.well-known/mcp/server-card.json` with `serverInfo.name`, `serverInfo.version`, a transport `endpoint`, and `capabilities`. Enable only when that MCP URL is deployed. Check `checks.discovery.mcpServerCard.status` is `"pass"`.
- [ ] ACP discovery — Serve `/.well-known/acp.json` with `protocol.name` `"acp"`, `protocol.version`, `api_base_url`, non-empty `transports`, and `capabilities.services`. Commerce sites only. Check `checks.commerce.acp.status` is `"pass"`.
- [ ] AP2 on the A2A Agent Card — If (and only if) an A2A card is real, add extension `uri` `https://github.com/google-agentic-commerce/AP2/tree/v0.1.0` and `params.roles`. Merchant agents mark it required. Skip on non-commerce sites.
- [ ] MPP payment discovery — `/openapi.json` with `x-payment-info` on payable operations (`intent`, `method`, `amount`). Commerce sites only. Check `checks.commerce.mpp.status` is `"pass"`.
- [ ] Universal Commerce Protocol — Serve `/.well-known/ucp` with `protocol_version`, `services`, `capabilities`, and `endpoints`. Commerce sites only. Check `checks.commerce.ucp.status` is `"pass"`.
- [ ] x402 payments — Payment middleware on protected API routes returning HTTP 402. Commerce sites only. Check `checks.commerce.x402.status` is `"pass"`.
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
