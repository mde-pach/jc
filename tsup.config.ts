import { defineConfig } from 'tsup'

export default defineConfig([
  // Main library (React components + types)
  {
    entry: {
      index: 'src/index.ts',
      config: 'src/config.ts',
    },
    format: ['esm'],
    dts: true,
    external: ['react', 'react-dom', '@faker-js/faker'],
    clean: true,
    treeshake: true,
    splitting: true,
  },
  // CLI binary (Node.js, no React) — bundles all deps into a single file
  {
    entry: { cli: 'src/cli.ts' },
    format: ['cjs'],
    platform: 'node',
    banner: { js: '#!/usr/bin/env node' },
    noExternal: ['react-docgen-typescript'],
    external: ['typescript'],
  },
])
