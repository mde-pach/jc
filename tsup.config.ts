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
  // CLI binary (Node.js, no React)
  {
    entry: { cli: 'src/cli.ts' },
    format: ['cjs'],
    platform: 'node',
    banner: { js: '#!/usr/bin/env node' },
    external: ['typescript', 'react-docgen-typescript'],
  },
])
