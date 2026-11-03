# superhighway.fm

Source for [superhighway.fm](https://superhighway.fm), John Cleary's music consulting site.

A one-page static site built with [Astro](https://astro.build) and served from a
Cloudflare Worker with static assets only (no Worker script, no bindings). No
client-side JavaScript, no analytics, no third-party requests.

## Requirements

- Node 24 (see `.nvmrc`; `nvm use` picks it up)
- pnpm 12, pinned in `package.json#packageManager`. The easiest way to get the
  right version is Corepack, which ships with Node:

  ```bash
  corepack enable
  ```

## Local development

```bash
pnpm install
```

```bash
pnpm dev
```

The dev server runs at <http://localhost:4321>.

## Production build

```bash
pnpm build
```

```bash
pnpm preview
```

`pnpm build` writes the static site to `dist/`; `pnpm preview` serves it at
<http://localhost:4321>.

## Checks

```bash
pnpm validate
```

Validates the built HTML in `dist/` with html-validate (run `pnpm build` first).

```bash
pnpm deploy:dry-run
```

Runs `wrangler deploy --dry-run` against `wrangler.jsonc` to confirm the Worker
config and `dist/` upload are valid. It needs no Cloudflare login.

```bash
pnpm lighthouse
```

Runs Lighthouse CI (mobile, 3 runs) against `dist/` and fails if any of
Performance, Accessibility, Best Practices or SEO is below 95. Reports land in
`.lighthouseci/reports/`. Needs a local Chrome.

CI (`.github/workflows/ci.yml`) runs install, build, HTML validation, the
Wrangler dry run and Lighthouse CI on every pull request. The Lighthouse
reports are attached to the run as an artifact.

## Social card image

`public/og.png` (1200×630) is generated from `public/wordmark-green.png` and
committed. Regenerate it if the wordmark changes:

```bash
pnpm og
```

## Deploys

Production deploys come from Cloudflare Workers Builds (the dashboard's Git
integration) on every push to `main`, not from GitHub Actions. The Worker is
configured in `wrangler.jsonc` as an assets-only Worker serving `dist/`.

## Layout

```
public/            static files copied as-is: font, wordmark, favicon, og.png,
                   robots.txt, _redirects
scripts/           make-og.mjs: generates public/og.png (no dependencies)
src/site.ts        name, URL, contact details, social links (one place)
src/components/    Header, Hero, About, Services, Contact, Footer
src/layouts/       Base.astro: <head> with meta, Open Graph, JSON-LD
src/pages/         index.astro, 404.astro
src/styles/        global.css: tokens, font-face, base type
astro.config.mjs   static output, site URL, sitemap
lighthouserc.json  Lighthouse CI thresholds (≥ 95 in all four categories)
wrangler.jsonc     assets-only Worker config
```

## Redirects

`public/_redirects` only supports path-based rules on Workers static assets.
Host-level redirects (`www.superhighway.fm` → `superhighway.fm`, and
`johnwilliamcleary.com` → `superhighway.fm`) are Cloudflare Redirect Rules,
set up in the dashboard; see `docs/RUNBOOK.md`.

## Design and fonts

The design mirrors the original Squarespace site: a single `#209d50` green
field with white type, Instrument Serif for display and Newsreader for text.
Both fonts are self-hosted from `public/fonts/` (latin subsets) under the SIL
Open Font License 1.1; see `InstrumentSerif-OFL.txt` and `Newsreader-OFL.txt`.

White on that green is 3.5:1, which passes WCAG AA only for large text. This
was kept deliberately to match the original; Lighthouse accessibility scores
95 because of it.
