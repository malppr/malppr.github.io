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

The demo is developed in the maze-bot repo; the site is self-contained and keeps a generated copy of its build in
`src/vendor/maze-bot/` (one readable ES module + weight chunks + types; `SOURCE.txt` names the maze-bot commit).
Update it from maze-bot with `npm run sync:site`, then commit the folder here. Never edit it by hand.

```ts
import { mountMazeDemo } from "../demos/maze";    // re-exports src/vendor/maze-bot (the only import point)

mountMazeDemo(el: HTMLElement, opts?: {
  mode?: "obstacles" | "draw";    // presets (default) or empty arena with the pen selected
  showNetwork?: boolean;          // brain panel (default true)
  version?: string;               // starting Wheely: heuristic | v3-rookie | v4-owl-eyes | final (default)
  sprite?: string;                // mascot sprite URL (site asset src/assets/mascot/mascot-top.svg; not in the MIT package)
}): { destroy(): void };
```

- Theme: the demo reads `--fg --bg --surface --border --muted --accent --accent-fg --ai --radius --font-mono` from its
  container and re-reads them on theme change. No theme props.
- Layout: the demo owns everything inside `el` (version chips, arena, layout chips, toolbar, brain panel). Phones (container
  < 480 px) get a portrait arena. `/playground` reserves the arena's space with a static poster until the script loads.
- Loading: lazy import when visible; pauses when off-screen or the tab is hidden; reduced motion starts paused.
- `mountMascot` was dropped (2026-10-04): no roaming mascot outside the Playground.

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
| W3 | Playground page + demo contract wiring (`src/demos/maze.ts` → stub with same API); 404 page | Stub demo runs lazily on `/playground`; 404 works in build |
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
- **2026-10-04 — No roaming mascot in the hero.** Wheely parks after the intro (roaming would distract from the headline). Roaming lives in the Playground demo instead; `mountMascot` from the contract is no longer needed. Swap point for the real demo: `src/demos/maze.ts` (+ set `IS_PREVIEW = false`).
- **2026-10-04 — Open content points accepted as-is:** project years (knee exo 2022, Golden Grips 2022, TMS 2021, HyperX 2024), "CSS10" dataset name, LEAP "Ground truth" label. Project pages: role/tags/links moved below the hero image.
- **2026-10-04 — Areas are AI / Robotics / Hardware.** Work tabs: Selected (main tier) · AI · Robotics · Hardware (area tabs include earlier projects). Earlier projects shown as image cards with "Browse all hardware →".
- **2026-10-04 — W4 done.** Default share image `public/og.png` (project pages use their cover), robots.txt, `npm run check:all`. Lighthouse (prod build, mobile): home 98/100/100/100, project 98/100/100/100, playground 99/100/100/100.
- **2026-10-04 — W5 cutover:** dev pages and legacy/ removed; overhaul merged into main.
- **2026-10-04 — Wheely's maze on the site (design agreed on a dev mockup, since removed):** `/playground` opens straight into the live demo; a demo switcher at the top appears once there is a second demo. Layout B: version chips → arena → toolbar → brain strip below (phones: portrait arena, compact brain strip, tap to enlarge). Four playable Wheelys: By-the-Book (hand-written rule), Rookie, Owl Eyes, Wheely (final, default). Brain panel is live (15 Hz) and draws only each neuron's strongest incoming signal (weight × activation); hover/tap shows all its connections. Story, results and failure clips (Moonwalker, Scaredy-Wheely) sit behind a prominent "How it works →" button → the project page (M6). Walls drawn while Wheely drives take effect live; the arena captures touch only in Draw/Erase. Demo JS lazy-loaded when visible, static poster first; target ≤ ~40 KB gzipped, Canvas 2D, no framework. Ghost race (previous version on the same map) deferred to after v0.1.
- **2026-10-04 — Wheely's maze live on `/playground` (maze-bot M5):** the Playground page is the demo (stub removed, `IS_PREVIEW` gone). Self-contained (Bryan, same day): no npm dependency on maze-bot; `npm run sync:site` in maze-bot copies its build into `src/vendor/maze-bot/`. Demo chunk 16.5 KB gz + 1.6–4 KB per Wheely's weights. "How it works →" appears automatically once the `wheelys-maze` project page exists (M6). Lighthouse /playground (mobile, prod build): 99/100/100/100, CLS 0.002. Fonts are not preloaded site-wide (small font-swap shifts remain, 0.002–0.008); revisit only if CLS budgets tighten.
- **2026-10-05 — Wheely's maze write-up (maze-bot M6):** project page `wheelys-maze` (tags robot-learning + ai, **not featured**: the featured row stays for substantial team/lab work; order 6). Compact: setup, what went wrong (Moonwalker / Scaredy-Wheely clips recorded from the demo canvas, ~0.1–0.2 MB mp4 each), what helped (results table of the four playable Wheelys), the maze gap, single-seed caveat, browser port. Code link: github.com/malppr/maze-bot (to be made public). Visibility instead via the hero: after "Hi", Wheely says "Play with me →" (~7 s, then every 25 s while on screen; none under reduced motion).
- **2026-10-05 — Areas:** `robot-learning` takes priority over `ai` in `areaOf`, so Wheely's maze is labelled Robotics; `areasOf` also lists it under the AI tab (a project tagged `ai` always appears there). No other project changes.
- **2026-10-05 — Hero image layout shift fixed:** project hero images had `width: auto`, so no box was reserved before load (CLS up to 0.175, Performance 91 on mobile). The template now sets `aspect-ratio` and the capped width from the image metadata; rendering is pixel-identical (checked 7 pages at 1280 and 390 px). Mobile Lighthouse on those pages: 97–99, CLS ≤ 0.02.
- **2026-10-05 — Project hero images in the text column (Bryan):** the hero was centred in the 1080 px frame at up to 560 px tall, so landscape photos (~998 px) lined up with neither the text nor the frame. It now sits in the 720 px text column (`.content`), still capped at 560 px tall, so near-square photos (TMS Coil, Robo-Shelf) are centred and slightly narrower. Mobile unchanged. Lighthouse (mobile) 98–99, CLS ≤ 0.002.
