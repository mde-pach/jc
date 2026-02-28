# jc — Claude Code Instructions

## What is this project?

`jc` (just-components) is an open-source, zero-config component showcase toolkit for React — a lightweight Storybook alternative. It auto-discovers components from TypeScript files, extracts prop metadata, and renders an interactive playground with smart defaults.

## Tech Stack

| Tool | Purpose |
|------|---------|
| TypeScript 5 | Language (strict mode) |
| tsup | Build tool (ESM lib + CJS CLI) |
| Vitest | Test runner (636 tests across 22 files) |
| react-docgen-typescript | Prop extraction (CLI only, bundled) |
| @faker-js/faker | Smart default values (externalized in ESM) |
| React >= 18 | Peer dependency |

## Project Structure

```
src/
├── cli.ts                    # CLI entry (jc extract / --watch)
├── config.ts                 # Config resolution + defineConfig + mergeConfig
├── types.ts                  # All TypeScript interfaces
├── index.ts                  # Public API exports (jc)
├── advanced.ts               # Power-user exports (jc/advanced)
├── next.tsx                  # Next.js adapter (jc/next)
├── react.tsx                 # Vite/CRA adapter (jc/react)
├── __test-utils__/
│   └── factories.ts          # Shared test factories (makeProp, makeComponent, etc.)
├── extract/
│   ├── extractor.ts          # Extractor interface definition
│   ├── pipeline.ts           # Framework-agnostic extraction pipeline
│   ├── react-docgen-extractor.ts # Default extractor (react-docgen-typescript + AST)
│   ├── extract.ts            # Thin resolver, re-exports for compat
│   ├── example-parser.ts     # @example JSDoc → presets + wrappers
│   ├── ast-analyze.ts        # AST-based component analysis
│   ├── discover.ts           # Smart component file discovery
│   ├── detect-environment.ts # Framework/icon lib/CSS auto-detection
│   └── usage-analysis.ts     # Cross-file usage counting
├── plugins/
│   └── lucide/
│       └── index.ts          # Zero-config lucide plugin (jc/plugins/lucide)
├── lib/
│   ├── plugins.ts            # Plugin system: definePlugin, fromComponents, scoring
│   ├── faker-map.ts          # Prop name/type → faker value heuristics
│   ├── faker-strategy.ts     # FakerStrategy extensible interface
│   ├── fixtures.ts           # Fixture rendering + resolution
│   ├── fixture-registry.ts   # O(1) fixture item lookup registry
│   ├── load-meta.ts          # Type-safe meta.json loader
│   ├── preferences.ts        # localStorage persistence (jc-prefs: theme, panel widths, code mode)
│   ├── showcase-reducer.ts   # Pure state reducer + compute helpers
│   ├── showcase-context.tsx   # ShowcaseProvider + context hooks
│   ├── code-tokens.ts        # Syntax highlighting tokenizer
│   ├── theme-vars.ts         # THEME constant (light/dark CSS vars)
│   ├── url-sync.ts           # URL read/write + hash-based state
│   ├── use-showcase-state.ts # Central state hook
│   ├── use-resolved-component.tsx # Resolves plugins + props → rendered element
│   ├── use-theme.ts          # Theme management hook
│   └── utils.ts              # PascalCase, slot key parsing
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
        ├── grid-picker.tsx    # Grid layout picker (icons, etc.)
        ├── node-field-input.tsx # NodePicker for ReactNode props
        ├── component-picker.tsx
        ├── fixture-picker.tsx
        ├── array-editor.tsx
        ├── component-fixture-editor.tsx
        └── styles.ts
```

## Commands

```bash
bun install            # Install dependencies
bun run dev            # Watch mode build
bun run build          # Production build
bun run test           # Run tests (636 tests across 22 files)
bun run test:watch     # Tests in watch mode
bun run type-check     # TypeScript validation
bun run test:coverage  # Tests with coverage report
bun run lint           # Biome check
bun run lint:fix       # Biome auto-fix
```

## Package Exports

Six entry points defined in `package.json`:

| Entry | Key Exports | Description |
|-------|-------------|-------------|
| `jc` | ShowcaseApp, definePlugin, fromComponents, loadMeta, JcTheme, ShowcaseRenderContext + all types | Main library |
| `jc/advanced` | Sub-components (ShowcaseControls, ShowcasePreview, ShowcaseSidebar, ThemeToggle, ViewportPicker), field controls (ShowcaseField, ComponentFixtureEditor, FixturePicker), primitives (GridPicker, NodePicker), state (useShowcaseState, useResolvedComponent, ShowcaseProvider, showcaseReducer, FixtureRegistry), fixture rendering (renderComponentFixture, fixtureToCodeString), plugin internals (resolvePluginItems, resolveItemValue, resolveValueMode, getPluginForProp, getItemsForProp, suggestPluginForProp, clearPluginCaches), faker strategy (createFakerResolver, defineFakerStrategy) | Power-user sub-components, state, context |
| `jc/config` | defineConfig, resolveConfig, mergeConfig, defaultConfig, Extractor types | Configuration utilities |
| `jc/next` | createShowcasePage | Next.js App Router factory |
| `jc/react` | createShowcase | Vite/CRA/plain React factory |
| `jc/plugins/lucide` | lucidePlugin, lucide(options?) | Zero-config Lucide icon plugin |

## Build Architecture

tsup builds 6 ESM entry points + 1 CJS CLI in `tsup.config.ts`:

1. **Library** (`index.ts`, `advanced.ts`, `config.ts`, `next.tsx`, `react.tsx`, `plugins/lucide/index.ts`) → ESM with `.d.ts`, externals: react, faker
2. **CLI** (`cli.ts`) → CJS with shebang, bundles `react-docgen-typescript`
3. **Post-build** `onSuccess` hook injects `'use client'` directive into `index.js`, `advanced.js`, `next.js`, `react.js`, `plugins/lucide.js`

## Key Patterns

### Config merging
Array fields (`excludeFiles`, `filteredProps`, etc.) use **union merge** with dedup — user values extend defaults, not replace.

### Extraction pipeline
- `Extractor` interface in `extractor.ts` — pluggable extraction engine
- `pipeline.ts` — framework-agnostic: `discoverFiles()`, `runPipeline()`, post-processing
- `react-docgen-extractor.ts` — default extractor using react-docgen-typescript + AST + regex fallbacks
- `discover.ts` — zero-config multi-glob probing with Next.js convention file filtering
- `detect-environment.ts` — auto-detects framework, icon libs, CSS framework, path aliases from tsconfig

### Component kind detection
Extraction reports raw React types only:
- `ReactNode` → `'node'`
- `ReactElement`, `JSX.Element`, `ComponentType`, `FC` → `'element'`
- No library-specific types (LucideIcon, etc.) — plugins handle those via `match.types`

### Plugin system
`definePlugin()` returns a factory `() => JcPlugin`. Scored matching in `getPluginForProp()`:
- `match.types` → +100 (e.g. `'LucideIcon'`)
- `match.kinds` → +50 (e.g. `'element'`)
- `match.propNames` → +25 (regex patterns)
- Plus `plugin.priority` offset

Three `valueMode` options: `'render'` (default), `'constructor'`, `'element'`.

`fromComponents(module)` auto-generates plugin items from module exports with PascalCase filtering.

### Type name filtering
`isTypeName()` uses an **explicit allowlist** of ~50 known TS/React type names. Never uses length-based heuristics — real enum values like "Primary", "Destructive" must not be filtered.

### Control types
`resolveControlType()` in `faker-map.ts` maps prop types to UI controls:
- `text`, `number`, `boolean` — primitive props
- `select` — enum/literal unions
- `multiline` — long text, JSX snippets
- `json` — object/array props
- `object` — structured object props (with `structuredFields`)
- `array` — string arrays and structured lists
- `color` — color string props (hex, rgb, etc.)
- `component` — props with `componentKind` (element/node)
- `readonly` — immutable/computed props

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

Tests are co-located with source files (`*.test.ts`). 636 tests across 22 files.

Key test modules:

**Extraction (7 files):**
- `extract.test.ts` — Type simplification, value extraction, type name detection, component kind, path alias
- `extract-integration.test.ts` — End-to-end extraction from fixture files
- `example-parser.test.ts` — @example JSDoc parsing, wrapper detection
- `ast-analyze.test.ts` — AST-based component analysis
- `discover.test.ts` — Smart component file discovery
- `detect-environment.test.ts` — Framework/icon lib/CSS detection
- `usage-analysis.test.ts` — Cross-file usage counting

**Library/core (10 files):**
- `showcase-reducer.test.ts` — All reducer actions + computeDefaults/computePresetDefaults/computeFixtureInit
- `faker-map.test.ts` — Control type resolution, fake value generation
- `faker-strategy.test.ts` — Custom faker strategy resolution
- `fixtures.test.ts` — Plugin resolution, value lookup, kind filtering
- `fixtures-render.test.tsx` — Fixture rendering with Radix asChild/cloneElement
- `fixture-registry.test.ts` — O(1) registry lookup
- `generate-defaults.test.ts` — Default value generation with plugin interaction
- `url-sync.test.ts` — URL state serialization
- `detect-theme.test.ts` — Theme detection

**Components (3 files):**
- `showcase-preview.test.ts` — Code generation, syntax highlighting
- `showcase-sidebar.test.tsx` — Sidebar search, filtering, navigation
- `showcase-controls.test.tsx` — Controls panel rendering
- `error-boundary.test.tsx` — Error boundary fallback

**Config + plugins (2 files):**
- `config.test.ts` — Default config, merge behavior, array union
- `plugins/lucide/index.test.ts` — Plugin factory, matching, options

## Example Project

`example/` contains a Next.js app serving as both docs site and live demo:

```bash
cd example && bun install && bunx jc extract && bun run dev
```

- `/` — Landing page with live showcase embed
- `/showcase` — Full interactive playground
- `/docs/*` — Getting started, configuration, plugins, API, frameworks

## Important Notes

- `react-docgen-typescript` is a **devDependency** — bundled into `cli.cjs`, not shipped to UI consumers
- `@faker-js/faker` is a runtime dependency but **externalized** in the ESM build for tree-shaking
- The `'use client'` directive is injected post-build because esbuild strips module-level directives
- All components use `'use client'` — the showcase is entirely client-rendered
- The CLI uses `fs.watch` with recursive option for `--watch` mode (requires Node 18+ or Bun)
- Use `loadMeta(meta)` to load generated meta.json — eliminates the old `as unknown as JcMeta` cast
- Example `.next` cache sometimes stale — `rm -rf example/.next` before build if errors
