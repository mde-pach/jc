# jc — Claude Code Instructions

## What is this project?

`jc` (just-components) is an open-source, zero-config component showcase toolkit for React — a lightweight Storybook alternative. It auto-discovers components from TypeScript files, extracts prop metadata, and renders an interactive playground.

## Tech Stack

| Tool | Purpose |
|------|---------|
| TypeScript 5 | Language (strict mode) |
| tsup | Build tool (ESM lib + CJS CLI) |
| Vitest | Test runner |
| react-docgen-typescript | Prop extraction (CLI only) |
| @faker-js/faker | Smart default values |
| React >= 18 | Peer dependency |

## Project Structure

```
src/
├── cli.ts              # CLI entry (jc extract / --watch)
├── config.ts           # Config resolution
├── types.ts            # All TypeScript interfaces
├── index.ts            # Public API exports (jc)
├── next.tsx            # Next.js adapter (jc/next)
├── extract/
│   └── extract.ts      # Core extraction engine
├── lib/
│   ├── faker-map.ts    # Prop → faker value heuristics
│   ├── fixtures.ts     # Fixture plugin resolution
│   ├── use-showcase-state.ts  # Central state hook
│   └── use-theme.ts    # Theme management
└── components/
    ├── showcase-app.tsx      # Root layout
    ├── showcase-sidebar.tsx  # Component list
    ├── showcase-controls.tsx # Prop editor
    ├── showcase-field.tsx    # Individual controls
    └── showcase-preview.tsx  # Live render + code preview
```

## Commands

```bash
bun install            # Install dependencies
bun run dev            # Watch mode build
bun run build          # Production build
bun run test           # Run tests (93 tests)
bun run test:watch     # Tests in watch mode
bun run type-check     # TypeScript validation
```

## Build Architecture

Three separate tsup build targets in `tsup.config.ts`:

1. **Library** (`index.ts`, `config.ts`, `next.tsx`) → ESM with `.d.ts`, externals: react, faker
2. **CLI** (`cli.ts`) → CJS with shebang, bundles `react-docgen-typescript`
3. **Post-build** `onSuccess` hook injects `'use client'` directive into `index.js` and `next.js`

## Key Patterns

### Package exports
- `jc` — ShowcaseApp + defineFixtures + types
- `jc/config` — defineConfig + resolveConfig + defaultConfig
- `jc/next` — createShowcasePage factory

### Config merging
Array fields (`excludeFiles`, `filteredProps`, etc.) use **union merge** with dedup — user values extend defaults, not replace.

### Component detection
`detectComponentKind()` in `extract.ts` uses a layered heuristic:
1. Type pattern matching (LucideIcon → icon, ReactElement → element, ReactNode → node)
2. Prop name heuristics (icon-suffixed → icon, badge/action → node)
3. Source regex tiebreaker for ambiguous cases

### Type name filtering
`isTypeName()` uses an **explicit allowlist** of ~50 known TS/React type names. Never uses length-based heuristics — real enum values like "Primary", "Destructive" must not be filtered.

### URL state
Selected component syncs to `?component=` via `history.replaceState`. Read on mount, written on selection.

### Inline CSS
All showcase UI uses inline styles with CSS custom properties (`--jc-bg`, `--jc-fg`, etc.) — no external CSS, no Tailwind. This keeps the package self-contained.

## Testing

Tests are co-located with source files (`*.test.ts`). Run with `bun run test`.

| Module | Tests | Covers |
|--------|-------|--------|
| `extract.test.ts` | 41 | Type simplification, value extraction, type name detection, component kind, path alias |
| `faker-map.test.ts` | 23 | Control type resolution, fake value generation, children text |
| `fixtures.test.ts` | 18 | Plugin resolution, value lookup, code strings, kind filtering |
| `config.test.ts` | 11 | Default config, merge behavior, array union, path alias |

## Example Project

`example/` contains a minimal Next.js app with 6 sample components. To run:

```bash
cd example && bun install && bunx jc extract && bun run dev
```

## Important Notes

- `react-docgen-typescript` is a **devDependency** — bundled into `cli.cjs`, not shipped to UI consumers
- `@faker-js/faker` is a runtime dependency but **externalized** in the ESM build for tree-shaking
- The `'use client'` directive is injected post-build because esbuild strips module-level directives
- All components use `'use client'` — the showcase is entirely client-rendered
- The CLI uses `fs.watch` with recursive option for `--watch` mode (requires Node 18+ or Bun)
