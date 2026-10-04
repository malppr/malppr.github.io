# malppr.github.io

Bryan Chew's portfolio. Astro + MDX static site, deployed to GitHub Pages.
The plan, milestones and decisions are in `PLAN.md` — read it first.

## Commands

- `npm run dev` — dev server at http://localhost:4321 (use `astro dev --background`, then `astro dev stop` / `status` / `logs`)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run check` — `astro check` (types + diagnostics)

Node is at `C:\Program Files\nodejs` (may not be on PATH in older shells).

## Rules

- Work on the `overhaul` branch. Never push to or merge into `main` without Bryan's explicit sign-off on the local preview — `main` deploys live.
- Every milestone ends with Bryan reviewing locally (`npm run dev`, then `npm run preview` before deploy).
- `legacy/` is the old React site, kept only as a reference for migrating content. Delete at cutover (W5).
- Personal and academic work only — no SAP or Bosch content. Robot-arm project stays hidden (`draft: true`) until Bryan says otherwise.
- Don't add the résumé PDF yet; Bryan will supply the final copy.

## Docs

https://docs.astro.build — routing, content collections, framework components, styling.
