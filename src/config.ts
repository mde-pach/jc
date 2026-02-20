import type { JcConfig } from './types.js'

/** Default configuration — sensible defaults for shadcn/ui projects */
export const defaultConfig: JcConfig = {
  componentGlob: 'src/components/ui/**/*.tsx',
  excludeFiles: [
    'index.ts',
    'toaster.tsx',
    'form.tsx',
    'form-fields.tsx',
  ],
  excludeComponents: [
    'DialogPortal',
    'DialogOverlay',
    'DialogClose',
  ],
  filteredProps: [
    'ref',
    'key',
    'dangerouslySetInnerHTML',
    'suppressContentEditableWarning',
    'suppressHydrationWarning',
  ],
  filteredPropPatterns: [
    // Event handlers EXCEPT specific Radix ones
    '^on(?!OpenChange|CheckedChange|ValueChange|Select)[A-Z]',
    // ARIA attributes
    '^aria-',
    // Data attributes
    '^data-',
  ],
  outputDir: 'src/jc/generated',
  pathAlias: { '@/': 'src/' },
}

/** Deduplicated union of two arrays */
function mergeArrays(defaults: string[], user: string[] | undefined): string[] {
  if (!user) return defaults
  return [...new Set([...defaults, ...user])]
}

/** Merge user config with defaults — arrays are merged (union), not replaced */
export function resolveConfig(userConfig: Partial<JcConfig>): JcConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    excludeFiles: mergeArrays(defaultConfig.excludeFiles ?? [], userConfig.excludeFiles),
    excludeComponents: mergeArrays(defaultConfig.excludeComponents ?? [], userConfig.excludeComponents),
    filteredProps: mergeArrays(defaultConfig.filteredProps ?? [], userConfig.filteredProps),
    filteredPropPatterns: mergeArrays(defaultConfig.filteredPropPatterns ?? [], userConfig.filteredPropPatterns),
    pathAlias: userConfig.pathAlias ?? defaultConfig.pathAlias,
  }
}

export function defineConfig(config: Partial<JcConfig>): Partial<JcConfig> {
  return config
}
