import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'tsup'

/**
 * Post-build: prepend `'use client'` to entry files that contain React components.
 * Needed because esbuild strips module-level string directives, and with
 * `splitting: true` the `banner` option only applies to chunks, not entry re-exports.
 */
const CLIENT_ENTRIES = ['index.js', 'advanced.js', 'next.js', 'react.js', 'plugins/lucide.js']

function injectUseClient() {
  for (const file of CLIENT_ENTRIES) {
    const path = resolve('dist', file)
    try {
      const content = readFileSync(path, 'utf-8')
      if (!content.startsWith("'use client'")) {
        writeFileSync(path, `'use client';\n${content}`)
      }
    } catch {
      // File may not exist if entry was removed — skip silently
    }
  }
}

export default defineConfig([
  // Main library (React components + types + Next.js adapter)
  {
    entry: {
      index: 'src/index.ts',
      advanced: 'src/advanced.ts',
      config: 'src/config.ts',
      next: 'src/next.tsx',
      react: 'src/react.tsx',
      'plugins/lucide': 'src/plugins/lucide/index.ts',
    },
    format: ['esm'],
    dts: true,
    external: ['react', 'react-dom', '@faker-js/faker', 'lucide-react'],
    clean: true,
    treeshake: true,
    splitting: true,
    onSuccess: injectUseClient,
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
