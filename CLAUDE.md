# jc — Claude Code Instructions

## What is this project?

`jc` (just-components) is an open-source, zero-config component showcase toolkit for React — a lightweight Storybook alternative. It auto-discovers components from TypeScript files, extracts prop metadata, and renders an interactive playground with smart defaults.

## Tech Stack

| Tool | Purpose |
|------|---------|
| TypeScript 5 | Language (strict mode) |
| tsup | Build tool (ESM lib + CJS CLI) |
| Vitest | Test runner (316 tests) |
| react-docgen-typescript | Prop extraction (CLI only, bundled) |
| @faker-js/faker | Smart default values (externalized in ESM) |
| React >= 18 | Peer dependency |

## Project Structure

```
src/
├── cli.ts                    # CLI entry (jc extract / --watch)
├── config.ts                 # Config resolution + defineConfig
├── types.ts                  # All TypeScript interfaces
├── index.ts                  # Public API exports (jc)
├── next.tsx                  # Next.js adapter (jc/next)
├── extract/
│   ├── extract.ts            # Core extraction engine
│   ├── example-parser.ts     # @example JSDoc → presets + wrappers
│   ├── ast-analyze.ts        # AST-based component analysis
│   └── usage-analysis.ts     # Cross-file usage counting
├── lib/
│   ├── faker-map.ts          # Prop name/type → faker value heuristics
│   ├── fixtures.ts           # Fixture plugin resolution
│   ├── code-tokens.ts        # Syntax highlighting tokenizer
│   ├── theme-vars.ts         # THEME constant (light/dark CSS vars)
│   ├── url-sync.ts           # URL read/write + hash-based state
│   ├── use-showcase-state.ts # Central state hook
│   ├── use-resolved-component.tsx # Resolves fixtures + props → rendered element
│   └── use-theme.ts          # Theme management hook
└── components/
    ├── showcase-app.tsx       # Root layout (supports render prop)
    ├── showcase-sidebar.tsx   # Component list with search
    ├── showcase-controls.tsx  # Prop editor panel
    ├── showcase-preview.tsx   # Live render + syntax-highlighted code
    ├── theme-toggle.tsx       # Light/dark theme switcher
    ├── viewport-picker.tsx    # Responsive viewport presets
    ├── error-boundary.tsx     # Graceful error handling
    └── field/                 # Modular control editors
        ├── index.ts
        ├── showcase-field.tsx # Dispatcher (~200 lines)
        ├── icon-picker.tsx
        ├── component-picker.tsx
        ├── fixture-picker.tsx
        ├── node-field-input.tsx
        ├── array-editor.tsx
        ├── component-fixture-editor.tsx
        └── styles.ts
```

## Commands

```bash
bun install            # Install dependencies
bun run dev            # Watch mode build
bun run build          # Production build
bun run test           # Run tests (316 tests across 12 files)
bun run test:watch     # Tests in watch mode
bun run type-check     # TypeScript validation
bun run lint           # Biome check
bun run lint:fix       # Biome auto-fix
```

## Package Exports

Three entry points defined in `package.json`:

| Entry | Exports | Description |
|-------|---------|-------------|
| `jc` | ShowcaseApp, ShowcaseControls, ShowcasePreview, ShowcaseSidebar, ThemeToggle, ViewportPicker, ShowcaseField, FixturePicker, ComponentFixtureEditor, useShowcaseState, useResolvedComponent, defineFixtures, resolveFixturePlugins, resolveFixtureValue + all types | Main library |
| `jc/config` | defineConfig, resolveConfig, defaultConfig | Configuration utilities |
| `jc/next` | createShowcasePage | Next.js App Router factory |

## Build Architecture

Three separate tsup build targets in `tsup.config.ts`:

1. **Library** (`index.ts`, `config.ts`, `next.tsx`) → ESM with `.d.ts`, externals: react, faker
2. **CLI** (`cli.ts`) → CJS with shebang, bundles `react-docgen-typescript`
3. **Post-build** `onSuccess` hook injects `'use client'` directive into `index.js` and `next.js`

## Key Patterns

### Config merging
Array fields (`excludeFiles`, `filteredProps`, etc.) use **union merge** with dedup — user values extend defaults, not replace.

### Component detection
`detectComponentKind()` in `extract.ts` uses a layered heuristic:
1. Type pattern matching (LucideIcon → icon, ReactElement → element, ReactNode → node)
2. Prop name heuristics (icon-suffixed → icon, badge/action → node)
3. Source regex tiebreaker for ambiguous cases

### Type name filtering
`isTypeName()` uses an **explicit allowlist** of ~50 known TS/React type names. Never uses length-based heuristics — real enum values like "Primary", "Destructive" must not be filtered.

### Control types
`resolveControlType()` in `faker-map.ts` maps prop types to UI controls:
- `text`, `number`, `boolean` — primitive props
- `select` — enum/literal unions
- `multiline` — long text, JSX snippets
- `json` — object/array props
- `array` — string arrays and structured lists
- `component` — props with `componentKind` (icon/element/node)
- `readonly` — immutable/computed props

### Fixture system
Props typed as `LucideIcon`, `ReactNode`, etc. use fixture plugins for visual pickers. Qualified keys (`lucide/star`) prevent collisions. Category-based matching routes icon props to icon fixtures, etc.

### Wrapper detection
`@example` JSDoc blocks are parsed to detect parent wrappers. The showcase auto-wraps the component and provides separate controls for wrapper props.

### @example presets
Each `@example` block becomes a one-click preset with extracted prop values, children text, and wrapper props.

### URL state
Component selection → `?component=`. Viewport → `?viewport=`. Prop values serialized in URL hash. Toggleable via `syncUrl` prop.

### Inline CSS
All showcase UI uses inline styles with CSS custom properties (`--jc-bg`, `--jc-fg`, etc.) — no external CSS, no Tailwind. Self-contained.

### Render prop
`ShowcaseApp` accepts `children` render prop for custom layouts. Context includes `state`, `wrapperMetas`, `theme`, `vars`.

### Viewport picker
4 presets: Full (responsive), 375px (mobile), 768px (tablet), 1280px (desktop). Syncs to URL.

### Multi-render
Instance count toggle (1, 3, or 5 varied instances) with different faker-generated values per instance.

### Syntax-highlighted code output
`ShowcasePreview` generates JSX code from current prop values. Two modes: JSX-only vs. full with imports. Custom tokenizer in `code-tokens.ts` with light/dark themes.

## Testing

Tests are co-located with source files (`*.test.ts`). 316 tests across 12 files.

Key test modules:
- `extract.test.ts` — Type simplification, value extraction, type name detection, component kind, path alias
- `extract-integration.test.ts` — End-to-end extraction from fixture files
- `example-parser.test.ts` — @example JSDoc parsing, wrapper detection
- `usage-analysis.test.ts` — Cross-file usage counting
- `ast-analyze.test.ts` — AST-based component analysis
- `faker-map.test.ts` — Control type resolution, fake value generation
- `fixtures.test.ts` — Plugin resolution, value lookup, kind filtering
- `showcase-preview.test.ts` — Code generation, syntax highlighting
- `config.test.ts` — Default config, merge behavior, array union

## Example Project

`example/` contains a Next.js app serving as both docs site and live demo:

```bash
cd example && bun install && bunx jc extract && bun run dev
```

- `/` — Landing page with live showcase embed
- `/showcase` — Full interactive playground
- `/docs/*` — Getting started, configuration, fixtures, API, frameworks

## Important Notes

- `react-docgen-typescript` is a **devDependency** — bundled into `cli.cjs`, not shipped to UI consumers
- `@faker-js/faker` is a runtime dependency but **externalized** in the ESM build for tree-shaking
- The `'use client'` directive is injected post-build because esbuild strips module-level directives
- All components use `'use client'` — the showcase is entirely client-rendered
- The CLI uses `fs.watch` with recursive option for `--watch` mode (requires Node 18+ or Bun)
- Meta JSON needs a cast in TypeScript: `meta as unknown as JcMeta` (TS structural type mismatch with JSON imports)
- Example `.next` cache sometimes stale — `rm -rf example/.next` before build if errors
