/**
 * Core extraction logic — Node.js only, no Bun APIs.
 */

import * as fs from 'node:fs'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import { withCompilerOptions } from 'react-docgen-typescript'
import ts from 'typescript'
import type {
  JcComponentMeta,
  JcComponentPropKind,
  JcConfig,
  JcMeta,
  JcPropMeta,
} from '../types.js'

/** Apply path alias mapping: replace source prefixes with alias prefixes */
export function applyPathAlias(filePath: string, pathAlias: Record<string, string>): string {
  for (const [alias, sourcePrefix] of Object.entries(pathAlias)) {
    if (filePath.startsWith(sourcePrefix)) {
      return alias + filePath.slice(sourcePrefix.length)
    }
  }
  return filePath
}

/**
 * Cross-version glob: Node 22+ has globSync in node:fs,
 * older versions get a simple recursive walk fallback.
 */
function findFiles(pattern: string, cwd: string): string[] {
  // Node 22+ globSync (accessed dynamically to avoid import errors on Bun/older Node)
  // biome-ignore lint/suspicious/noExplicitAny: globSync is not in @types/node < 22, runtime feature-detect only
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
  // Build TS paths from config pathAlias (default: { '@/': 'src/' })
  const pathAlias = config.pathAlias ?? { '@/': 'src/' }
  const tsPaths: Record<string, string[]> = {}
  for (const [alias, sourcePrefix] of Object.entries(pathAlias)) {
    tsPaths[`${alias}*`] = [`./${sourcePrefix}*`]
  }

  return withCompilerOptions(
    {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2020,
      strict: true,
      paths: tsPaths,
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

export function createPropFilter(config: JcConfig) {
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

export function simplifyType(rawType: string): string {
  let t = rawType
    .replace(/\s*\|\s*null/g, '')
    .replace(/\s*\|\s*undefined/g, '')
    .trim()
  const parts = t.split('|').map((s) => s.trim())
  const unique = [...new Set(parts)]
  if (unique.length === 1) t = unique[0]
  return t
}

export function extractValues(rawType: string): string[] | undefined {
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
  // JS primitives
  'string',
  'number',
  'bigint',
  'boolean',
  'symbol',
  'object',
  'true',
  'false',
  'void',
  'never',
  'any',
  'unknown',
  // React types that leak through docgen
  'ReactNode',
  'ReactElement',
  'ReactPortal',
  'ReactFragment',
  'ReactChild',
  'ReactText',
  'ReactInstance',
  'JSXElement',
  'JSXFragment',
  'Element',
  'DocumentFragment',
  'Node',
  'ComponentType',
  'ComponentClass',
  'FunctionComponent',
  'ForwardRefExoticComponent',
  'LazyExoticComponent',
  'MemoExoticComponent',
  'LucideIcon',
  'IconType',
  // Common TS utility types
  'Partial',
  'Required',
  'Readonly',
  'Record',
  'Pick',
  'Omit',
  'Exclude',
  'Extract',
  'NonNullable',
  'ReturnType',
  'InstanceType',
  'Promise',
  'Awaited',
  'Iterable',
  'Iterator',
  'AsyncIterable',
  'Array',
  'Set',
  'Map',
  'WeakSet',
  'WeakMap',
  'Function',
  'Date',
  'RegExp',
  'Error',
])

/** Returns true if value looks like a TS type name rather than a real enum value */
export function isTypeName(value: string): boolean {
  if (TYPE_NAME_TOKENS.has(value)) return true
  // Prefixed React/JSX types like React.ReactNode, JSX.Element
  if (/^(?:React|JSX)\./.test(value)) return true
  // Contains generics like Foo<Bar>
  if (value.includes('<') && value.includes('>')) return true
  // Contains => (function signature)
  if (value.includes('=>')) return true
  // Contains [] (array type) or {} (object literal type)
  if (value.includes('[]') || value.includes('{ ')) return true
  return false
}

/** Filter values to only keep real enum/literal values */
export function cleanValues(values: string[] | undefined): string[] | undefined {
  if (!values) return undefined
  const clean = values.filter((v) => v && v !== 'undefined' && v !== 'null' && !isTypeName(v))
  return clean.length > 0 ? clean : undefined
}

/** Check if a raw enum type is actually a boolean (only 'true'/'false' values) */
export function isBooleanEnum(rawType: string, rawValues: string[] | undefined): boolean {
  if (rawType !== 'enum' || !rawValues) return false
  const meaningful = rawValues.filter((v: string) => v && v !== 'undefined' && v !== 'null')
  return meaningful.length <= 2 && meaningful.every((v: string) => v === 'true' || v === 'false')
}

/** Detect if a component source accepts children via destructuring or props.children */
export function detectAcceptsChildren(source: string): boolean {
  return /\{\s*[^}]*\bchildren\b/.test(source) || /props\.children/.test(source)
}

// ── Component prop detection ─────────────────────────────────

const ICON_TYPE_PATTERNS = [/LucideIcon/, /IconType/, /Icon$/, /ComponentType/]
const ELEMENT_TYPE_PATTERNS = [/ReactElement/, /JSX\.Element/]
const NODE_TYPE_PATTERNS = [/ReactNode/]

/**
 * Also read the source to check the actual TS type annotation for icon props.
 * react-docgen-typescript often flattens LucideIcon | ReactNode → 'enum'.
 */
export function detectComponentKind(
  propName: string,
  rawType: string,
  source?: string,
): JcComponentPropKind | undefined {
  const name = propName.toLowerCase()

  // Type-based detection (explicit type names)
  for (const pattern of ICON_TYPE_PATTERNS) {
    if (pattern.test(rawType)) return 'icon'
  }
  for (const pattern of ELEMENT_TYPE_PATTERNS) {
    if (pattern.test(rawType)) return 'element'
  }
  for (const pattern of NODE_TYPE_PATTERNS) {
    if (pattern.test(rawType)) return 'node'
  }

  // Name-based heuristic: icon props
  if (name === 'icon' || name.endsWith('icon')) {
    // Check source to distinguish LucideIcon (constructor) from ReactNode (element)
    if (source) {
      // Look for `icon?: LucideIcon` or `icon: ComponentType` patterns
      const constructorPattern = new RegExp(
        `${propName}\\??\\s*:\\s*(?:LucideIcon|ComponentType|FC|Icon)\\b`,
      )
      if (constructorPattern.test(source)) return 'icon'
      // Look for `icon?: React.ReactNode` or `icon?: ReactNode`
      const nodePattern = new RegExp(`${propName}\\??\\s*:\\s*(?:React\\.)?ReactNode`)
      if (nodePattern.test(source)) return 'element'
    }
    return 'icon' // default to constructor for icon-named props
  }

  // Name-based heuristic for common ReactNode props
  const CONFIDENT_NODE_NAMES = new Set([
    'badge',
    'action',
    'actions',
    'prefix',
    'suffix',
    'breadcrumbs',
    'separator',
  ])
  if (CONFIDENT_NODE_NAMES.has(name)) {
    if (rawType === 'enum' || /Node|Element|JSX|ReactNode/.test(rawType)) {
      return 'node'
    }
  }
  // Less confident names — only match if type explicitly mentions Node/Element
  const LESS_CONFIDENT_NODE_NAMES = new Set(['header', 'footer', 'trigger', 'label'])
  if (LESS_CONFIDENT_NODE_NAMES.has(name)) {
    if (/Node|Element|JSX|ReactNode/.test(rawType)) {
      return 'node'
    }
  }

  return undefined
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
        let acceptsChildren = detectAcceptsChildren(source)

        for (const [propName, propInfo] of Object.entries(doc.props)) {
          if (propName === 'children') {
            acceptsChildren = true
            continue
          }
          if (!shouldKeepProp(propName)) continue

          const rawType = propInfo.type?.name ?? 'unknown'
          const rawValues =
            extractValues(rawType) ??
            // biome-ignore lint/suspicious/noExplicitAny: react-docgen-typescript exposes untyped .value array on union types
            (propInfo.type as any)?.value?.map((v: any) => v.value?.replace(/"/g, '')) ??
            undefined
          const values = cleanValues(rawValues)
          const boolEnum = isBooleanEnum(rawType, rawValues)

          const componentKind = detectComponentKind(propName, rawType, source)

          props[propName] = {
            name: propName,
            type: boolEnum ? 'boolean' : simplifyType(rawType),
            rawType,
            values: boolEnum ? undefined : values?.length ? values : undefined,
            required: propInfo.required,
            defaultValue: propInfo.defaultValue?.value,
            description: propInfo.description ?? '',
            isChildren: false,
            componentKind,
          }
        }

        components.push({
          displayName: doc.displayName,
          filePath: file.replace(`${projectRoot}/`, ''),
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
    if (!existing || Object.keys(comp.props).length > Object.keys(existing.props).length) {
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

export function generateRegistry(meta: JcMeta, config: JcConfig): string {
  const pathAlias = config.pathAlias ?? { '@/': 'src/' }
  const seen = new Set<string>()
  const entries: Array<{ name: string; importPath: string }> = []

  for (const comp of meta.components) {
    if (seen.has(comp.displayName)) continue
    seen.add(comp.displayName)
    const importPath = applyPathAlias(comp.filePath, pathAlias).replace(/\.tsx$/, '')
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
    lines.push(`  '${name}': () => import('${importPath}').then(m => (m as any).${name}),`)
  }

  lines.push('}', '')
  return lines.join('\n')
}

// ── Write output ──────────────────────────────────────────────

export function writeOutput(projectRoot: string, config: JcConfig, meta: JcMeta): void {
  const outputDir = resolve(projectRoot, config.outputDir)
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  writeFileSync(resolve(outputDir, 'meta.json'), JSON.stringify(meta, null, 2))
  writeFileSync(resolve(outputDir, 'registry.ts'), generateRegistry(meta, config))

  console.log(`[jc] Output → ${config.outputDir}/`)
  console.log(`[jc]   meta.json (${meta.components.length} components)`)
  console.log('[jc]   registry.ts')

  for (const comp of meta.components) {
    const propCount = Object.keys(comp.props).length
    const propNames = Object.keys(comp.props).join(', ')
    console.log(`  ${comp.displayName} (${propCount} props${propNames ? `: ${propNames}` : ''})`)
  }
}
