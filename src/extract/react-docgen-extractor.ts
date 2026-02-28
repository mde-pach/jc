/**
 * Default extractor — uses react-docgen-typescript for prop extraction
 * with AST analysis enrichment and regex fallbacks.
 */

import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { withCompilerOptions } from 'react-docgen-typescript'
import ts from 'typescript'
import type {
  ExtractionWarning,
  JcComponentMeta,
  JcComponentPropKind,
  JcConfig,
  JcPropMeta,
} from '../types.js'
import { createAstAnalyzer, getCompilerOptions } from './ast-analyze.js'
import type { Extractor, ExtractorContext, ExtractorOutput } from './extractor.js'

// ── Parser setup ──────────────────────────────────────────────

export function createParser(projectRoot: string, config: JcConfig, compilerOptions?: ts.CompilerOptions) {
  if (!compilerOptions) {
    const pathAlias = config.pathAlias ?? { '@/': 'src/' }
    compilerOptions = getCompilerOptions(projectRoot, pathAlias)
  }

  return withCompilerOptions(compilerOptions, {
    savePropValueAsString: true,
    shouldExtractLiteralValuesFromEnum: true,
    shouldExtractValuesFromUnion: true,
    shouldIncludeExpression: true,
    propFilter: (prop) => {
      if (prop.name === 'children') return true
      if (prop.parent?.fileName.includes('@types/react')) return false
      return true
    },
  })
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

// ── Type utilities ────────────────────────────────────────────

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

/**
 * Detect if a prop type is a React component type (regex fallback).
 *
 * Only detects React-native types: ReactNode, ReactElement, JSX.Element,
 * ComponentType, FC, FunctionComponent. Library-specific types (LucideIcon, etc.)
 * are handled by the plugin system at render time, not at extraction time.
 *
 * @param componentTypeMap Optional user-defined type-to-kind mappings (checked first)
 */
export function detectComponentKind(
  _propName: string,
  rawType: string,
  _source?: string,
  componentTypeMap?: Record<string, JcComponentPropKind>,
): JcComponentPropKind | undefined {
  // Structured types (object literals, arrays of objects) are never component props
  if (rawType.startsWith('{') || rawType.startsWith('Array<{') || /^\{[^}]*\}\[\]$/.test(rawType)) {
    return undefined
  }

  // User-defined type mappings — checked before built-in patterns
  if (componentTypeMap) {
    for (const [typeName, kind] of Object.entries(componentTypeMap)) {
      if (rawType.includes(typeName)) return kind
    }
  }

  // React-native type detection only — no library-specific patterns, no prop name heuristics
  if (/ReactElement|JSX\.Element/.test(rawType)) return 'element'
  if (/ReactNode/.test(rawType)) return 'node'
  if (/ComponentType|FC\b|FunctionComponent/.test(rawType)) return 'element'

  return undefined
}

// ── Extractor factory ─────────────────────────────────────────

export function createReactDocgenExtractor(): Extractor {
  return {
    name: 'react-docgen',

    extract(ctx: ExtractorContext): ExtractorOutput {
      const { projectRoot, config, files } = ctx
      const shouldKeepProp = createPropFilter(config)
      const excludeNames = new Set(config.excludeComponents ?? [])
      const components: JcComponentMeta[] = []
      const warnings: ExtractionWarning[] = []
      let filesSkipped = 0

      // Create compiler options once — shared by parser and AST analysis
      const pathAlias = config.pathAlias ?? { '@/': 'src/' }
      const compilerOptions = getCompilerOptions(projectRoot, pathAlias)
      const parser = createParser(projectRoot, config, compilerOptions)
      const program = ts.createProgram(files, compilerOptions)
      const astAnalyzer = createAstAnalyzer(program)

      for (const file of files) {
        try {
          const source = readFileSync(file, 'utf-8')
          const parsed = parser.parseWithProgramProvider(file, () => program)

          for (const doc of parsed) {
            if (excludeNames.has(doc.displayName)) {
              warnings.push({
                type: 'COMPONENT_SKIPPED',
                component: doc.displayName,
                reason: 'excluded by config',
              })
              continue
            }

            // AST analysis for this component (may return undefined)
            const astResult = astAnalyzer.analyzeComponent(file, doc.displayName)

            const props: Record<string, JcPropMeta> = {}
            // AST children detection → regex fallback
            let acceptsChildren = astResult?.acceptsChildren ?? detectAcceptsChildren(source)

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

              const astProp = astResult?.props[propName]

              // AST values → regex fallback
              // If AST expanded the type into an object literal, it's not an enum — clear values
              const isExpandedObject =
                astProp?.simplifiedType?.startsWith('{') ||
                (astProp?.simplifiedType?.endsWith('[]') && astProp.simplifiedType.startsWith('{'))
              const values = isExpandedObject
                ? undefined
                : (astProp?.values ?? cleanValues(rawValues))
              // AST boolean → regex fallback
              const boolEnum = astProp?.isBoolean ?? isBooleanEnum(rawType, rawValues)
              // AST componentKind → regex fallback
              const componentKind =
                astProp?.componentKind ?? detectComponentKind(propName, rawType, source, config.componentTypeMap)

              // Track when falling back to regex for prop analysis
              if (!astProp && (componentKind || values)) {
                warnings.push({
                  type: 'PROP_FALLBACK',
                  component: doc.displayName,
                  prop: propName,
                  from: 'regex',
                })
              }

              props[propName] = {
                name: propName,
                type: boolEnum ? 'boolean' : (astProp?.simplifiedType ?? simplifyType(rawType)),
                rawType,
                values: boolEnum ? undefined : values?.length ? values : undefined,
                required: propInfo.required,
                defaultValue: propInfo.defaultValue?.value,
                description: propInfo.description ?? '',
                isChildren: false,
                componentKind,
                ...(astProp?.structuredFields
                  ? { structuredFields: astProp.structuredFields }
                  : {}),
              }
            }

            // Determine export type from AST analysis
            const exportType = astResult?.isDefaultExport
              ? ('default' as const)
              : ('named' as const)

            components.push({
              displayName: doc.displayName,
              filePath: file.replace(`${projectRoot}/`, ''),
              description: doc.description ?? '',
              props,
              acceptsChildren,
              ...(astResult?.childrenType ? { childrenType: astResult.childrenType } : {}),
              exportType,
              ...(astResult?.tags ? { tags: astResult.tags } : {}),
            })
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          warnings.push({ type: 'FILE_PARSE_ERROR', file: basename(file), error: errorMsg })
          console.warn(`[jc] Failed to parse ${basename(file)}: ${err}`)
          filesSkipped++
        }
      }

      return { components, warnings, filesSkipped }
    },
  }
}
