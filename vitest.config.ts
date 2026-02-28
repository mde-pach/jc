import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/cli.ts',
        'src/index.ts',
        'src/next.tsx',
        'src/types.ts',
        // Barrel re-export — zero runtime logic, same as index.ts
        'src/advanced.ts',
        // React adapter — thin wrapper, same category as next.tsx
        'src/react.tsx',
        // Pure TypeScript interfaces — zero runtime code
        'src/extract/extractor.ts',
        // React context/hooks wiring — no testable logic without mount
        'src/lib/showcase-context.tsx',
        // Single identity function (type cast) — trivial
        'src/lib/load-meta.ts',
        // React components — pure logic (generateCodeTokens, formatArrayTokens) is exported
        // and tested; remaining code is React rendering/hooks not unit-testable without mount
        'src/components/**',
        // React hook wiring — pure logic (generateDefaults, detect) is exported and tested
        // separately; the remaining code is useState/useEffect/useCallback lifecycle glue
        'src/lib/use-showcase-state.ts',
        'src/lib/use-theme.ts',
        'src/lib/use-resolved-component.tsx',
        // Client-only modules — URL manipulation, CSS custom properties, syntax highlighting
        'src/lib/url-sync.ts',
        'src/lib/theme-vars.ts',
        'src/lib/code-tokens.ts',
        // Test fixtures
        'src/extract/__fixtures__/**',
      ],
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 90,
        lines: 85,
      },
    },
  },
})
