import { writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'tsup'

/** Prepend 'use client' directive to built files that need it */
function addUseClientDirective(files: string[]) {
  return () => {
    for (const file of files) {
      const path = resolve('dist', file)
      try {
        const content = readFileSync(path, 'utf-8')
        if (!content.startsWith("'use client'")) {
          writeFileSync(path, `'use client';\n${content}`)
        }
      } catch { /* file may not exist in all builds */ }
    }
  }
}

export default defineConfig([
  // Main library (React components + types + Next.js adapter)
  {
    entry: {
      index: 'src/index.ts',
      config: 'src/config.ts',
      next: 'src/next.tsx',
    },
    format: ['esm'],
    dts: true,
    external: ['react', 'react-dom', '@faker-js/faker'],
    clean: true,
    treeshake: true,
    splitting: true,
    onSuccess: addUseClientDirective(['next.js', 'index.js']),
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
