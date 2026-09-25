# MangoTools

Professional browser tools that run entirely on your device. Phase 1 public beta.

## Requirements

- Node.js 24 (see `.node-version`)
- pnpm 10 (`corepack enable` activates the version pinned in `package.json`)

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Generate the registry and start the Astro dev server on http://localhost:4321 |
| `pnpm gen` | Validate taxonomy, presets, manifests, content and fixtures; write `generated/` |
| `pnpm verify` | Lint, generate, typecheck, architecture checks and unit/fixture tests |
| `pnpm build` | Generate, build the static site into `apps/web/dist`, run post-build checks |
| `pnpm preview` | Serve `apps/web/dist` with the production headers |
| `pnpm test:e2e` | Build production + test sites and run Playwright suites |
| `pnpm new:tool <slug> --preset <id> --category <id> --tier <T1-T4> --archetype <A-E>` | Scaffold a tool |

Set `MANGOTOOLS_ENV=production` for an indexable production build (default: `development`).
`pnpm build -- --env production --out dist-prod` does the same without an environment variable.

### Environment variables

| Variable | Used by | Meaning |
|---|---|---|
| `MANGOTOOLS_ENV` | build | `development` (default: noindex, `/_dev/*` pages, analytics logged to the console) or `production` |
| `PW_BROWSERS` | `pnpm test:e2e` | Comma-separated browsers to run (default `chromium,firefox,webkit`) |
| `PW_CHROMIUM_PATH` | `pnpm test:e2e` | Use an already installed Chromium instead of Playwright's download |

### Development-only pages

In development builds `/_dev/components` shows every component in its states, and
`/_dev/determinism` runs every engine fixture in the browser worker (used by `tests/determinism`).

## Where things live

Read `AGENTS.md` first. Architecture documents are in `docs/architecture/`, the Phase 1 plan in
`docs/phase-1/`, and task files in `tasks/`.
