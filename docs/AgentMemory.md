# Headless-Site-Template — AgentMemory

## Project Overview
- **Purpose**: Public-ready Next.js + TinaCMS starter deployed as static assets via a Cloudflare Worker. Currently being extended with a full headless site construction guide.
- **Data Source**: `src/content/site.json`, `src/content/pages/*.json`, `src/content/forms/*.json`, TinaCMS schema in `tina/config.ts`, static export in `out/`.
- **Schema**: `site` collection (site-wide settings), `page` collection (public pages), `form` collection (Tina-managed forms). Static export with `trailingSlash: true`.
- **Loader**: `lib/tina.ts` fetches via Tina generated GraphQL client; `components/TinaPage.tsx` / `TinaContentPage.tsx` provide visual editing.

## Task Log

### T-001: Add headless site construction guide articles grouped in Tina
- **status**: in_progress
- **summary**: Add articles for headless site construction and group informational folders into separate Tina documents. Source material is a Claude artifact the user will provide.
- **attempts**:
  - 2026-09-09: Inspected repo; confirmed `AGENTS.md`, `docs/agent-operations.md`, `README.md`, `app/guide/page.tsx`, and `public/llms.txt` contain existing recommendations. No standalone `RECOMMENDATIONS.md`. Fetched `claude.ai/code/artifact/...` returned empty content; waiting for user to paste artifact.
- **outcome**: Pending — blocked on artifact content.
- **next_action**: Obtain artifact source, then design Tina collection(s) and Next.js routes.
- **updated**: 2026-09-09

## Technical Decisions
- Reuse/extend existing `page` collection or add a new `article`/`guide` collection depending on artifact structure and desired URL scheme (`/guide/*` vs `/articles/*`).
- Preserve existing `/guide/` index as either a hardcoded landing page or a Tina-managed page; route child pages under `/guide/[slug]/`.

## Update Protocol
1. Read this document before making changes.
2. Update task status and attempts as work progresses.
3. Run `npm run build`, `npm run audit:seo`, `npm run audit:discovery` before final deploy.
