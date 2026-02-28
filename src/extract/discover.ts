/**
 * Smart auto-discovery — probes the filesystem for component directories
 * and filters non-component files.
 *
 * Used when no `componentGlob` / `componentGlobs` is configured,
 * enabling zero-config `jc extract`.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'

// ── Multi-glob component discovery ───────────────────────────

/**
 * Ordered by specificity — more specific patterns first so that
 * a project with both `src/components/ui/` and `src/components/`
 * gets both patterns included.
 */
const DISCOVERY_PATTERNS = [
  'src/components/ui/**/*.tsx',
  'components/ui/**/*.tsx',
  'src/components/**/*.tsx',
  'components/**/*.tsx',
  'src/ui/**/*.tsx',
  'ui/**/*.tsx',
  'app/components/**/*.tsx',
  'src/app/components/**/*.tsx',
]

/**
 * Extract the directory prefix from a glob pattern.
 * e.g. 'src/components/ui/**\/*.tsx' → 'src/components/ui'
 */
function globDirPrefix(pattern: string): string {
  const idx = pattern.indexOf('*')
  if (idx < 0) return pattern
  const prefix = pattern.slice(0, idx)
  // Remove trailing slash
  return prefix.replace(/\/$/, '')
}

/**
 * Probe the filesystem and return all glob patterns whose directory
 * prefix exists on disk. Falls back to `['src/components/**\/*.tsx']`
 * if nothing is found.
 */
export function discoverComponentGlobs(projectRoot: string): string[] {
  const matched: string[] = []

  for (const pattern of DISCOVERY_PATTERNS) {
    const dir = join(projectRoot, globDirPrefix(pattern))
    if (existsSync(dir)) {
      matched.push(pattern)
    }
  }

  if (matched.length === 0) {
    return ['src/components/**/*.tsx']
  }

  return matched
}

// ── Non-component file filtering ─────────────────────────────

export const NON_COMPONENT_PATTERNS = [
  /\.test\.tsx?$/,
  /\.spec\.tsx?$/,
  /\.stories\.tsx?$/,
  /\.d\.ts$/,
  /\/hooks?\//,
  /\/utils?\//,
  /\/lib\//,
  /\/providers?\//,
  /\/contexts?\//,
  /\/types?\//,
]

export const NON_COMPONENT_FILENAMES = new Set([
  'index.ts',
  'index.tsx',
  'types.ts',
  'types.tsx',
  'utils.ts',
  'utils.tsx',
  'helpers.ts',
  'helpers.tsx',
  'constants.ts',
  'constants.tsx',
])

/**
 * Next.js App Router convention files — these are framework files, not components.
 * Only applied when framework is detected as Next.js.
 */
export const NEXTJS_CONVENTION_FILES = new Set([
  'layout.tsx',
  'page.tsx',
  'loading.tsx',
  'error.tsx',
  'not-found.tsx',
  'template.tsx',
  'default.tsx',
  'route.ts',
  'middleware.ts',
  'global-error.tsx',
  'opengraph-image.tsx',
])

/** Returns true if the file path looks like a non-component file */
export function isNonComponentFile(
  relPath: string,
  fileName: string,
  framework?: 'next' | 'react',
): boolean {
  if (NON_COMPONENT_FILENAMES.has(fileName)) return true
  if (framework === 'next' && NEXTJS_CONVENTION_FILES.has(fileName)) return true
  for (const pattern of NON_COMPONENT_PATTERNS) {
    if (pattern.test(relPath)) return true
  }
  return false
}
