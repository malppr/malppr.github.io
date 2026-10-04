# Portfolio Overhaul — Plan

Rebuild malppr.github.io as a **project-first portfolio** for robot-learning research engineer / AI roles.
Personal and academic work only (no SAP / Bosch). No CV/résumé on the site.

Companion plan: `D:\Proj\maze-bot\PLAN.md` (the mascot + interactive RL demo).

---

## 1. Goals

- Projects are the main content; each has a proper write-up (problem → my role → approach → results → what failed).
- Easy to extend: adding a project = adding a folder.
- Positioned for **both AI and robotics** roles: every project is labelled AI or Robotics, with filters on the home page.
- Interactive demos (maze bot, later PushT) plug in as lazy-loaded islands without slowing the rest of the site.
- Fixes everything from the review: deep links work, SEO/OG tags, optimized images, accessible markup, dark mode that actually works.

## 2. Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro** + **MDX** + content collections | Static HTML per page (ideal for GitHub Pages), typed content schemas, islands for interactivity |
| Interactive bits | Vanilla TS modules mounted via small Astro components (React only if a component needs it) | Demos ship as framework-agnostic modules from their own repos |
| Styling | Plain CSS with design tokens (custom properties), scoped Astro styles | Small, no build magic, easy theming |
| Images | `astro:assets` (`<Image>`/`<Picture>`) → AVIF/WebP, responsive sizes, lazy | Fixes the 4 MB images |
| Video | Short loops (≤ 3–5 MB, webm + mp4) in repo; long videos on YouTube | Pages size/bandwidth limits |
| Deploy | GitHub Actions → `actions/deploy-pages` | Replaces the `gh-pages` branch; deploys on push to `main` |
| Tooling | Node LTS, npm, Prettier, `astro check` | Node is **not installed yet** — install Node LTS first |

## 3. Hosting constraints (GitHub Pages)

- Static only → all demos run client-side (plain JS matmul for maze bot; ONNX Runtime Web for PushT). Heavy demos → Hugging Face Spaces, embedded.
- No custom headers → no COOP/COEP → no `SharedArrayBuffer` / threaded WASM. Design for single-threaded. Escape hatch: Cloudflare Pages (custom headers) — keep the build host-agnostic.
- ~1 GB site, 100 MB/file, ~100 GB/month soft bandwidth → no datasets or large models in the repo; load from HF Hub/CDN at runtime.
- No Git LFS for served assets.
- Optional: custom domain (~$10/yr) so links survive a host move.

## 4. Information architecture

```
/                      Home (design D): hero + mascot · Work list (featured rows, AI/Robotics filter) · Playground teaser · publications · earlier projects
/projects/[slug]       Project write-up (MDX), optional embedded demo
/playground            Interactive demos (Maze Bot first, PushT later) — its own nav tab, not a project card

/404                   Custom not-found page (with the mascot, lost)
```

## 5. Content model (`src/content/`)

```ts
// projects/<slug>/index.mdx frontmatter
title: string
summary: string                 // one line, used on cards
date: date; endDate?: date
status: "ongoing" | "complete" | "archived"
tags: ("robot-learning" | "ai" | "perception" | "hardware" | "design")[]
featured: boolean               // shown in Featured row
tier: "main" | "archive"        // archive = compact "Other projects" list
order?: number
cover: image; coverVideo?: string
links?: { paper?, code?, demo?, video?, arxiv? }
demo?: "maze" | "pusht"         // embeds an interactive island
draft?: boolean
```

- `publications/*.yaml`: `title, authors, venue, year, links` (my name bolded at render).
- Media lives next to each project's MDX.

MDX components: `<Figure>`, `<Video>` (autoplay-muted loop, poster, reduced-motion aware), `<Gallery>`, `<AudioCompare>` (labelled ground-truth vs prediction grid), `<Metrics>` (results table), `<Callout>`, `<Demo name="maze" />`.

## 6. Content migration

| Project | Tier | Tags | Notes |
|---|---|---|---|
| Robotic Bookshelf | main, featured | hardware, robot-learning? (HRI) | RO-MAN 2023 paper link; final-experiment video https://www.youtube.com/watch?v=cmLbnvv-03Y |
| BeetleBot (capstone) | main | hardware, perception | YouTube embed, gallery |
| LEAP TTS | main | ai | Fix audio sources; AudioCompare |
| HyperX TTS | main | ai | arXiv 2406.17257 |
| Knee Exoskeleton | main | hardware | |
| Golden Grips | archive | design | |
| LumiComb | archive | design, hardware | Compress BestSmall.jpg (4 MB) |
| TMS Coil | archive | hardware | |
| Robot-arm project | hidden (`draft: true`) | robot-learning | Keep hidden until Bryan says otherwise |
| Maze Bot | main, featured, ongoing | robot-learning, ai | `demo: maze` |
| PushT Diffusion | draft until it exists | robot-learning | `demo: pusht` |

Text gets a light edit pass (typos: "a Ergonomic", "Adaption", "continum").

## 7. Design direction

- Clean, typographic, lots of whitespace; media-first cards (cover video plays on hover/in view).
- Mascot = brand: two-wheeled box robot with a camera mast. Side-view SVG for logo/favicon; top-down sprite for demos.
- Tokens on `:root`, dark mode via `prefers-color-scheme` + manual toggle (persisted, wrapped in try/catch).
- Fonts: one sans for UI/body + one mono for labels/metrics (final pick in W2).
- Accessibility: real links/buttons, alt text everywhere, focus styles, `prefers-reduced-motion` respected (mascot parks).

## 8. Demo integration contract (shared with maze-bot)

The site does not contain demo logic. It consumes a versioned package:

```jsonc
// package.json
"maze-bot": "github:malppr/maze-bot#v0.1.0"
```

```ts
import { mountMazeDemo, mountMascot } from "maze-bot/web";

mountMazeDemo(el: HTMLElement, opts?: {
  mode?: "obstacles" | "draw";
  showNetwork?: boolean;          // neuron panel
}): { destroy(): void };

mountMascot(el: HTMLElement, opts: {
  obstacles: () => DOMRect[];     // page elements to avoid, re-queried on resize
  onClick?: () => void;           // → navigate to /play/maze
}): { destroy(): void; pause(): void; resume(): void };
```

- Theme: demo reads CSS custom properties (`--fg`, `--bg`, `--accent`, `--muted`) from its container — no theme props.
- Loading: site mounts via `client:visible`-style lazy import; mascot pauses when off-screen or tab hidden.
- **Until maze-bot v0.1 exists**, the site ships a stub module with the same API (scripted idle wander, static SVG) so layout and slots are final from day one.

## 9. Performance & quality budget

- Home page: ≤ 150 KB JS before the mascot loads; LCP < 2 s on mid-range mobile.
- Lighthouse ≥ 95 on Performance / Accessibility / SEO / Best Practices.
- Every page: unique `<title>`, meta description, OG/Twitter image; sitemap; `robots.txt`.
- Deep links and refresh work on every route (static files per route).

## 10. Local review before anything deploys

Nothing goes live without Bryan reviewing it locally first.

- **During development:** `npm run dev` → http://localhost:4321 (hot reload). Each milestone ends with a local review by Bryan before moving on.
- **Before deploying:** `npm run build && npm run preview` serves the *production* build locally — this is what will actually ship, so review this, not just the dev server.
- **Pre-deploy checks (run locally, scripted as `npm run check:all`):** `astro check`, build, internal link checker over `dist/`, Lighthouse on key pages (home, one project, `/play/maze`, 404), manual pass on phone width + dark mode.
- **Deploy is gated:** the workflow only runs on push to `main` (plus manual `workflow_dispatch`). All work happens on `overhaul`, which never deploys. Merging to `main` (W5) happens only after Bryan signs off on the local preview.
- Same rule after launch: changes go on a branch, get reviewed via `npm run preview`, then merge.

## 11. Milestones

| # | Deliverable | Done when |
|---|---|---|
| W0 | Install Node LTS; new branch `overhaul`; Astro scaffold; Actions deploy workflow (triggers on `main` only — not active until W5) | `npm run dev` and `npm run preview` work locally |
| W1 | Content collections + schemas; layouts; MDX components; migrate all existing projects & images | All old projects render at `/projects/[slug]`; `astro check` clean |
| W2 | Design system: tokens, type, dark mode, cards, filterable grid, archive list, publications | Screenshots light/dark, mobile/desktop reviewed by Bryan |
| W3 | Mascot stub + `/play/maze` placeholder + demo contract wiring; 404 page | Stub roams hero avoiding cards; click → `/play/maze` |
| W4 | Lab notes section; SEO/OG; sitemap; image/video optimization pass | Lighthouse budget met; link previews render |
| W5 | Local sign-off on `npm run preview` + pre-deploy checks; then cut over: Pages source → Actions, merge `overhaul` → `main`; delete old React app | Bryan approves local preview; live site serves new build; all URLs checked |
| W6 | Swap stub for real `maze-bot` package once v0.1 is tagged | Mascot driven by trained policy |

## 12. Roadmap after the site

1. **maze-bot** — see its PLAN.md.
2. **pusht-diffusion** (separate repo): reproduce Diffusion Policy on PushT (state-based) + MLP-BC baseline + ablations (denoising steps, horizon, obs history). Export to ONNX → `/play/pusht` where visitors push the T, then watch the policy (sampled trajectories drawn). GPU: local RTX 5060 Ti (needs a PyTorch build with Blackwell / CUDA 12.8+ support). Stretch: mascot (differential drive) pushes the T.
3. Robot-arm project page + lab notes + episode replay viewer (URDF + three.js).

## 13. Open decisions

- [ ] Fonts and accent color: Claude mocks up a few options in W2 for Bryan to pick.
- [x] Résumé: decided **not** to publish a CV on the site.
- [ ] Mascot art: Bryan to supply a 3D base design (GLB/OBJ/STL/STEP or top/side/front screenshots); Claude derives flat SVGs (top-down sprite + side-view logo).
- [ ] Custom domain now or later.
- [ ] Bookshelf tags: hardware + "hri"? (add `hri` tag if yes).

## 14. Decisions log

- **2026-10-04 — Layout:** Bryan picked mockup **D** (original header + wide hero, project *list* instead of cards, featured rows show context + role). Mockups A–E kept at `/dev/mockups` until cutover.
- **2026-10-04 — No lab notes.** Replaced by a **Playground** nav tab; Maze Bot lives there, not in the project grid.
- **2026-10-04 — Publications:** include RecPFN (SIGIR 2026), no link until public.
- **2026-10-04 — Positioning:** AI and robotics weighted equally; `areaOf(tags)` in `src/lib/format.ts` maps tags → AI / Robotics / Design.
- **2026-10-04 — Fonts:** Inter (variable) + JetBrains Mono, self-hosted via Fontsource. Light default, dark via OS or toggle.
- BeetleBot showcase link removed (SUTD page gone, not archived).
- **2026-10-04 — Mascot is named Wheely.** Home hero: drive-in + "Hi! I'm Wheely 👋" bubble on fresh arrival/refresh (skipped when returning from another page on the site), static under reduced motion. Playground demo is titled "Wheely's maze" (repo can stay `maze-bot`).
- **2026-10-04 — No CV on the site.** Bryan decided not to publish the résumé PDF (it was briefly added and removed before any push, so it is not in git history).
