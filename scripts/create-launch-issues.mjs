// Files the production-launch checklist as individual GitHub issues so an
// agent can work through them one at a time. Idempotent: issues whose title
// already exists (open or closed) are skipped.
//
// Usage: node scripts/create-launch-issues.mjs   (requires `gh auth login`)
import { execFileSync } from "node:child_process";

const LABEL = "launch";
const HUMAN_LABEL = "human";

const issues = [
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
  ["Markdown for agents", "`Accept: text/markdown` returns the generated Markdown counterpart with `Vary: Accept`; browsers still get HTML; `/__agent-markdown/` 404s to direct requests.\n\nDone when: `curl -H 'Accept: text/markdown' <deployed-url>` returns Markdown."],
  ["Content-Signal response header", "The declared policy is sent as a `Content-Signal` response header, not only in robots.txt.\n\nDone when: `curl -I <deployed-url>` shows the header."],
  ["Discovery: API catalog + OpenAPI + Link headers", "Only if real API endpoints exist: serve `/.well-known/api-catalog` (application/linkset+json, RFC 9727), `/openapi.json`, and homepage `Link` headers pointing at them.\n\nDone when: `npm run audit:discovery` passes. Leave disabled otherwise."],
  ["Discovery: auth.md + OAuth protected resource", "Only if agent registration/auth exists: publish `/auth.md` and `/.well-known/oauth-protected-resource` (RFC 9728) with `resource` and `authorization_servers`.\n\nDone when: `npm run audit:discovery` passes. Leave disabled otherwise."],
  ["Discovery: A2A agent card + skills index", "Only if the site acts as an agent: `/.well-known/agent-card.json` and `/.well-known/agent-skills/index.json` with sha256 digests per skill artifact.\n\nDone when: `npm run audit:discovery` passes. Leave disabled otherwise."],
  ["Discovery: MCP server card", "Only if a real MCP endpoint is deployed and reachable: `/.well-known/mcp/server-card.json`.\n\nDone when: `npm run audit:discovery` passes. Leave disabled otherwise."],
  ["Discovery: WebMCP tools", "Only for real page actions: `navigator.modelContext.registerTool` calls exposing what the page can actually do.\n\nDone when: tools register in a supporting browser and each executes."],
  ["Discovery: commerce protocols", "Only for real payment flows: ACP (`/.well-known/acp.json`), UCP (`/.well-known/ucp`), MPP (`x-payment-info` in openapi.json), x402 middleware, AP2 extension on the agent card.\n\nDone when: `npm run audit:discovery` passes. Leave disabled otherwise."],
  ["Attach custom domain in Cloudflare", "Attach the production custom domain to the Worker and set production `SITE_URL`. Human step — needs provider access.", true],
  ["Search Console", "Submit the generated sitemap in Google Search Console and resolve reported indexing or DNS errors. Human step.", true],
  ["DNS-AID records", "Only once agent endpoints are live: publish SVCB/HTTPS records under the `_agents` namespace (e.g. `_a2a._agents.example.com`). Human DNS step.", true],
  ["Tina CMS credentials", "Configure Tina credentials for the deployed admin. Human step.", true],
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
