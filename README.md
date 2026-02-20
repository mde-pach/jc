# jc — just-components

A lightweight, zero-config component showcase for React. Point it at your component directory, run one command, and get a full interactive playground with prop controls, live preview, and code snippets.

Built as a simpler alternative to Storybook — no addons to configure, no stories to write. jc extracts TypeScript prop metadata automatically and generates smart defaults using faker heuristics.

## Table of Contents

- [Quick Start](#quick-start)
- [CLI Reference](#cli-reference)
- [Configuration](#configuration)
- [Framework Integration](#framework-integration)
- [Fixture Plugins](#fixture-plugins)
- [ShowcaseApp Props](#showcaseapp-props)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Example Project](#example-project)
- [Contributing](#contributing)

---

## Quick Start

### 1. Install

```bash
# npm
npm install jc

# bun
bun add jc
```

**Peer dependencies:** `react >= 18`, `react-dom >= 18`

### 2. Extract component metadata

```bash
npx jc extract
```

This scans your component files (default: `src/components/ui/**/*.tsx`), reads TypeScript prop types via `react-docgen-typescript`, and generates two files in `src/jc/generated/`:

| File | Purpose |
|------|---------|
| `meta.json` | Component names, props, types, defaults, descriptions, enum values |
| `registry.ts` | Lazy `import()` map for each component, keyed by display name |

### 3. Add a showcase page

```tsx
// src/app/showcase/page.tsx (Next.js App Router)
'use client'

import type { JcMeta } from 'jc'
import { ShowcaseApp } from 'jc'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default function ShowcasePage() {
  return <ShowcaseApp meta={meta as unknown as JcMeta} registry={registry} />
}
```

Open `/showcase` in your browser. You get:

- **Left sidebar** — searchable component list, grouped by directory
- **Center** — live component preview with checkered background
- **Right panel** — interactive prop controls (text, number, boolean, select, component picker)
- **Bottom** — auto-generated JSX code snippet
- **Header** — theme toggle (auto/light/dark) and viewport picker (full/375/768/1280px)

---

## CLI Reference

```
jc — just-components showcase toolkit

Commands:
  extract              Extract component metadata and generate registry
    --config <path>    Path to config file (default: jc.config.ts)
    --watch, -w        Re-extract on file changes (200ms debounce)
```

### Examples

```bash
# Extract with defaults
npx jc extract

# Extract with custom config
npx jc extract --config custom.config.ts

# Watch mode — re-extracts when .tsx files change
npx jc extract --watch
```

### What the extractor does

1. **Discovers files** matching `componentGlob` (supports `**` recursive globs)
2. **Parses TypeScript** via `react-docgen-typescript` with strict compiler options
3. **Filters props** — removes `ref`, `key`, event handlers, aria/data attributes (configurable)
4. **Detects component props** — identifies `LucideIcon`, `ReactNode`, `ReactElement` via type patterns and name heuristics
5. **Cleans enum values** — strips TypeScript type tokens that leak through docgen (e.g. `ReactNode`, `JSX.Element`)
6. **Deduplicates** — when the same component is re-exported from multiple files, keeps the version with the most props
7. **Generates registry** — creates lazy `import()` entries with configurable path aliases

---

## Configuration

Create a `jc.config.ts` at your project root:

```ts
import { defineConfig } from 'jc/config'

export default defineConfig({
  componentGlob: 'src/components/ui/**/*.tsx',
  outputDir: 'src/jc/generated',
})
```

### All Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `componentGlob` | `string` | `'src/components/ui/**/*.tsx'` | Glob pattern for component files (relative to project root) |
| `outputDir` | `string` | `'src/jc/generated'` | Where to write `meta.json` and `registry.ts` |
| `pathAlias` | `Record<string, string>` | `{ '@/': 'src/' }` | Path alias mapping for registry imports. Keys are aliases, values are source prefixes |
| `excludeFiles` | `string[]` | `['index.ts', 'toaster.tsx', 'form.tsx', 'form-fields.tsx']` | File basenames to skip |
| `excludeComponents` | `string[]` | `['DialogPortal', 'DialogOverlay', 'DialogClose']` | Components to exclude by display name |
| `filteredProps` | `string[]` | `['ref', 'key', 'dangerouslySetInnerHTML', ...]` | Prop names to always filter out |
| `filteredPropPatterns` | `string[]` | `['^on[A-Z]', '^aria-', '^data-']` | Regex patterns for props to filter |

### Array merging

When you provide array options (`excludeFiles`, `filteredProps`, etc.), they are **merged with defaults** — not replaced. This means you only need to specify additions:

```ts
export default defineConfig({
  // Adds 'skeleton.tsx' to the default exclusion list
  excludeFiles: ['skeleton.tsx'],
})
```

### Path aliases

The `pathAlias` option controls how file paths are transformed in the generated `registry.ts`:

```ts
// Default: src/components/ui/button.tsx → @/components/ui/button
{ '@/': 'src/' }

// Tilde alias: src/components/ui/button.tsx → ~/components/ui/button
{ '~/': 'src/' }

// Scoped alias: src/components/ui/button.tsx → @components/ui/button
{ '@components/': 'src/components/' }
```

---

## Framework Integration

### Next.js (App Router)

**Option A — Direct usage:**

```tsx
// src/app/showcase/page.tsx
'use client'

import type { JcMeta } from 'jc'
import { ShowcaseApp } from 'jc'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default function ShowcasePage() {
  return <ShowcaseApp meta={meta as unknown as JcMeta} registry={registry} />
}
```

**Option B — Using the `jc/next` adapter:**

```tsx
// src/app/showcase/page.tsx
'use client'

import { createShowcasePage } from 'jc/next'
import type { JcMeta } from 'jc'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default createShowcasePage({
  meta: meta as unknown as JcMeta,
  registry,
})
```

The `'use client'` directive is required because the showcase uses React hooks and browser APIs.

If your project uses `next.config.ts` with `transpilePackages`, add `jc`:

```ts
const nextConfig: NextConfig = {
  transpilePackages: ['jc'],
}
```

### Vite / Other React frameworks

jc works with any React setup. The `ShowcaseApp` component is framework-agnostic — it only needs React >= 18:

```tsx
import { ShowcaseApp } from 'jc'
import meta from './generated/meta.json'
import { registry } from './generated/registry'

function App() {
  return <ShowcaseApp meta={meta} registry={registry} />
}
```

---

## Fixture Plugins

By default, component-type props (`LucideIcon`, `ReactNode`, etc.) show a plain text input. Fixture plugins let you provide real components from your stack so the showcase renders actual icons, badges, or any custom element.

### Defining fixtures

```ts
// src/app/showcase/fixtures.ts
import { defineFixtures } from 'jc'
import { Star, Heart, Zap, Bell, Search } from 'lucide-react'
import { createElement } from 'react'

export const lucideFixtures = defineFixtures({
  name: 'lucide',
  fixtures: [
    {
      key: 'star',
      label: 'Star',
      category: 'icons',
      render: () => createElement(Star, { size: 20 }),
      renderIcon: () => createElement(Star, { size: 14 }),
    },
    {
      key: 'heart',
      label: 'Heart',
      category: 'icons',
      render: () => createElement(Heart, { size: 20 }),
      renderIcon: () => createElement(Heart, { size: 14 }),
    },
    // ...
  ],
})
```

### Using fixtures

```tsx
import { lucideFixtures } from './fixtures'

<ShowcaseApp
  meta={meta}
  registry={registry}
  fixtures={[lucideFixtures]}
/>
```

### Fixture API

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | Yes | Unique identifier within the plugin |
| `label` | `string` | Yes | Display name (PascalCased in code preview) |
| `category` | `string` | No | Filters fixtures by `componentKind` (e.g. `'icons'` matches kind `'icon'`) |
| `render()` | `() => ReactNode` | Yes | Produces the full-size element for the preview |
| `renderIcon()` | `() => ReactNode` | No | Small version (14px) for the picker grid; falls back to `render()` |

### How fixtures work

- Each fixture gets a **qualified key** (`'pluginName/key'`, e.g. `'lucide/star'`) used as the internal prop value
- At render time, qualified keys are resolved to real ReactNodes via `render()`
- The code preview shows `<Star />` instead of raw keys
- When fixtures are available, component-type props show a **picker** instead of a text input
- **Children** get a Text/Fixture toggle — in fixture mode, pick any fixture to render as children
- Multiple plugins merge into a single flat list: `fixtures={[lucide, badges, custom]}`

---

## ShowcaseApp Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `meta` | `JcMeta` | Yes | Component metadata from `meta.json` |
| `registry` | `Record<string, () => Promise<ComponentType>>` | Yes | Lazy loaders from `registry.ts` |
| `fixtures` | `JcFixturePlugin[]` | No | Fixture plugins for component-type props |
| `wrapper` | `ComponentType<{ children: ReactNode }>` | No | Wrapper around previewed components for context providers |

### Wrapper

Use the `wrapper` prop to inject context providers that your components need:

```tsx
<ShowcaseApp
  meta={meta}
  registry={registry}
  wrapper={({ children }) => (
    <ThemeProvider>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </ThemeProvider>
  )}
/>
```

---

## API Reference

### Exports from `jc`

| Export | Kind | Description |
|--------|------|-------------|
| `ShowcaseApp` | Component | Root showcase UI |
| `defineFixtures(plugin)` | Function | Type-safe helper for creating fixture plugins |
| `JcMeta` | Type | Full extraction output shape |
| `JcComponentMeta` | Type | Single component metadata |
| `JcPropMeta` | Type | Single prop metadata |
| `JcConfig` | Type | Configuration shape |
| `JcFixture` | Type | One fixture item |
| `JcFixturePlugin` | Type | A named set of fixtures |
| `JcControl` | Type | Resolved control definition |
| `JcControlType` | Type | Control type union (`text`, `number`, `boolean`, `select`, `component`, `json`, `readonly`) |

### Exports from `jc/config`

| Export | Kind | Description |
|--------|------|-------------|
| `defineConfig(config)` | Function | Type-safe helper for `jc.config.ts` |
| `resolveConfig(config)` | Function | Merges user config with defaults |
| `defaultConfig` | Object | Built-in default values |

### Exports from `jc/next`

| Export | Kind | Description |
|--------|------|-------------|
| `createShowcasePage(options)` | Function | Creates a client component for Next.js App Router pages |

---

## Architecture

```
src/
├── cli.ts                          # CLI entry (jc extract / --watch)
├── config.ts                       # Config resolution + defineConfig
├── types.ts                        # All TypeScript interfaces
├── index.ts                        # Public API exports
├── next.tsx                        # Next.js adapter (jc/next)
├── extract/
│   ├── extract.ts                  # Extraction engine + registry generation
│   └── extract.test.ts             # Unit tests (41 tests)
├── lib/
│   ├── faker-map.ts                # Prop name → faker value heuristics
│   ├── faker-map.test.ts           # Unit tests (23 tests)
│   ├── fixtures.ts                 # Fixture resolution + filtering
│   ├── fixtures.test.ts            # Unit tests (18 tests)
│   ├── use-showcase-state.ts       # Central state hook + URL sync
│   └── use-theme.ts                # Light/dark/auto theme
├── config.test.ts                  # Config unit tests (11 tests)
└── components/
    ├── showcase-app.tsx            # Root component (layout, theme, viewport)
    ├── showcase-sidebar.tsx        # Component list with directory grouping
    ├── showcase-controls.tsx       # Prop editor panel
    ├── showcase-field.tsx          # Individual control fields + pickers
    └── showcase-preview.tsx        # Live render + code preview + error boundary
```

### Build output

| File | Format | Contents |
|------|--------|----------|
| `dist/index.js` | ESM | ShowcaseApp + UI components (has `'use client'` directive) |
| `dist/config.js` | ESM | Config utilities (Node-safe, no React) |
| `dist/next.js` | ESM | Next.js adapter (has `'use client'` directive) |
| `dist/cli.cjs` | CJS | CLI binary with `#!/usr/bin/env node` shebang |
| `dist/*.d.ts` | — | TypeScript declarations for all entries |

### Key design decisions

- **Inline CSS with CSS custom properties** — no Tailwind, no external stylesheet, fully self-contained
- **`react-docgen-typescript` bundled into CLI** — not a runtime dependency for UI consumers
- **`@faker-js/faker` externalized** — tree-shakeable by host bundler, only loaded for fake values
- **Lazy component loading** — registry uses dynamic `import()`, components load on demand
- **URL state sync** — selected component persists in `?component=` query param

---

## Example Project

The `example/` directory contains a minimal Next.js app with 6 sample components:

```bash
cd example
bun install
bunx jc extract    # generates meta.json + registry.ts
bun run dev        # opens at http://localhost:3000
```

Visit `/showcase` to see the interactive playground.

**Sample components included:** Alert, Avatar, Badge, Button, Card, Input — each demonstrating different prop types (strings, enums, booleans, ReactNode children).

---

## Contributing

```bash
# Install dependencies
bun install

# Run tests (93 tests)
bun run test

# Run tests in watch mode
bun run test:watch

# Type check
bun run type-check

# Build
bun run build

# Development (watch mode)
bun run dev
```

### Project structure

- Source code in `src/`
- Tests co-located next to source files (`*.test.ts`)
- Build output in `dist/`
- Example project in `example/`

### CI

GitHub Actions runs on every push and PR: type check, tests, build, and dist output verification.

---

## Requirements

- React >= 18
- TypeScript >= 5
- Node.js >= 18 or Bun

## License

MIT
