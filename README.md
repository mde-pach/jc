# jc — just-components

A zero-config component showcase for React. Auto-discovers your components from TypeScript, extracts prop metadata, and generates an interactive playground.

## Quick Start

### Install from Git

This package is not yet published to npm. Install directly from GitHub:

```bash
# bun
bun add github:mde-pach/jc

# npm
npm install github:mde-pach/jc

# pnpm
pnpm add github:mde-pach/jc

# yarn
yarn add mde-pach/jc
```

To pin a specific commit or branch:

```bash
bun add github:mde-pach/jc#main          # branch
bun add github:mde-pach/jc#abc1234       # commit hash
```

Then extract component metadata:

```bash
npx jc extract       # scan components, generate metadata
```

Then add a showcase page:

```tsx
'use client'

import type { JcMeta } from 'jc'
import { ShowcaseApp } from 'jc'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default function ShowcasePage() {
  return <ShowcaseApp meta={meta as unknown as JcMeta} registry={registry} />
}
```

## Documentation

Full docs with configuration, fixture plugins, API reference, and framework guides:

**[jc Documentation Site](./example/)** — run `cd example && bun install && bun run dev` to browse locally.

- [Getting Started](./example/src/app/docs/getting-started/page.tsx) — install, extract, first showcase
- [Configuration](./example/src/app/docs/configuration/page.tsx) — all options, array merging, path aliases
- [Fixtures](./example/src/app/docs/fixtures/page.tsx) — icon/component fixture plugins
- [API Reference](./example/src/app/docs/api/page.tsx) — all exports and types
- [Frameworks](./example/src/app/docs/frameworks/page.tsx) — Next.js, Vite, generic React

## Interactive Showcase

The `example/` project doubles as a docs site and a live demo. Run it locally:

```bash
cd example
bun install
npx jc extract
bun run dev
```

Visit `/showcase` for the interactive playground.

## Contributing

```bash
bun install           # install dependencies
bun run test          # run tests (316 tests)
bun run type-check    # TypeScript validation
bun run build         # production build
bun run dev           # watch mode
```

## Requirements

- React >= 18
- TypeScript >= 5
- Node.js >= 18 or Bun

## License

MIT
