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

CI (`.github/workflows/ci.yml`) runs install, build, HTML validation and the
Wrangler dry run on every pull request.

## Deploys

Production deploys come from Cloudflare Workers Builds (the dashboard's Git
integration) on every push to `main`, not from GitHub Actions. The Worker is
configured in `wrangler.jsonc` as an assets-only Worker serving `dist/`.

## Layout

```
public/            static files copied as-is (font, later: wordmark, favicon, _redirects)
src/layouts/       Base.astro — <html>/<head> shell
src/pages/         index.astro (and later 404.astro)
src/styles/        global.css — tokens, font-face, base type
astro.config.mjs   static output, site URL
wrangler.jsonc     assets-only Worker config
```

## Font

Inter (variable, latin subset) is self-hosted from `public/fonts/`, licensed under
the SIL Open Font License 1.1 (`public/fonts/Inter-OFL.txt`).
