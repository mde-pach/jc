/**
 * Component usage analysis — scans project files for JSX references
 * and computes direct + transitive (indirect) usage counts.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { JcComponentMeta } from '../types.js'

export interface UsageCount {
  direct: number
  indirect: number
  total: number
}

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', '.git', '.turbo', '.cache'])

/**
 * Scan a source string for JSX usages of the given component names.
 * Matches `<ComponentName` followed by whitespace, `/`, or `>`.
 */
export function scanFileForComponents(source: string, componentNames: Set<string>): Set<string> {
  if (componentNames.size === 0) return new Set()

  const escaped = [...componentNames].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`<(${escaped.join('|')})[\\s/>]`, 'g')
  const found = new Set<string>()

  for (const match of source.matchAll(pattern)) {
    found.add(match[1])
  }

  return found
}

/**
 * Recursively find all .tsx files in a directory, skipping common build dirs.
 */
export function findProjectTsxFiles(projectRoot: string): string[] {
  const results: string[] = []

  function walk(dir: string) {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const name of entries) {
      const full = join(dir, name)
      try {
        const stat = statSync(full)
        if (stat.isDirectory()) {
          if (!SKIP_DIRS.has(name)) walk(full)
        } else if (name.endsWith('.tsx')) {
          results.push(full)
        }
      } catch {
        // skip inaccessible entries
      }
    }
  }

  walk(projectRoot)
  return results
}

/**
 * Build the usage graph: for each extracted component, count how many files
 * use it directly, and which extracted components render other extracted components.
 */
export function buildUsageGraph(
  projectRoot: string,
  extractedComponents: Map<string, string>,
  allTsxFiles: string[],
): {
  directCounts: Map<string, number>
  componentGraph: Map<string, Set<string>>
} {
  const names = new Set(extractedComponents.keys())
  const directCounts = new Map<string, number>()
  const componentGraph = new Map<string, Set<string>>()

  // Initialize
  for (const name of names) {
    directCounts.set(name, 0)
    componentGraph.set(name, new Set())
  }

  // Resolve absolute paths for extracted components to detect definition files
  const resolvedPaths = new Map<string, string>()
  for (const [name, filePath] of extractedComponents) {
    resolvedPaths.set(name, resolve(projectRoot, filePath))
  }

  for (const file of allTsxFiles) {
    let source: string
    try {
      source = readFileSync(file, 'utf-8')
    } catch {
      continue
    }

    const found = scanFileForComponents(source, names)
    if (found.size === 0) continue

    const absFile = resolve(file)

    for (const usedName of found) {
      // Skip if this is the component's own definition file
      if (resolvedPaths.get(usedName) === absFile) continue

      directCounts.set(usedName, (directCounts.get(usedName) ?? 0) + 1)
    }

    // Build component graph: if this file defines an extracted component,
    // record that it uses other extracted components
    for (const [defName, defPath] of resolvedPaths) {
      if (defPath === absFile) {
        for (const usedName of found) {
          if (usedName !== defName) {
            componentGraph.get(defName)!.add(usedName)
          }
        }
      }
    }
  }

  return { directCounts, componentGraph }
}

/**
 * Compute total usage counts with transitive propagation.
 *
 * If component A renders component B, then B's indirect count includes A's total.
 * total(B) = direct(B) + Σ total(parent) for each parent that renders B.
 *
 * We need to find, for each component C, all parents that render C,
 * then C.indirect = Σ parent.total for each such parent.
 */
export function computeUsageCounts(
  directCounts: Map<string, number>,
  componentGraph: Map<string, Set<string>>,
): Map<string, UsageCount> {
  // Build reverse graph: child → set of parents that render it
  const reverseGraph = new Map<string, Set<string>>()
  for (const name of directCounts.keys()) {
    reverseGraph.set(name, new Set())
  }
  for (const [parent, children] of componentGraph) {
    for (const child of children) {
      reverseGraph.get(child)?.add(parent)
    }
  }

  // Memoized recursive computation
  const memo = new Map<string, number>()

  function getTotal(name: string, visited: Set<string>): number {
    if (memo.has(name)) return memo.get(name)!
    if (visited.has(name)) return directCounts.get(name) ?? 0 // cycle breaker

    visited.add(name)
    const direct = directCounts.get(name) ?? 0
    let indirect = 0

    for (const parent of reverseGraph.get(name) ?? []) {
      indirect += getTotal(parent, visited)
    }

    const total = direct + indirect
    visited.delete(name)
    memo.set(name, total)
    return total
  }

  const result = new Map<string, UsageCount>()
  for (const name of directCounts.keys()) {
    const total = getTotal(name, new Set())
    const direct = directCounts.get(name) ?? 0
    result.set(name, { direct, indirect: total - direct, total })
  }

  return result
}

/**
 * High-level orchestrator: analyze usage of extracted components across the project.
 */
export function analyzeComponentUsage(
  projectRoot: string,
  components: JcComponentMeta[],
): Map<string, UsageCount> {
  const extractedComponents = new Map<string, string>()
  for (const comp of components) {
    extractedComponents.set(comp.displayName, comp.filePath)
  }

  const allTsxFiles = findProjectTsxFiles(projectRoot)
  const { directCounts, componentGraph } = buildUsageGraph(
    projectRoot,
    extractedComponents,
    allTsxFiles,
  )
  return computeUsageCounts(directCounts, componentGraph)
}
