import type { JcConfig } from './types.js'

export type { Extractor, ExtractorContext, ExtractorOutput } from './extract/extractor.js'

/** Default configuration — sensible defaults for shadcn/ui projects */
export const defaultConfig: JcConfig = {
  componentGlob: 'src/components/ui/**/*.tsx',
  excludeFiles: ['index.ts', 'toaster.tsx', 'form.tsx', 'form-fields.tsx'],
  excludeComponents: ['DialogPortal', 'DialogOverlay', 'DialogClose'],
  filteredProps: [
    'ref',
    'key',
    'dangerouslySetInnerHTML',
    'suppressContentEditableWarning',
    'suppressHydrationWarning',
  ],
  filteredPropPatterns: [
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

/**
 * Pure config merge — no side effects, no filesystem access.
 * Arrays are merged (union), not replaced.
 *
 * @param userConfig - Partial config from `jc.config.ts` or inline options
 * @param detectedPathAlias - Optional path aliases detected from environment
 * @returns Fully resolved config with defaults applied
 */
export function mergeConfig(
  userConfig: Partial<JcConfig>,
  detectedPathAlias?: Record<string, string>,
): JcConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    excludeFiles: mergeArrays(defaultConfig.excludeFiles ?? [], userConfig.excludeFiles),
    excludeComponents: mergeArrays(
      defaultConfig.excludeComponents ?? [],
      userConfig.excludeComponents,
    ),
    filteredProps: mergeArrays(defaultConfig.filteredProps ?? [], userConfig.filteredProps),
    filteredPropPatterns: mergeArrays(
      defaultConfig.filteredPropPatterns ?? [],
      userConfig.filteredPropPatterns,
    ),
    pathAlias: userConfig.pathAlias ?? detectedPathAlias ?? defaultConfig.pathAlias,
  }
}

/**
 * Merge user config with defaults — arrays are merged (union), not replaced.
 *
 * When `projectRoot` is provided and no explicit `pathAlias` is set,
 * environment detection is used to auto-detect path aliases from tsconfig.json.
 * The environment detection uses `require()` and is only available in the CLI (CJS bundle).
 *
 * @param userConfig - Partial config from `jc.config.ts` or inline options
 * @param projectRoot - Absolute path to project root (enables auto-detection of path aliases)
 * @returns Fully resolved config with defaults applied
 */
export function resolveConfig(
  userConfig: Partial<JcConfig>,
  projectRoot?: string,
): JcConfig {
  // Detect environment when projectRoot is available and pathAlias is not explicitly set
  let detectedPathAlias: Record<string, string> | undefined
  if (projectRoot && !userConfig.pathAlias) {
    try {
      // Dynamic import to avoid bundling detect-environment in the UI build.
      // This is only used by the CLI (CJS bundle).
      // biome-ignore lint/suspicious/noExplicitAny: dynamic require for CLI-only code
      const { detectEnvironment, formatEnvironment } = require('./extract/detect-environment.js') as any
      const env = detectEnvironment(projectRoot)
      detectedPathAlias = env.pathAlias
      console.log(`[jc] Detected: ${formatEnvironment(env)}`)

      // Log path alias if different from default
      const aliasEntries = Object.entries(env.pathAlias)
      if (aliasEntries.length > 0) {
        const aliasStr = aliasEntries.map(([k, v]) => `${k} → ${v}`).join(', ')
        console.log(`[jc] Path alias: ${aliasStr} (from tsconfig.json)`)
      }
    } catch {
      // Environment detection is best-effort — don't fail the build
    }
  }

  return mergeConfig(userConfig, detectedPathAlias)
}

export function defineConfig(config: Partial<JcConfig>): Partial<JcConfig> {
  return config
}
