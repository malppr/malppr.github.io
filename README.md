# malppr.github.io

Personal portfolio of Bryan Chew: AI, robotics and hardware projects, publications, and an interactive playground starring Wheely the robot.

Live at **https://malppr.github.io**.

## Stack

- [Astro](https://astro.build) + MDX, fully static
- Content collections: each project is a folder in `src/content/projects/<slug>/` (an `index.mdx` plus its images)
- Self-hosted Inter + JetBrains Mono, light/dark themes
- Deployed to GitHub Pages by GitHub Actions on push to `main`

## Develop

```sh
npm install
npm run dev         # http://localhost:4321
npm run check:all   # type check + production build + broken-link scan
npm run preview     # serve the production build locally
```

## Add a project

1. Create `src/content/projects/<slug>/index.mdx` with the frontmatter fields defined in `src/content.config.ts` (title, summary, date, tags, cover, …).
2. Put its images next to it and import them in the MDX.
3. `tier: main` shows it in the Selected list; `tier: archive` shows it under Earlier projects and in its area tab.
