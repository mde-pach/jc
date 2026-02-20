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
}

/** Merge user config with defaults */
export function resolveConfig(userConfig: Partial<JcConfig>): JcConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    excludeFiles: userConfig.excludeFiles ?? defaultConfig.excludeFiles,
    excludeComponents: userConfig.excludeComponents ?? defaultConfig.excludeComponents,
    filteredProps: userConfig.filteredProps ?? defaultConfig.filteredProps,
    filteredPropPatterns: userConfig.filteredPropPatterns ?? defaultConfig.filteredPropPatterns,
  }
}

export function defineConfig(config: Partial<JcConfig>): Partial<JcConfig> {
  return config
}
