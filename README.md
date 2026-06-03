# Headless Site Template

A minimal boilerplate for building a **Next.js + TinaCMS** site deployed to **Cloudflare Pages**.

## What this template includes

- Next.js 15 with App Router
- TinaCMS for content management
- Visual editing (click-to-edit on the live site)
- Static HTML export (`output: "export"`)
- Cloudflare Pages deployment via Git integration
- GitHub Actions CI for build verification

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

## Cloudflare Pages Setup

### 1. Create a Pages project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages**
2. Click **Create a project**
3. Connect to your **GitHub** repository
4. Under **Build settings**:
   - **Build preset:** Next.js (static)
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
5. Add **environment variables** (same as `.env.local`):
   - `NEXT_PUBLIC_TINA_CLIENT_ID`
   - `TINA_TOKEN`
   - `TINA_BRANCH` = `main`
6. Click **Save and Deploy**

### 2. Important: build output directory

Because `next.config.mjs` uses `output: "export"`, Next.js generates static files into an `out/` folder. You **must** tell Pages to use `out` as the build output directory, not `.next`.

### 3. Verify deployment

Once deployed, your site is live at:
- Site: `https://<project-name>.pages.dev`
- Tina admin: `https://<project-name>.pages.dev/admin/`

## Architecture decisions

### Why `output: "export"`?

Cloudflare Pages serves static files directly. `output: "export"` makes Next.js generate:
- Static HTML for every page
- `_next/static/` assets (CSS, JS)
- Everything into the `out/` directory

Pages then deploys `out/` as your site root. No server runtime needed.

### Why no Workers?

This template uses **Pages** (static hosting) instead of **Workers** (edge runtime). For a content-managed marketing site:
- Pages is simpler and cheaper
- No cold starts
- Built-in Git integration
- Tina's visual editor works the same way

If you need SSR or API routes later, you can migrate to Workers + `opennextjs-cloudflare`.

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
├── components/
│   └── TinaPage.tsx        # Client Component with useTina + tinaField
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
├── next.config.mjs         # output: "export", trailingSlash: true
└── README.md               # This file
```

## Troubleshooting

### CSS returns 404 after deployment

Pages is serving a cached build or the build output directory is wrong.

- Check Pages Settings → Build output directory = `out`
- Trigger a new deployment from the dashboard
- Purge Cloudflare cache if needed

### Tina admin shows "Content Manager" only (no visual editor)

- Make sure `ui.router` is set on the collection in `tina/config.ts`
- Make sure the page component uses `useTina` and `tinaField`
- Rebuild and redeploy after schema changes
- Verify the admin bundle in `public/admin/assets/` contains `router`

### "Failed: build output directory not found"

- `next.config.mjs` must have `output: "export"`
- Pages build settings must point to `out`

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
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
