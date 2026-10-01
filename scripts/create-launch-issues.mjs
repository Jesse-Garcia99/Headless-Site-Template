// Files the production-launch checklist as individual GitHub issues so an
// agent can work through them one at a time. Idempotent: issues whose title
// already exists (open or closed) are skipped.
//
// Usage: node scripts/create-launch-issues.mjs   (requires `gh auth login`)
import { execFileSync } from "node:child_process";

const LABEL = "launch";
const HUMAN_LABEL = "human";

const issues = [
  ["Install agent tooling: impeccable + graphify", "Install the standard agent tools so every future task can use them:\n\n- `npm i -D impeccable` then `npx impeccable install` — design anti-pattern detection and skills for agents.\n- `uv tool install graphifyy` (once per machine) then `graphify update .` — builds `graphify-out/`, the codebase knowledge graph agents should query before raw file browsing. Both tools' output is regenerable — do NOT commit it: gitignore `graphify-out/`, `.impeccable/`, `**/skills/impeccable/`, `**/agents/impeccable-*`, `**/hooks/impeccable.json`, `.cursor/hooks.json`, `.codex/hooks.json`. Only the npm devDependency and the `.gitignore` rules get committed.\n\nDone when: `npx impeccable detect` runs, `graphify-out/graph.json` exists, and `git status` shows no tooling artifacts staged."],
  ["site.json production values", "Set `siteUrl` to the production HTTPS domain and fill in `socialImage`, `favicon`, brand details, and public contact details.\n\nDone when: `npm run audit:seo` passes the siteUrl check."],
  ["Unique titles and meta descriptions", "Every public page needs a unique title and unique description. Check `app/` routes and the metadata helpers.\n\nDone when: `npm run audit:seo` passes."],
  ["Canonicals and heading structure", "Every indexable page has a canonical URL (plus the full hreflang set if the site is localized) and exactly one descriptive `h1`.\n\nDone when: `npm run audit:seo` passes."],
  ["Breadcrumbs on inner pages", "Every non-home indexable page renders a visible breadcrumb back to home, and any BreadcrumbList JSON-LD matches what is on screen.\n\nDone when: `npm run audit:seo` passes."],
  ["Alt text pass", "Informative images get descriptive alt text; decorative images keep a deliberate empty `alt=\"\"`.\n\nDone when: `npm run audit:seo` passes."],
  ["Custom 404 page", "Unknown URLs render a real HTML 404 with a way home.\n\nDone when: `npm run audit:seo` passes and `/nonexistent` returns the styled 404."],
  ["robots.txt: rules, AI crawlers, Content Signals", "Publish `/robots.txt` with a sitemap pointer, explicit `User-agent` groups for AI crawlers matching the site's policy (e.g. GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, Google-Extended), and `Content-Signal: ai-train=…, search=…, ai-input=…`.\n\nDone when: `npm run audit:seo` passes."],
  ["sitemap.xml", "Every indexable route is listed; admin, API, preview, and 404 routes are not.\n\nDone when: `npm run audit:seo` passes."],
  ["llms.txt", "Publish a machine-readable site summary at `/llms.txt`.\n\nDone when: `npm run audit:seo` passes."],
  ["Structured data", "JSON-LD on indexable pages (site graph plus LocalBusiness only if a public local address exists).\n\nDone when: `npm run audit:seo` passes."],
  ["Favicon and social image assets", "Favicon, apple-touch-icon, and a real 1200x630 OG/Twitter image all resolve from the build output.\n\nDone when: `npm run audit:seo` passes."],
  ["No dev leftovers in production", "No Vite/React overlay, source maps, placeholder copy, or console errors in the built output.\n\nDone when: `npm run audit:seo` passes and a browser pass shows a clean console."],
  ["Internal links resolve", "Every root-relative link points at a real route or asset; no empty, hash-only, or `javascript:` sources.\n\nDone when: `npm run audit:seo` passes."],
  ["Public JS budget", "Public pages ship lean JS; admin tooling stays off public pages.\n\nDone when: `npm run audit:seo` passes."],
  ["Responsive at every breakpoint", "Layout must work at every viewport — enforced by `npm run audit:responsive` against the built site: viewport meta present, no unguarded fixed widths above ~380px, tables/pre/images can't overflow, and root overflow isn't just hidden to fake it.\n\nDone when: `npm run build && npm run audit:responsive` passes and pages are manually spot-checked at ~360px, ~768px, and desktop widths."],
  ["Cookie policy page", "Publish a cookie policy (e.g. `/cookies`) listing every cookie and browser-storage item the site sets — name, purpose, lifetime — linked from the site footer and `app/sitemap.ts`. Even a site that sets nothing benefits: say so explicitly and point at the privacy policy.\n\nDone when: the page renders, is in the sitemap, and the footer links to it."],
  ["Cookie consent banner", "Only if the site sets non-essential cookies or equivalent storage (analytics, ads, A/B testing, embeds that set cookies): add a consent banner that keeps those scripts dormant until opt-in, offers Accept and Reject with equal weight, and persists the choice. Sites using only strictly-necessary storage (session auth, security tokens) don't need one under GDPR/ePrivacy — close this issue.\n\nDone when: non-essential scripts don't run before consent, Reject works, and the choice survives reload."],
  ["Refund policy page", "Only if the site takes payment: publish a refund/returns policy (e.g. `/refunds`) stating the terms plainly — 'all sales are final' is a valid policy, but it must be written down before the first charge. Cover cancellation vs. refund, partial-period access, and any store-mediated purchases (App Store/Play have their own refund channels). Link it from the footer, the pricing/checkout flow, and `app/sitemap.ts`. Sites that sell nothing can ship a one-line page or close this issue.\n\nDone when: the page renders, is linked from footer + checkout, and is in the sitemap."],
  ["Privacy policy page", "Publish a privacy policy (e.g. `/privacy`) covering what data is collected and why, retention, third parties that receive it, and the contact/deletion path — linked from the footer, from every form that collects personal data, and from `app/sitemap.ts`.\n\nDone when: the page renders, is in the sitemap, and every data-collection point links to it."],
  ["Terms of service page", "Publish terms (e.g. `/terms`) covering what the service is, acceptable use, payment/cancellation if applicable, and liability — linked from the footer and `app/sitemap.ts`.\n\nDone when: the page renders, is in the sitemap, and the footer links to it."],
  ["Accessibility pass", "Beyond the automated checks: colour contrast meets WCAG AA on text and interactive elements; every form, button, and control works keyboard-only with visible focus; buttons and links have clear descriptive labels (no bare 'click here' or icon-only actions without an accessible name).\n\nDone when: a keyboard-only walkthrough of every public page works and a contrast scan (e.g. Lighthouse/axe) is clean."],
  ["Data collection & form consent", "Collect only the data each feature actually needs — strip nice-to-have fields from forms. Where a form collects personal data (signup, newsletter, contact), capture consent where the law requires it and link the privacy policy at the point of collection. Inventory any tracking that exists — none of it should run without consent.\n\nDone when: every form collects only what it uses, consent is captured where required, and every collection point links to the privacy policy."],
  ["Third-party embeds audit", "Inventory every external embed, widget, script, and font (iframes, social widgets, chat, analytics, hosted media): what it loads, what data it sends, whether it sets cookies. Remove what's unnecessary; gate cookie-setting embeds behind the consent banner.\n\nDone when: every third-party request on public pages is known, wanted, and covered by CSP and the cookie policy."],
  ["Content integrity pass", "No fake reviews or testimonials, no unsupported claims ('#1', 'guaranteed', invented stats or endorsements), and every image and asset is licensed or owned — including stock and AI-generated media.\n\nDone when: a pass over all public copy and assets finds nothing unverifiable or unlicensed."],
  ["Local legal requirements", "Check the laws that apply to the jurisdictions you serve — e.g. GDPR/ePrivacy consent rules, consumer-protection disclosures, imprint/business-detail requirements (several countries require real company details on commercial sites), and age rules.\n\nDone when: required disclosures and consents exist for the jurisdictions served; anything deliberately out of scope is documented."],
  ["Markdown for agents", "`Accept: text/markdown` returns the generated Markdown counterpart with `Vary: Accept`; browsers still get HTML; `/__agent-markdown/` 404s to direct requests.\n\nDone when: `curl -H 'Accept: text/markdown' <deployed-url>` returns Markdown."],
  ["Content-Signal response header", "The declared policy is sent as a `Content-Signal` response header, not only in robots.txt.\n\nDone when: `curl -I <deployed-url>` shows the header."],
  ["Localization (optional)", "Only if the site ships in more than one language — close this issue if English-only.\n\n- Add `locales/en.json` (source strings) plus one file per target locale (`locales/es.json`, …).\n- Build localized routes (`/es/…`, `/fr/…`) rendering translated copy; untranslated keys fall back to English.\n- Every localized page needs a localized title/description, canonical, and the full hreflang cluster including `x-default`.\n- Add every locale route to the sitemap.\n- Set the `OPENAI_API_KEY` repo secret so the Auto Translate workflow fills new/changed keys automatically.\n- Extend `audit:seo` to verify hreflang completeness on localized pages.\n\nDone when: localized routes render translated content, hreflang and sitemap cover all locales, and the Auto Translate workflow has run green.", ],
  ["Discovery: API catalog + OpenAPI + Link headers", "Only if real API endpoints exist: serve `/.well-known/api-catalog` (application/linkset+json, RFC 9727), `/openapi.json`, and homepage `Link` headers pointing at them.\n\nDone when: `npm run audit:discovery` passes. Leave disabled otherwise."],
  ["Discovery: auth.md + OAuth protected resource", "Only if agent registration/auth exists: publish `/auth.md` and `/.well-known/oauth-protected-resource` (RFC 9728) with `resource` and `authorization_servers`.\n\nDone when: `npm run audit:discovery` passes. Leave disabled otherwise."],
  ["Discovery: A2A agent card + skills index", "Only if the site acts as an agent: `/.well-known/agent-card.json` and `/.well-known/agent-skills/index.json` with sha256 digests per skill artifact.\n\nDone when: `npm run audit:discovery` passes. Leave disabled otherwise."],
  ["Discovery: MCP server card", "Only if a real MCP endpoint is deployed and reachable: `/.well-known/mcp/server-card.json`.\n\nDone when: `npm run audit:discovery` passes. Leave disabled otherwise."],
  ["Discovery: WebMCP tools", "Only for real page actions: `navigator.modelContext.registerTool` calls exposing what the page can actually do.\n\nDone when: tools register in a supporting browser and each executes."],
  ["Discovery: commerce protocols", "Only for real payment flows: ACP (`/.well-known/acp.json`), UCP (`/.well-known/ucp`), MPP (`x-payment-info` in openapi.json), x402 middleware, AP2 extension on the agent card.\n\nDone when: `npm run audit:discovery` passes. Leave disabled otherwise."],
  ["Security: secrets sweep", "No secrets in git history or tracked files (scan for tokens, keys, `.env`, `.dev.vars`); confirm all credential files are gitignored. Rotate anything found.\n\nDone when: a secrets scan of history + tree is clean and `.env*`/`.dev.vars` are ignored."],
  ["Security: dependency hygiene", "`npm audit` clean of known vulnerabilities, `npm outdated` reviewed, unused packages removed.\n\nDone when: audit shows no high/critical vulns and no unused deps remain in package.json."],
  ["Security: no debug or exposed files", "No debug mode, test endpoints, or dev leftovers in production; dotfiles, `.git`, `.env`, configs, backups return 404 on the public site.\n\nDone when: `curl` probes for `/.env`, `/.git/HEAD`, backup files return 404."],
  ["Security: headers and CORS scope", "CSP, HSTS, X-Frame-Options/frame-ancestors, nosniff, Referrer-Policy on every response. `Access-Control-Allow-Origin: *` only on truly public assets — never on authenticated or mutation endpoints.\n\nDone when: response headers verified on HTML and API responses."],
  ["Security: input validation and XSS", "Forms and API inputs validated at the trust boundary (types, lengths, honeypots); stored/user content escaped on render; error responses never leak internals.\n\nDone when: boundary inputs reject bad payloads and a stored-XSS attempt renders inert."],
  ["Security: rate limiting", "Every mutating or expensive endpoint (POST, auth, scans, sends) is rate-limited.\n\nDone when: repeated calls to each such endpoint return 429 after the limit."],
  ["Security: auth and access control", "Only where the site has auth: admin routes authenticated or absent; protected routes reject unauthenticated calls; per-resource authorization enforced; passwords/credentials use a real KDF (argon2/bcrypt/scrypt/PBKDF2), never raw SHA-256 or plaintext; API keys live only in server-side secrets, never in the client bundle.\n\nDone when: unauthenticated probes fail and credential storage uses a real KDF. Skip sections that don't apply to a static site."],
  ["Security: database access", "Only where a database exists: all queries parameterized — no user input string-interpolated into SQL; least-privilege bindings.\n\nDone when: code review confirms parameterization and a `' OR 1=1` probe is inert."],
  ["Attach custom domain in Cloudflare", "Attach the production custom domain to the Worker and set production `SITE_URL`. Human step — needs provider access.", true],
  ["Search Console", "Submit the generated sitemap in Google Search Console and resolve reported indexing or DNS errors. Human step.", true],
  ["DNS-AID records", "Only once agent endpoints are live: publish SVCB/HTTPS records under the `_agents` namespace (e.g. `_a2a._agents.example.com`). Human DNS step.", true],
  ["Tina CMS credentials", "Configure Tina credentials for the deployed admin. Human step.", true],
  ["CI variables and secrets", "Wire the repository variables/secrets the workflows consume:\n\n- `SITE_URL` (variable) — production origin; powers the agent-readiness scan and ZAP baseline. Agents can set it with `gh variable set SITE_URL --body https://example.com`.\n- `OPENAI_API_KEY` (secret) — optional; enables the Auto Translate workflow once `locales/` exists. Needs the key from a human.\n- `CI_RUNNER_LABELS` (variable) — optional; e.g. `[\"self-hosted\",\"zimacube\"]` to move jobs off GitHub-hosted runners.\n\nDone when: Build Verification, Security Audit, and Agent Readiness all run green on main.", true],
];

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" }).trim();
}

try { gh(["--version"]); } catch { throw new Error("GitHub CLI (gh) is required. Install it and run `gh auth login` first."); }
try { gh(["auth", "status"]); } catch { throw new Error("Not authenticated. Run `gh auth login` first."); }

for (const [label, color] of [[LABEL, "0e8a16"], [HUMAN_LABEL, "d93f0b"]]) {
  try { gh(["label", "create", label, "--color", color, "--force"]); } catch {}
}

const existing = new Set(
  gh(["issue", "list", "--state", "all", "--limit", "500", "--json", "title", "--jq", ".[].title"]).split("\n").filter(Boolean)
);

let created = 0;
for (const [title, body, human] of issues) {
  const full = `[launch] ${title}`;
  if (existing.has(full)) continue;
  gh(["issue", "create", "--title", full, "--body", `${body}\n\n_Automated from the production launch checklist. Work these one at a time._`, "--label", LABEL, ...(human ? ["--label", HUMAN_LABEL] : [])]);
  created++;
}
console.log(`Launch issues: ${created} created, ${issues.length - created} already existed.`);
