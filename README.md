# Headless Site Template

A public-ready **Next.js + TinaCMS** starter, deployed as static assets through a **Cloudflare Worker**.

## What this template includes

- Next.js 15 with App Router
- TinaCMS for content management
- Visual editing (click-to-edit on the live site)
- Static HTML export (`output: "export"`)
- Cloudflare Worker deployment with static assets, a custom domain, and security headers
- Cloudflare Pages deployment from GitHub Actions, plus CI verification
- SEO and accessibility guardrails: canonical metadata, Open Graph/Twitter cards,
  robots.txt, sitemap.xml, a 404 page, optional LocalBusiness JSON-LD, and a
  post-build audit for the production checklist (titles, descriptions, headings,
  alt text, breadcrumbs, favicon, social image, llms.txt, no Vite overlay,
  no source maps, no placeholder copy, internal links, JS budget)
- Agent-ready delivery: Content Signals, `llms.txt`, and Markdown content
  negotiation for requests that send `Accept: text/markdown`
- An optional agent discovery surface (`.well-known/agent-card.json`,
  `openapi.json`, and related documents), disabled until you configure it

## Before launching

Set these values in `src/content/site.json` (or Tina's **Site Settings**) before
the first production deployment:

1. `siteUrl`: the final HTTPS custom domain (for example, `https://example.com`)
2. `socialImage`: a real 1200 × 630 share image in `public/`
3. `favicon`: the favicon's public path
4. `localBusiness`: turn this on and complete only when the business serves a
   local area and its contact/address details are public.

Then deploy the Worker to attach the custom domain, submit
`https://your-domain/sitemap.xml` to Google Search Console, and resolve any
DNS or indexing issues there. These account-level steps deliberately cannot be
automated from the repository.

`AGENTS.md` is the standing maintenance contract: agents must make safe,
in-scope SEO, accessibility, metadata, and console-error fixes as part of any
related work, then run the build and SEO audit.

The accompanying [agent operations guide](./docs/agent-operations.md) explains
the one-time launch setup and the checks agents must perform when they add
routes, change public content, or modify the Worker.

Create sites with GitHub's **Use this template** action, not Fork. The new
repository receives the issue forms and Actions workflows; its initialization
workflow then creates every launch checklist item as a separate issue. Monthly
human reviews recur only after the previous issue is closed.

### Agent discovery surface

Set the `discovery` key in `src/content/site.json` to publish well-known
documents (agent card, OpenAPI, API catalog, agent skills, MCP server card)
that tell automated agents what the site can actually do. It ships empty; a
document is only generated for a section you fill in, and `npm run
audit:discovery` checks the result after `npm run build`. See the
[agent operations guide](./docs/agent-operations.md#agent-discovery-surface)
for what each document is, what's generated vs. hand-authored, and which
protocols (OAuth/OIDC discovery, commerce protocols like ACP/UCP/x402) are
out of scope for a static site.

## Content pages and forms

The `page` collection is now a complete public-page model: every document in
`src/content/pages/` is statically rendered at `/<slug>/`, has page-specific
metadata, and is included in the sitemap unless **Keep this page out of search
results** is selected in Tina. Its sections are rendered from the same Tina
data used by the visual editor.

The included `src/content/pages/about.json` is a working example at `/about/`.
Use it as a content-model reference, then replace it with your own page.

This is a static Cloudflare Worker template. Do not rely on the sample Next API
routes for form delivery in production; static exports do not run them. Set each
form's **Form submission endpoint** to a secured external endpoint or a
Cloudflare Worker URL. The UI refuses to claim a submission succeeded
when that endpoint is absent.

## Prerequisites

- [Node.js](https://nodejs.org/) 22+ (check with `node --version`)
- A [GitHub](https://github.com) account
- A [Cloudflare](https://dash.cloudflare.com) account
- A [Tina Cloud](https://app.tina.io) account

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment template
cp .env.example .env.local

# 3. Fill in your Tina credentials (see "TinaCMS Setup" below)

# 4. Start the dev server
npm run dev
```

The site runs at `http://localhost:3000` and the Tina admin at `http://localhost:3000/admin/`.

## TinaCMS Setup

### 1. Create a Tina Cloud project

1. Go to [app.tina.io](https://app.tina.io) and sign in
2. Click **Create Project**
3. Enter a project name (e.g., `my-headless-site`)
4. Select **GitHub** as your Git provider and choose your repository
5. Grant Tina access to the repo

### 2. Get your credentials

After creating the project, Tina will show you:

- **Client ID** → paste into `NEXT_PUBLIC_TINA_CLIENT_ID` in `.env.local`
- **Read-only Token** → paste into `TINA_TOKEN` in `.env.local`

```bash
# .env.local
NEXT_PUBLIC_TINA_CLIENT_ID=your-client-id-here
TINA_TOKEN=your-token-here
TINA_BRANCH=main
```

### 3. Commit and push

Tina Cloud reads your schema from the Git repository, so push your changes:

```bash
git add .
git commit -m "feat: add TinaCMS config"
git push
```

### 4. Enable visual editing

The `tina/config.ts` already has `ui.router` configured on the `site` collection. This means when you click a document in the CMS sidebar, it opens the visual editor with a live preview.

In your page component (`components/TinaPage.tsx`), the `data-tina-field` attributes connect DOM elements to Tina fields:

```tsx
<h1 data-tina-field={tinaField(site, "title")}>{site.title}</h1>
```

## Cloudflare Worker setup

The static Next.js export is uploaded as Worker assets. The Worker in
`worker/index.ts` adds security headers before returning those assets.

1. Authenticate Wrangler: `npx wrangler login`
2. Add the Tina credentials in Cloudflare if visual editing is enabled:
   - `NEXT_PUBLIC_TINA_CLIENT_ID`
   - `TINA_TOKEN`
   - `TINA_BRANCH=main`
3. Confirm the domain in [`wrangler.jsonc`](./wrangler.jsonc) is correct.
   This public example declares `headless.mojave.studio` as a Worker Custom
   Domain.
4. Deploy: `npm run worker:deploy`

Cloudflare creates the DNS record and certificate when it provisions an unused
Custom Domain in an active zone. If the hostname already has a CNAME, remove or
migrate that record before the first deploy.

### Local Worker preview

Run `npm run worker:dev` to build with a local Tina server and serve the exact
static `out/` directory through Wrangler. Use `npm run worker:check` to validate
the Worker bundle without deploying it.

Once deployed, this example is live at `https://headless.mojave.studio/` and
the Tina admin is at `https://headless.mojave.studio/admin/`.

## Cloudflare Pages deployment from GitHub

`headless-site-template.pages.dev` is a **Cloudflare Pages** hostname, not a
GitHub Pages hostname. For a Git-integrated Pages project, Cloudflare builds
and publishes automatically whenever `main` is pushed—no Cloudflare API token
or deployment workflow belongs in this repository.

In Cloudflare, connect the Pages project to this GitHub repository, set `main`
as its production branch, use `npm run build` as the build command, and set
`out` as the build output directory. Add the Tina environment variables in the
**Cloudflare Pages** project settings if visual editing is enabled:

- `NEXT_PUBLIC_TINA_CLIENT_ID`
- `TINA_TOKEN`
- `TINA_BRANCH=main`

The repository's `public/_headers` file applies the release security headers to
the Pages deployment. The GitHub Actions workflow remains verification-only.

## Architecture decisions

### Why `output: "export"`?

`output: "export"` makes Next.js generate:
- Static HTML for every page
- `_next/static/` assets (CSS, JS)
- Everything into the `out/` directory

The Worker deploys `out/` as versioned static assets and applies a small set of
security headers. It also appends the Content Signals policy to `robots.txt`
and response headers, and returns a clean Markdown representation of the same
page when a request includes `Accept: text/markdown`. No server-side Next.js
runtime is needed.

### Why a Worker with static assets?

This keeps the static export simple while leaving a safe edge boundary for
headers, future redirects, or small APIs. Cloudflare caches the assets globally
and the Worker only adds response policy.

If you need SSR later, migrate to an appropriate Next.js-on-Workers adapter.

### Visual editing flow

1. User visits `/admin/`
2. Tina loads the admin SPA from `public/admin/`
3. User clicks a document → `ui.router` navigates to the page preview
4. The page preview loads the site in an iframe
5. Clicking on page elements opens the edit form in the sidebar

## Project structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage (Server Component)
│   └── [slug]/page.tsx     # CMS pages, statically rendered from content/pages
├── components/
│   ├── TinaPage.tsx        # Homepage visual editing
│   └── TinaContentPage.tsx # CMS page visual editing and section renderer
├── lib/
│   └── tina.ts             # Data fetching helpers
├── public/
│   └── admin/              # Generated Tina admin SPA
├── src/content/
│   └── site.json           # Your content data
├── tina/
│   ├── config.ts           # Tina schema + ui.router config
│   └── __generated__/      # Auto-generated (client.ts, types.ts)
├── .github/workflows/
│   └── build.yml           # CI: build verification only
├── worker/
│   └── index.ts             # Static asset handler + security headers
├── wrangler.jsonc           # Worker, assets, and Custom Domain configuration
├── next.config.mjs         # output: "export", trailingSlash: true
└── README.md               # This file
```

## Troubleshooting

### CSS returns 404 after deployment

The Worker may have been deployed before the static export completed.

- Run `npm run worker:deploy` again
- Confirm `wrangler.jsonc` still points at `./out`
- Purge Cloudflare cache only after verifying the deployed Worker version

### Tina admin shows "Content Manager" only (no visual editor)

- Make sure `ui.router` is set on the collection in `tina/config.ts`
- Make sure the page component uses `useTina` and `tinaField`
- Rebuild and redeploy after schema changes
- Verify the admin bundle in `public/admin/assets/` contains `router`

### "Failed: build output directory not found"

- `next.config.mjs` must have `output: "export"`
- `wrangler.jsonc` must point `assets.directory` to `./out`

### Schema mismatch errors

- Tina Cloud reads schema from the Git branch
- After editing `tina/config.ts`, commit and push
- Wait for Pages to rebuild

## Next steps

1. Add more collections (pages, posts, etc.)
2. Add image fields with `type: "image"` and `publicFolder: "public"`
3. Customize the `ui.router` logic for multi-page sites
4. Add a second page under `app/[slug]/page.tsx`
5. Add `generateStaticParams` for dynamic routes

## Useful links

- [TinaCMS Docs](https://tina.io/docs/)
- [Tina Visual Editing](https://tina.io/docs/contextual-editing/react)
- [Tina tinaField](https://tina.io/docs/contextual-editing/tinafield)
- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
