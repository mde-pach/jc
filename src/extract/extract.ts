/**
 * Core extraction logic — Node.js only, no Bun APIs.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import * as fs from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import { withCompilerOptions } from 'react-docgen-typescript'
import ts from 'typescript'
import type { JcComponentMeta, JcConfig, JcMeta, JcPropMeta } from '../types.js'

/**
 * Cross-version glob: Node 22+ has globSync in node:fs,
 * older versions get a simple recursive walk fallback.
 */
function findFiles(pattern: string, cwd: string): string[] {
  // Node 22+ globSync (accessed dynamically to avoid import errors on Bun/older Node)
  const maybeGlobSync = (fs as any).globSync
  if (typeof maybeGlobSync === 'function') {
    try {
      return maybeGlobSync(pattern, { cwd }) as string[]
    } catch {
      // fallback below
    }
  }

  // Fallback: recursive walk + basic glob matching
  const results: string[] = []
  const parts = pattern.split('**/').filter(Boolean)
  const ext = parts[parts.length - 1] // e.g. "*.tsx"

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walk(full)
      } else if (entry.isFile()) {
        const rel = relative(cwd, full)
        if (rel.startsWith(pattern.split('**')[0]) && entry.name.match(ext?.replace('*', '.*'))) {
          results.push(rel)
        }
      }
    }
  }

  walk(cwd)
  return results
}

// ── Parser setup ──────────────────────────────────────────────

function createParser(projectRoot: string, config: JcConfig) {
  return withCompilerOptions(
    {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2020,
      strict: true,
      paths: { '@/*': ['./src/*'] },
      baseUrl: projectRoot,
    },
    {
      savePropValueAsString: true,
      shouldExtractLiteralValuesFromEnum: true,
      shouldExtractValuesFromUnion: true,
      propFilter: (prop) => {
        if (prop.name === 'children') return true
        if (prop.parent?.fileName.includes('@types/react')) return false
        return true
      },
    },
  )
}

// ── Prop filtering ────────────────────────────────────────────

function createPropFilter(config: JcConfig) {
  const filteredSet = new Set(config.filteredProps ?? [])
  const patterns = (config.filteredPropPatterns ?? []).map((p) => new RegExp(p))

  return (name: string): boolean => {
    if (filteredSet.has(name)) return false
    for (const pattern of patterns) {
      if (pattern.test(name)) return false
    }
    return true
  }
}

function simplifyType(rawType: string): string {
  let t = rawType
    .replace(/\s*\|\s*null/g, '')
    .replace(/\s*\|\s*undefined/g, '')
    .trim()
  const parts = t.split('|').map((s) => s.trim())
  const unique = [...new Set(parts)]
  if (unique.length === 1) t = unique[0]
  return t
}

function extractValues(rawType: string): string[] | undefined {
  const matches = rawType.match(/"([^"]+)"/g)
  if (matches && matches.length >= 2) {
    return matches.map((m) => m.replace(/"/g, ''))
  }
  return undefined
}

/**
 * Tokens that are TypeScript type names, NOT real enum values.
 * These leak through react-docgen-typescript when a prop is a
 * union of TS types (e.g., ReactNode = string | number | ReactElement | ...).
 */
const TYPE_NAME_TOKENS = new Set([
  'string', 'number', 'bigint', 'boolean', 'symbol', 'object',
  'true', 'false', 'void', 'never', 'any', 'unknown',
])
const TYPE_NAME_PATTERN = /^(?:React|JSX|Element|Iterable|Promise|Awaited|Record|Array|Function|Set|Map|Document|Node|Boundary|Fragment)\b/

/** Returns true if value looks like a TS type name rather than a real enum value */
function isTypeName(value: string): boolean {
  if (TYPE_NAME_TOKENS.has(value)) return true
  if (TYPE_NAME_PATTERN.test(value)) return true
  // Contains generics like Foo<Bar>
  if (value.includes('<') && value.includes('>')) return true
  // Contains => (function signature)
  if (value.includes('=>')) return true
  // Contains [] (array type) or {} (object literal type)
  if (value.includes('[]') || value.includes('{ ')) return true
  // PascalCase single word that looks like a type (e.g. ReactPortal, LucideIcon, DocumentFragment)
  if (/^[A-Z][a-zA-Z]+$/.test(value) && value.length > 6) return true
  return false
}

/** Filter values to only keep real enum/literal values */
function cleanValues(values: string[] | undefined): string[] | undefined {
  if (!values) return undefined
  const clean = values.filter(
    (v) => v && v !== 'undefined' && v !== 'null' && !isTypeName(v),
  )
  return clean.length > 0 ? clean : undefined
}

// ── File discovery ────────────────────────────────────────────

function discoverFiles(projectRoot: string, config: JcConfig): string[] {
  const excludeSet = new Set(config.excludeFiles ?? [])
  const matches = findFiles(config.componentGlob, projectRoot)

  return matches
    .filter((m) => {
      const fileName = basename(m)
      if (excludeSet.has(fileName)) return false
      if (!fileName.endsWith('.tsx')) return false
      return true
    })
    .map((m) => resolve(projectRoot, m))
    .sort()
}

// ── Main extraction ───────────────────────────────────────────

export function extract(projectRoot: string, config: JcConfig): JcMeta {
  const files = discoverFiles(projectRoot, config)
  const parser = createParser(projectRoot, config)
  const shouldKeepProp = createPropFilter(config)
  const excludeNames = new Set(config.excludeComponents ?? [])
  const components: JcComponentMeta[] = []

  console.log(`[jc] Found ${files.length} component files`)

  for (const file of files) {
    try {
      const source = readFileSync(file, 'utf-8')
      const parsed = parser.parse(file)

      for (const doc of parsed) {
        if (excludeNames.has(doc.displayName)) continue

        const props: Record<string, JcPropMeta> = {}
        let acceptsChildren =
          /\{\s*[^}]*\bchildren\b/.test(source) || /props\.children/.test(source)

        for (const [propName, propInfo] of Object.entries(doc.props)) {
          if (propName === 'children') {
            acceptsChildren = true
            continue
          }
          if (!shouldKeepProp(propName)) continue

          const rawType = propInfo.type?.name ?? 'unknown'
          const rawValues =
            extractValues(rawType) ??
            (propInfo.type as any)?.value?.map((v: any) =>
              v.value?.replace(/"/g, ''),
            ) ??
            undefined
          const values = cleanValues(rawValues)
          const isBooleanEnum =
            rawType === 'enum' &&
            rawValues &&
            rawValues.filter((v: string) => v && v !== 'undefined' && v !== 'null').length <= 2 &&
            rawValues.filter((v: string) => v && v !== 'undefined' && v !== 'null')
              .every((v: string) => v === 'true' || v === 'false')

          props[propName] = {
            name: propName,
            type: isBooleanEnum ? 'boolean' : simplifyType(rawType),
            rawType,
            values: isBooleanEnum
              ? undefined
              : values?.length
                ? values
                : undefined,
            required: propInfo.required,
            defaultValue: propInfo.defaultValue?.value,
            description: propInfo.description ?? '',
            isChildren: false,
          }
        }

        components.push({
          displayName: doc.displayName,
          filePath: file.replace(projectRoot + '/', ''),
          description: doc.description ?? '',
          props,
          acceptsChildren,
        })
      }
    } catch (err) {
      console.warn(`[jc] Failed to parse ${basename(file)}: ${err}`)
    }
  }

  // Deduplicate: keep the version with more props
  const deduped = new Map<string, JcComponentMeta>()
  for (const comp of components) {
    const existing = deduped.get(comp.displayName)
    if (
      !existing ||
      Object.keys(comp.props).length > Object.keys(existing.props).length
    ) {
      deduped.set(comp.displayName, comp)
    }
  }
  const finalComponents = [...deduped.values()]

  console.log(
    `[jc] Extracted ${finalComponents.length} components (${components.length} before dedup)`,
  )

  return {
    generatedAt: new Date().toISOString(),
    componentDir: config.componentGlob,
    components: finalComponents,
  }
}

// ── Registry generation ───────────────────────────────────────

export function generateRegistry(meta: JcMeta): string {
  const seen = new Set<string>()
  const entries: Array<{ name: string; importPath: string }> = []

  for (const comp of meta.components) {
    if (seen.has(comp.displayName)) continue
    seen.add(comp.displayName)
    const importPath = comp.filePath
      .replace(/^src\//, '@/')
      .replace(/\.tsx$/, '')
    entries.push({ name: comp.displayName, importPath })
  }

  const lines: string[] = [
    '/* Auto-generated by jc extract — DO NOT EDIT */',
    '/* eslint-disable */',
    '',
    "import type { ComponentType } from 'react'",
    '',
    'export const registry: Record<string, () => Promise<ComponentType<any>>> = {',
  ]

  for (const { name, importPath } of entries) {
    lines.push(
      `  '${name}': () => import('${importPath}').then(m => (m as any).${name}),`,
    )
  }

  lines.push('}', '')
  return lines.join('\n')
}

// ── Write output ──────────────────────────────────────────────

export function writeOutput(
  projectRoot: string,
  config: JcConfig,
  meta: JcMeta,
): void {
  const outputDir = resolve(projectRoot, config.outputDir)
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  writeFileSync(
    resolve(outputDir, 'meta.json'),
    JSON.stringify(meta, null, 2),
  )
  writeFileSync(resolve(outputDir, 'registry.ts'), generateRegistry(meta))

  console.log(`[jc] Output → ${config.outputDir}/`)
  console.log(
    `[jc]   meta.json (${meta.components.length} components)`,
  )
  console.log('[jc]   registry.ts')

  for (const comp of meta.components) {
    const propCount = Object.keys(comp.props).length
    const propNames = Object.keys(comp.props).join(', ')
    console.log(
      `  ${comp.displayName} (${propCount} props${propNames ? `: ${propNames}` : ''})`,
    )
  }
}
