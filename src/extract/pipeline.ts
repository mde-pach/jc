/**
 * Extraction pipeline — framework-agnostic orchestration.
 *
 * Handles file discovery, runs the extractor, then applies post-processing:
 * deduplication, wrapper detection, example preset parsing, usage analysis.
 */

import * as fs from 'node:fs'
import { readdirSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import type {
  ExtractionResult,
  JcComponentMeta,
  JcConfig,
  JcExamplePreset,
  JcMeta,
} from '../types.js'
import { discoverComponentGlobs, isNonComponentFile } from './discover.js'
import { detectProjectFramework } from './detect-environment.js'
import { detectWrapperFromExamples, parseExamplePreset } from './example-parser.js'
import type { Extractor } from './extractor.js'
import { analyzeComponentUsage } from './usage-analysis.js'

// ── File discovery ────────────────────────────────────────────

/**
 * Cross-version glob: Node 22+ has globSync in node:fs,
 * older versions get a simple recursive walk fallback.
 */
export function findFiles(pattern: string, cwd: string): string[] {
  // Node 22+ globSync (accessed dynamically to avoid import errors on Bun/older Node)
  // biome-ignore lint/suspicious/noExplicitAny: globSync is not in @types/node < 22, runtime feature-detect only
  const maybeGlobSync = (fs as any).globSync
  if (typeof maybeGlobSync === 'function') {
    try {
      const matches = maybeGlobSync(pattern, { cwd }) as string[]
      return matches.filter((m) => !m.includes('node_modules'))
    } catch {
      // fallback below
    }
  }

  // Fallback: recursive walk + glob-to-regex matching
  const results: string[] = []

  // Convert glob pattern to regex:
  // - "**" matches any number of path segments
  // - "*" matches anything except path separator
  // - "?" matches a single non-separator character
  // - Escape all other regex special chars
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex specials (not * or ?)
    .replace(/\*\*/g, '\0GLOBSTAR\0')       // placeholder for **
    .replace(/\*/g, '[^/]*')                // * → match within segment
    .replace(/\?/g, '[^/]')                 // ? → single char
    .replace(/\0GLOBSTAR\0/g, '.*')         // ** → match across segments
  const regex = new RegExp(`^${regexStr}$`)

  // Determine the walk root: everything before the first wildcard segment
  const firstWild = pattern.search(/[*?]/)
  const prefix = firstWild > 0 ? pattern.slice(0, pattern.lastIndexOf('/', firstWild - 1) + 1) : ''
  const walkRoot = prefix ? resolve(cwd, prefix) : cwd

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walk(full)
      } else if (entry.isFile()) {
        const rel = relative(cwd, full)
        if (regex.test(rel)) {
          results.push(rel)
        }
      }
    }
  }

  if (fs.existsSync(walkRoot)) {
    walk(walkRoot)
  }
  return results
}

export function discoverFiles(projectRoot: string, config: JcConfig): string[] {
  const excludeSet = new Set(config.excludeFiles ?? [])

  // Detect framework for smart file filtering
  const framework = detectProjectFramework(projectRoot)

  // Determine which globs to use:
  // 1. config.componentGlobs (array) takes priority
  // 2. config.componentGlob (string) as single-glob shorthand
  // 3. Auto-discover from filesystem when neither is explicitly set
  let globs: string[]

  if (config.componentGlobs && config.componentGlobs.length > 0) {
    globs = config.componentGlobs
  } else if (config.componentGlob) {
    globs = [config.componentGlob]
  } else {
    globs = discoverComponentGlobs(projectRoot)
    console.log(`[jc] Auto-detected component patterns: ${globs.join(', ')}`)
  }

  // Collect files from all globs, deduplicate by resolved path
  const seen = new Set<string>()
  const result: string[] = []

  for (const glob of globs) {
    const matches = findFiles(glob, projectRoot)
    for (const m of matches) {
      const fileName = basename(m)
      if (excludeSet.has(fileName)) continue
      if (!fileName.endsWith('.tsx')) continue
      // Filter non-component files (tests, utils, hooks, framework conventions)
      if (isNonComponentFile(m, fileName, framework)) continue

      const resolved = resolve(projectRoot, m)
      if (!seen.has(resolved)) {
        seen.add(resolved)
        result.push(resolved)
      }
    }
  }

  return result.sort()
}

// ── Logger interface ─────────────────────────────────────────

export interface PipelineLogger {
  log(message: string): void
  warn(message: string): void
}

const consoleLogger: PipelineLogger = {
  log: (msg) => console.log(msg),
  warn: (msg) => console.warn(msg),
}

// ── Pipeline ──────────────────────────────────────────────────

export function runPipeline(
  projectRoot: string,
  config: JcConfig,
  extractor: Extractor,
  logger: PipelineLogger = consoleLogger,
): ExtractionResult {
  const files = discoverFiles(projectRoot, config)

  logger.log(`[jc] Found ${files.length} component files`)

  // Run the extractor
  const output = extractor.extract({ projectRoot, config, files })
  const { components, warnings } = output
  const { filesSkipped } = output

  // Deduplicate: keep the version with more props
  const deduped = new Map<string, JcComponentMeta>()
  for (const comp of components) {
    const existing = deduped.get(comp.displayName)
    if (!existing || Object.keys(comp.props).length > Object.keys(existing.props).length) {
      deduped.set(comp.displayName, comp)
    }
  }
  const finalComponents = [...deduped.values()]

  // Wrapper detection: if all @example blocks wrap the component in the same parent(s),
  // record those parents as required wrappers (only if they exist in extracted components)
  const componentNames = new Set(finalComponents.map((c) => c.displayName))
  for (const comp of finalComponents) {
    if (!comp.tags?.example) continue
    const detected = detectWrapperFromExamples(comp.tags.example, comp.displayName)
    if (detected) {
      const validWrappers = detected.filter((w) => componentNames.has(w.wrapperName))
      if (validWrappers.length > 0) {
        comp.wrapperComponents = validWrappers.map((w) => ({
          displayName: w.wrapperName,
          defaultProps: w.defaultProps,
        }))
      }
    }
  }

  // Example preset parsing: parse @example blocks into selectable presets
  for (const comp of finalComponents) {
    if (!comp.tags?.example) continue
    const presets: JcExamplePreset[] = []
    for (let i = 0; i < comp.tags.example.length; i++) {
      const parsed = parseExamplePreset(comp.tags.example[i], comp.displayName)
      if (parsed) {
        presets.push({
          index: i,
          ...(parsed.label ? { label: parsed.label } : {}),
          propValues: parsed.subjectProps,
          childrenText: parsed.childrenText,
          parsedChildren: parsed.parsedChildren.length > 0 ? parsed.parsedChildren : undefined,
          wrapperProps: parsed.wrapperProps,
        })
      }
    }
    if (presets.length > 0) {
      comp.examples = presets
    }
  }

  // Usage analysis: count direct + transitive references across the project
  const usageCounts = analyzeComponentUsage(projectRoot, finalComponents)
  for (const comp of finalComponents) {
    comp.usageCount = usageCounts.get(comp.displayName)
  }

  logger.log(
    `[jc] Extracted ${finalComponents.length} components (${components.length} before dedup)`,
  )

  if (warnings.length > 0) {
    const errors = warnings.filter((w) => w.type === 'FILE_PARSE_ERROR')
    const fallbacks = warnings.filter((w) => w.type === 'PROP_FALLBACK')
    if (errors.length > 0) {
      logger.warn(`[jc] ${errors.length} file(s) failed to parse`)
    }
    if (fallbacks.length > 0) {
      logger.log(`[jc] ${fallbacks.length} prop(s) used regex fallback`)
    }
  }

  const componentDir =
    config.componentGlobs && config.componentGlobs.length > 0
      ? config.componentGlobs.join(', ')
      : config.componentGlob
  const meta: JcMeta = {
    generatedAt: new Date().toISOString(),
    componentDir,
    components: finalComponents,
    pathAlias: config.pathAlias ?? { '@/': 'src/' },
  }

  return {
    meta,
    warnings,
    stats: {
      filesScanned: files.length,
      filesSkipped,
      componentsBefore: components.length,
      componentsAfter: finalComponents.length,
    },
  }
}
