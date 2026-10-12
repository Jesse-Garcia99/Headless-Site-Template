# Agent operations guide

Use this guide with `AGENTS.md`. It records the site capabilities that must survive template customization.

## First production launch

Repositories created with **Use this template** inherit the issue forms and Actions files, not issue instances from this template repo. This template repository does not carry launch or recurring issues of its own; `npm run launch:issues` and `npm run recurring:issues` no-op here. The default branch creation or first push on a cloned site runs `.github/workflows/launch-issues.yml`, which files every launch checklist item as its own GitHub issue. To backfill them locally on a clone, run:

```sh
node scripts/create-launch-issues.mjs   # or: npm run launch:issues
```

The local command requires the GitHub CLI (`gh auth login`). Both paths create one issue per checklist item — `launch` plus `site`, `agent-readiness`, `localization`, or `human` by section — and skip titles that already exist, so they are safe to re-run. Point an agent at the issue list and have it work them sequentially. Agent-readiness items that do not apply (no API, no MCP, no checkout) should be closed as not planned with evidence, never faked. Most items are proven by `npm run audit:seo` or `npm run audit:discovery` going green. Monthly *Agent discovery honesty* issues keep robots, sitemap, Link headers, and enabled well-known documents true after launch.

The issue chooser provides forms for ordinary site changes, localization work, and agent-readiness changes. `.github/workflows/recurring-issues.yml` also opens three monthly human-review issues and waits for each prior issue to close before renewing it. CI, dependency/security scans, localization, accessibility, and deployed agent-readiness checks remain automated rather than producing repetitive reminder issues.

Complete these before the first public deployment:

1. Set `src/content/site.json` with the production HTTPS `siteUrl`, a real social image, favicon, brand details, and public contact details when applicable.
2. Confirm every public route has a unique title and description, canonical URL, one meaningful H1, accessible imagery, and internal links to related pages.
3. Confirm the favicon, social image, robots file, sitemap, `llms.txt`, custom 404 page, structured data, and form behavior in production output.
4. Deploy the Cloudflare Worker with the intended custom domain. The Worker serves static assets, applies security headers, attaches the Content Signals policy, and negotiates Markdown for agents.
5. Submit the production sitemap in Google Search Console and resolve reported DNS, indexing, or canonical issues.

## Agent discovery surface

The template can publish a set of well-known documents that let automated
agents discover what the site is and what it can do. This is separate from
the Content Signals/Markdown delivery above: that controls how pages are
served to agents, this controls whether the site advertises capabilities
beyond "read these pages" at all.

Everything here ships **disabled**. The `discovery` key in
`src/content/site.json` is empty by default, and `scripts/generate-discovery.mjs`
(run as part of `npm run build`) emits nothing into `out/` for a section that
isn't filled in. Turning a document on is an explicit, per-document decision
by the site owner, not a template default.

**Governing rule: never publish a discovery document describing something
that does not exist.** These documents are read by autonomous agents deciding
what to do next; a document advertising an endpoint that 404s, a capability
the site can't honor, or an issuer that isn't real doesn't just look bad, it
sends real agents into failures and misrepresents the operator. If a
compliance scanner (for example isitagentready.com) wants a field populated
that the site cannot honestly satisfy, leave it unset — the spec wins over
the scanner. Prefer omitting a document entirely over shipping it half true.

The documents, what each is for, and when it's appropriate to turn on:

| Document | Purpose | Turn on when |
| --- | --- | --- |
| `/.well-known/api-catalog` | Lists the site's real HTTP APIs for agent discovery | The site actually exposes callable API endpoints (for example, a Worker route), not just pages |
| `/openapi.json` | Describes those APIs' request/response shapes | Same condition as above — only if `api-catalog` is also on and the paths it lists are real |
| `/.well-known/agent-card.json` | Identifies this site as an agent (A2A-style) with declared capabilities | The site operates as an agent that can act on a caller's behalf, not merely serve content |
| `/.well-known/agent-skills/index.json` | Manifest of discrete skills the site's agent exposes, with content digests | Only alongside `agent-card.json`, and only for skills that actually run |
| `/.well-known/mcp/server-card.json` | Points agents at a real, reachable MCP server | An MCP server for this site is actually deployed and reachable at the URL given |

Most template deployments are a static content site with no callable API and
no agent runtime, so most of these should stay off. Do not enable one to
satisfy a scanner; enable it because the underlying capability exists.

What's generated vs. hand-authored:

- Hand-authored: every value under `discovery` in `src/content/site.json`
  (which documents are on, their URLs, descriptions, contact/auth info,
  skill definitions) and any OpenAPI path documentation for real endpoints.
- Generated: the JSON/well-known files themselves, written to `out/` by
  `scripts/generate-discovery.mjs` during `npm run build`, and the
  `agent-skills` digests, computed from the skill content so they can't drift.

`npm run audit:discovery` validates the generated output after a build:
required fields are present, every file path a document references actually
exists in `out/`, and skill digests match their content. Run it any time the
`discovery` config changes, and treat a failure as a shipping blocker, not a
warning.

Out of scope for this template, deliberately: protocols that require real
provisioned infrastructure a static site cannot provide, such as OAuth/OIDC
discovery (`/.well-known/openid-configuration`) or commerce protocols like
ACP, UCP, or x402. These need a live authorization server or payment
processor behind them. Do not fake these documents to pass a scanner; add
them only once that infrastructure is deployed by a human with provider
access, as a follow-up to this template, not part of it.

## When adding or changing public pages

1. Use the metadata helpers and page model. Do not hand-write duplicate metadata.
2. Add indexable routes to `app/sitemap.ts`. Keep admin, API, previews, placeholders, and 404 pages out of the sitemap and search results.
3. Give every informative image descriptive alt text; use an empty alt only for deliberate decoration.
4. Build the site. This regenerates the static HTML and the internal Markdown representation used for `Accept: text/markdown` requests. Never edit `out/` or `out/__agent-markdown/` by hand.
5. Run `npm run lint`, `npm run build`, and `npm run audit:seo`. When Worker behavior changes, also run `npm run worker:check`.

## When changing agent or crawler delivery

- Keep the Content Signals policy aligned in the Worker response header and generated `robots.txt`: `ai-train=no, search=yes, ai-input=no`.
- Preserve `Vary: Accept` on Markdown responses so HTML and Markdown are cached as separate variants.
- Browser requests must keep receiving HTML. Only requests that accept `text/markdown` should receive Markdown.
- Keep the Markdown source directory private; `/__agent-markdown/` must return 404 to direct requests.
- Ensure Markdown has title, description, canonical URL frontmatter and only main content, without navigation, scripts, styles, or decorative imagery.
- When the `discovery` config in `src/content/site.json` changes, or a documented capability (an API route, an agent skill, an MCP server) changes or is removed, update the config and regenerate: run `npm run build` then `npm run audit:discovery`. Remove or disable a discovery document as soon as the capability it describes stops being true.

## When changing deployment infrastructure

- Preserve the Worker static asset binding and its `run_worker_first` configuration in `wrangler.jsonc`.
- Keep the production custom domain, `SITE_URL`, Tina credentials, and form endpoint configuration outside source control.
- CI workflows: `build.yml` gates every push/PR (build, typecheck, `audit:seo`, `audit:discovery`, worker bundle). `security.yml` runs gitleaks history scan + `npm audit` weekly and on push, plus a ZAP baseline against `vars.SITE_URL` when set. `agent-readiness.yml` scans the deployed site weekly via isitagentready.com. `translate.yml` is opt-in: it activates once `locales/en.json` exists and `OPENAI_API_KEY` is set, translating new/changed keys into sibling locale files via `scripts/translate.mjs` and committing them with `[skip ci]`. Set `CI_RUNNER_LABELS` (e.g. `["self-hosted","zimacube"]`) to move jobs to self-hosted runners.
- Validate a deployed page with both representations:

  ```sh
  curl -I https://your-domain.example/
  curl -H "Accept: text/markdown" https://your-domain.example/
  curl https://your-domain.example/robots.txt
  ```

- Confirm Markdown responses use `Content-Type: text/markdown; charset=utf-8`, contain `Vary: Accept`, and expose the Content Signals header.
- If any discovery documents are enabled, confirm they're actually being served with the right content type and that the `Link` headers point at them:

  ```sh
  curl -I https://your-domain.example/
  curl https://your-domain.example/.well-known/api-catalog
  curl https://your-domain.example/openapi.json
  curl https://your-domain.example/.well-known/agent-card.json
  curl https://your-domain.example/.well-known/agent-skills/index.json
  curl https://your-domain.example/.well-known/mcp/server-card.json
  ```

  A 404 on a document you believe is enabled means the build or config is
  broken — fix it before relying on `Link` headers pointing agents there. A
  404 on a document you deliberately left disabled is correct; do not add a
  placeholder file just to make it resolve.
