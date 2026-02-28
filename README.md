# jc — just-components

A zero-config component showcase for React. Auto-discovers your components from TypeScript, extracts prop metadata, and generates an interactive playground with smart defaults.

## Quick Start

### Install from Git

This package is not yet published to npm. Install directly from GitHub:

```bash
# bun
bun add github:mde-pach/jc

# npm / pnpm / yarn
npm install github:mde-pach/jc
pnpm add github:mde-pach/jc
yarn add mde-pach/jc
```

### Extract component metadata

```bash
npx jc extract       # scan components, generate meta.json + registry.ts
```

### Create a showcase page

**Next.js (recommended):**

```tsx
// app/showcase/page.tsx
import { createShowcasePage } from 'jc/next'
import { lucidePlugin } from 'jc/plugins/lucide'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default createShowcasePage({
  meta,
  registry,
  plugins: [lucidePlugin],
})
```

**Vite / CRA / Plain React:**

```tsx
import { createShowcase } from 'jc/react'
import { lucidePlugin } from 'jc/plugins/lucide'
import meta from './jc/generated/meta.json'
import { registry } from './jc/generated/registry'

export default createShowcase({
  meta,
  registry,
  plugins: [lucidePlugin],
})
```

**Manual setup (any framework):**

```tsx
'use client'
import { ShowcaseApp, loadMeta } from 'jc'
import { lucidePlugin } from 'jc/plugins/lucide'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default function ShowcasePage() {
  return (
    <ShowcaseApp
      meta={loadMeta(meta)}
      registry={registry}
      plugins={[lucidePlugin]}
    />
  )
}
```

### Watch mode

```bash
npx jc extract --watch   # re-extract on file changes
```

## Package Exports

| Entry | Description |
|-------|-------------|
| `jc` | ShowcaseApp, definePlugin, fromComponents, loadMeta, types |
| `jc/advanced` | Sub-components, state hooks, context, reducer, GridPicker, NodePicker |
| `jc/config` | defineConfig, resolveConfig, defaultConfig, Extractor types |
| `jc/next` | createShowcasePage — Next.js App Router adapter |
| `jc/react` | createShowcase — Vite/CRA/plain React adapter |
| `jc/plugins/lucide` | Zero-config Lucide icon picker plugin |

## Documentation

Full docs with configuration, plugins, API reference, and framework guides:

**[jc Documentation Site](./example/)** — run `cd example && bun install && bun run dev` to browse locally.

- [Getting Started](./example/src/app/(site)/docs/getting-started/page.tsx) — install, extract, first showcase
- [Configuration](./example/src/app/(site)/docs/configuration/page.tsx) — all options, array merging, path aliases
- [Plugins](./example/src/app/(site)/docs/fixtures/page.tsx) — plugin system, icon/component plugins
- [API Reference](./example/src/app/(site)/docs/api/page.tsx) — all exports and types
- [Frameworks](./example/src/app/(site)/docs/frameworks/page.tsx) — Next.js, Vite, Remix, generic React

## Interactive Showcase

The `example/` project doubles as a docs site and a live demo:

```bash
cd example
bun install
bunx jc extract
bun run dev
```

Visit `/showcase` for the interactive playground.

## Contributing

```bash
bun install           # install dependencies
bun run test          # run tests (636 tests)
bun run type-check    # TypeScript validation
bun run build         # production build
bun run dev           # watch mode
```

## Requirements

- React >= 18
- TypeScript >= 5
- Node.js >= 18 or Bun

## License

[MIT](./LICENSE)
