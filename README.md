# jc — just-components

Auto-discovery component showcase with TypeScript props introspection, faker-generated defaults, and a fixture plugin system for real component integration.

Think of it as a lightweight, zero-config alternative to Storybook — point it at your component directory, run `jc extract`, and get a full interactive playground.

## Quick Start

### 1. Install

```bash
bun add jc
```

### 2. Extract metadata

```bash
# Uses jc.config.ts or built-in defaults (src/components/ui/**/*.tsx)
bunx jc extract
```

This generates two files in your output directory (default `src/jc/generated/`):

- **`meta.json`** — component names, props, types, default values, descriptions
- **`registry.ts`** — lazy import map for each component

### 3. Add the showcase page

```tsx
// src/app/jc/page.tsx
import { JcPage } from './jc-page-client'

export default function Page() {
  return <JcPage />
}
```

```tsx
// src/app/jc/jc-page-client.tsx
'use client'

import type { JcMeta } from 'jc'
import { ShowcaseApp } from 'jc'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export function JcPage() {
  return <ShowcaseApp meta={meta as JcMeta} registry={registry} />
}
```

Open `/jc` in your browser — you'll see a full component showcase with a sidebar, live preview, interactive prop controls, and a code snippet.

## Configuration

Create a `jc.config.ts` at your project root:

```ts
import { defineConfig } from 'jc/config'

export default defineConfig({
  // Glob pattern for component files (relative to project root)
  componentGlob: 'src/components/ui/**/*.tsx',

  // Files to skip (basenames)
  excludeFiles: ['index.ts', 'toaster.tsx'],

  // Components to exclude by display name
  excludeComponents: ['DialogPortal', 'DialogOverlay'],

  // Props to always filter out
  filteredProps: ['ref', 'key', 'dangerouslySetInnerHTML'],

  // Regex patterns for props to filter (event handlers, aria, data attributes)
  filteredPropPatterns: [
    '^on(?!OpenChange|CheckedChange|ValueChange|Select)[A-Z]',
    '^aria-',
    '^data-',
  ],

  // Where to write generated files
  outputDir: 'src/jc/generated',
})
```

All fields are optional — sensible defaults target shadcn/ui projects.

## Fixture Plugins

By default, component-type props (icons, ReactNode, etc.) show a plain text input. **Fixture plugins** let you provide real components from your stack so the showcase renders actual icons, badges, or any custom element.

### Defining fixtures

```ts
// src/app/jc/fixtures.ts
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
    // ...more fixtures
  ],
})
```

### Passing fixtures to the showcase

```tsx
import { lucideFixtures } from './fixtures'

export function JcPage() {
  return (
    <ShowcaseApp
      meta={meta as JcMeta}
      registry={registry}
      fixtures={[lucideFixtures]}
    />
  )
}
```

### How it works

| Concept | Description |
|---------|-------------|
| **Qualified key** | Each fixture gets a `'pluginName/key'` identifier (e.g. `'lucide/star'`), stored as the prop value internally |
| **`render()`** | Called to produce the actual ReactNode in the preview area |
| **`renderIcon()`** | Optional small version (14px) for the icon picker grid; falls back to `render()` |
| **`category`** | Used to filter fixtures by `componentKind` — e.g. fixtures with `category: 'icons'` appear for props tagged as `componentKind: 'icon'` |
| **Children mode** | When fixtures are available, the children control gets a Text/Fixture toggle — in fixture mode, you pick any fixture to render as children |
| **Code preview** | The code snippet shows `<Star />` (PascalCased label) instead of raw keys |
| **No fixtures** | Without fixtures, component props fall back to a text input |

You can register multiple plugins — they're merged into a single flat list:

```tsx
<ShowcaseApp fixtures={[lucideFixtures, badgeFixtures, customFixtures]} />
```

## Architecture

```
src/
├── cli.ts                          # CLI entry point (jc extract)
├── config.ts                       # Config resolution + defineConfig helper
├── types.ts                        # All TypeScript interfaces
├── index.ts                        # Public API exports
├── extract/
│   └── extract.ts                  # react-docgen-typescript extraction + registry generation
├── lib/
│   ├── faker-map.ts                # Prop name → faker value heuristics
│   ├── fixtures.ts                 # Fixture resolution, filtering, code string generation
│   ├── use-showcase-state.ts       # Central state hook (selection, props, children, fixtures)
│   └── use-theme.ts                # Light/dark/auto theme management
└── components/
    ├── showcase-app.tsx            # Root component (layout, theme, wiring)
    ├── showcase-sidebar.tsx        # Component list with search
    ├── showcase-controls.tsx       # Prop editor panel + children mode toggle
    ├── showcase-field.tsx          # Individual control field + ComponentPicker + FixturePicker
    └── showcase-preview.tsx        # Live render + code preview + error boundary
```

## Exports

### `jc` (main entry)

| Export | Type | Description |
|--------|------|-------------|
| `ShowcaseApp` | Component | Root showcase UI — accepts `meta`, `registry`, and optional `fixtures` |
| `defineFixtures` | Function | Type-safe identity helper for defining fixture plugins |
| `JcMeta` | Type | Full extraction output shape |
| `JcComponentMeta` | Type | Single component metadata |
| `JcPropMeta` | Type | Single prop metadata |
| `JcFixture` | Type | One fixture item |
| `JcFixturePlugin` | Type | A named set of fixtures |
| `JcConfig` | Type | Configuration shape |
| `JcControl` | Type | Resolved control definition |
| `JcControlType` | Type | Control type union |

### `jc/config`

| Export | Type | Description |
|--------|------|-------------|
| `defineConfig` | Function | Type-safe config helper for `jc.config.ts` |
| `resolveConfig` | Function | Merge user config with defaults |
| `defaultConfig` | Object | Built-in default configuration |

## CLI

```
just-components (jc) — Component showcase toolkit

Commands:
  extract              Extract component metadata and generate registry
    --config <path>    Path to config file (default: jc.config.ts)

Usage:
  bunx jc extract                    # Uses jc.config.ts or defaults
  bunx jc extract --config path.ts   # Custom config file
```

## Features

- **Zero config** — works out of the box for shadcn/ui projects
- **TypeScript introspection** — reads prop types, defaults, descriptions, and enum values via react-docgen-typescript
- **Smart defaults** — generates realistic fake values (names, emails, dates, prices) based on prop names using faker
- **Component-type props** — detects `LucideIcon`, `ReactNode`, `ReactElement` props and offers a dedicated picker
- **Fixture plugins** — host app provides real components instead of hardcoded placeholders
- **Children support** — text input or fixture picker for components that accept children
- **Live code preview** — JSX snippet updates as you change props
- **Light/dark/auto theme** — follows system preference or manual toggle
- **Lazy loading** — components load on demand from the registry
- **Error boundary** — broken components don't crash the whole showcase

## Requirements

- React >= 18
- TypeScript >= 5
- Node.js / Bun runtime

## License

MIT
