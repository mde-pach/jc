/**
 * Syntax highlighting engine for JSX code preview.
 *
 * Generates an array of colored text tokens for syntax-highlighted JSX.
 * Supports light and dark color palettes.
 */

import type { ChildItem, JcComponentMeta, JcMeta, JcResolvedPluginItem } from '../types.js'
import { resolveControlType } from './faker-map.js'
import { fixtureToCodeString } from './fixtures.js'
import type { FixtureOverride } from './use-showcase-state.js'
import { applyPathAlias, COMPONENT_FIXTURE_PREFIX, toPascalCase } from './utils.js'

/**
 * Well-known plugin → npm package mappings (fallback).
 * Prefer using `importPath` on JcPlugin instead.
 */
const PLUGIN_PACKAGE_MAP: Record<string, string> = {
  lucide: 'lucide-react',
  'react-icons': 'react-icons',
  heroicons: '@heroicons/react/24/outline',
  phosphor: '@phosphor-icons/react',
}

/**
 * Resolve the import path for a fixture plugin.
 * Checks plugin's own importPath first, then legacy PLUGIN_PACKAGE_MAP, then uses plugin name.
 */
function resolvePluginImportPath(
  pluginName: string,
  pluginImportPaths: Map<string, string>,
): string {
  return pluginImportPaths.get(pluginName) ?? PLUGIN_PACKAGE_MAP[pluginName] ?? pluginName
}

/**
 * Build a Map of plugin name → import path from resolved fixtures.
 * Prefers the `importPath` field from the original plugin definition.
 */
export function buildPluginImportMap(fixtures: JcResolvedPluginItem[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const f of fixtures) {
    if (!map.has(f.pluginName)) {
      // The importPath is stored at the plugin level but carried through to resolved fixtures
      // via the pluginName — we check PLUGIN_PACKAGE_MAP as fallback
      map.set(f.pluginName, PLUGIN_PACKAGE_MAP[f.pluginName] ?? f.pluginName)
    }
  }
  return map
}

/**
 * Generate highlighted import statement tokens for "Full" code mode.
 * Collects all components and fixtures used, dedupes, and generates import lines.
 */
export function generateImportTokens(
  component: JcComponentMeta,
  props: Record<string, unknown>,
  childrenItems: ChildItem[],
  fixtures: JcResolvedPluginItem[],
  fixtureOverrides: Record<string, FixtureOverride>,
  meta: JcMeta,
  C: ColorPalette,
): CodeToken[] {
  const pathAlias = meta.pathAlias ?? { '@/': 'src/' }
  const fixturePluginImportPaths = buildPluginImportMap(fixtures)
  const tokens: CodeToken[] = []

  // Collect imports: Map<importPath, Set<namedExport>>
  const imports = new Map<string, Set<string>>()

  const addImport = (name: string, path: string) => {
    let names = imports.get(path)
    if (!names) {
      names = new Set()
      imports.set(path, names)
    }
    names.add(name)
  }

  // 1. Main component
  const mainPath = applyPathAlias(component.filePath, pathAlias).replace(/\.tsx$/, '')
  addImport(component.displayName, mainPath)

  // 2. Wrapper components
  if (component.wrapperComponents) {
    for (const w of component.wrapperComponents) {
      const wComp = meta.components.find((c) => c.displayName === w.displayName)
      if (wComp) {
        const wPath = applyPathAlias(wComp.filePath, pathAlias).replace(/\.tsx$/, '')
        addImport(w.displayName, wPath)
      }
    }
  }

  // 3. Collect fixture references from props and children
  const collectFixtureImport = (qualifiedKey: string) => {
    // Component fixtures → import from their file path
    if (qualifiedKey.startsWith(COMPONENT_FIXTURE_PREFIX)) {
      const compName = qualifiedKey.slice(COMPONENT_FIXTURE_PREFIX.length)
      const comp = meta.components.find((c) => c.displayName === compName)
      if (comp) {
        const cPath = applyPathAlias(comp.filePath, pathAlias).replace(/\.tsx$/, '')
        addImport(compName, cPath)
      }
      return
    }
    // Plugin fixtures → import from package (prefer importPath, fall back to legacy map)
    const fixture = fixtures.find((f) => f.qualifiedKey === qualifiedKey)
    if (fixture) {
      const pkg = resolvePluginImportPath(fixture.pluginName, fixturePluginImportPaths)
      addImport(toPascalCase(fixture.label), pkg)
    }
  }

  for (const [key, value] of Object.entries(props)) {
    if (typeof value !== 'string') continue
    const propMeta = component.props[key]
    if (!propMeta) continue
    const controlType = resolveControlType(propMeta)
    if (controlType === 'component' && value) {
      collectFixtureImport(value)
      // Check for sub-component fixture overrides
      const slotKey = `prop:${key}`
      const override = fixtureOverrides[slotKey]
      if (override && value.startsWith(COMPONENT_FIXTURE_PREFIX)) {
        collectOverrideImports(
          override,
          value,
          meta,
          fixtures,
          pathAlias,
          addImport,
          fixturePluginImportPaths,
        )
      }
    }
  }

  // Children fixture imports
  for (let i = 0; i < childrenItems.length; i++) {
    const item = childrenItems[i]
    if (item.type === 'fixture' && item.value) {
      collectFixtureImport(item.value)
      const childOverride = fixtureOverrides[`children:${i}`]
      if (childOverride && item.value.startsWith(COMPONENT_FIXTURE_PREFIX)) {
        collectOverrideImports(
          childOverride,
          item.value,
          meta,
          fixtures,
          pathAlias,
          addImport,
          fixturePluginImportPaths,
        )
      }
    }
  }

  // Generate token lines
  for (const [path, names] of imports) {
    const sortedNames = [...names].sort()
    tokens.push(
      { text: 'import', color: C.prop },
      { text: ' { ', color: C.punctuation },
      { text: sortedNames.join(', '), color: C.tag },
      { text: ' } ', color: C.punctuation },
      { text: 'from', color: C.prop },
      { text: ' ', color: '' },
      { text: `'${path}'`, color: C.string },
      { text: '\n', color: '' },
    )
  }

  return tokens
}

/** Collect fixture imports from a fixture override's prop values */
function collectOverrideImports(
  override: FixtureOverride,
  _qualifiedKey: string,
  meta: JcMeta,
  fixtures: JcResolvedPluginItem[],
  pathAlias: Record<string, string>,
  addImport: (name: string, path: string) => void,
  pluginImportPaths: Map<string, string>,
) {
  for (const value of Object.values(override.props)) {
    if (typeof value !== 'string') continue
    const fixture = fixtures.find((f) => f.qualifiedKey === value)
    if (fixture) {
      if (value.startsWith(COMPONENT_FIXTURE_PREFIX)) {
        const compName = value.slice(COMPONENT_FIXTURE_PREFIX.length)
        const comp = meta.components.find((c) => c.displayName === compName)
        if (comp) {
          const cPath = applyPathAlias(comp.filePath, pathAlias).replace(/\.tsx$/, '')
          addImport(compName, cPath)
        }
      } else {
        const pkg = resolvePluginImportPath(fixture.pluginName, pluginImportPaths)
        addImport(toPascalCase(fixture.label), pkg)
      }
    }
  }
}

export interface CodeToken {
  text: string
  color: string
}

export const C_DARK = {
  tag: '#7dd3fc',
  prop: '#c4b5fd',
  string: '#fde68a',
  number: '#86efac',
  boolean: '#fdba74',
  bracket: '#94a3b8',
  text: '#e2e8f0',
  component: '#34d399',
  punctuation: '#64748b',
} as const

export const C_LIGHT = {
  tag: '#0369a1',
  prop: '#7c3aed',
  string: '#b45309',
  number: '#15803d',
  boolean: '#c2410c',
  bracket: '#64748b',
  text: '#334155',
  component: '#059669',
  punctuation: '#94a3b8',
} as const

export type ColorPalette = Record<keyof typeof C_DARK, string>

/**
 * Convert a single prop key+value to highlighted code tokens.
 * Shared by both generateCodeTokens and componentFixtureToCodeTokens to avoid duplication.
 */
function propValueToTokens(
  key: string,
  value: unknown,
  controlType: JcControlType | null,
  fixtures: JcResolvedPluginItem[],
  C: ColorPalette,
): CodeToken[] | null {
  if (value === undefined || value === null || value === '') return null
  if (Array.isArray(value) && value.length === 0) return null

  const group: CodeToken[] = []

  if (controlType === 'component' && typeof value === 'string') {
    if (!value) return null
    const codeStr = fixtureToCodeString(value, fixtures)
    // Simple component fixture — no inline overrides
    group.push(
      { text: key, color: C.prop },
      { text: '={', color: C.punctuation },
      { text: codeStr, color: C.component },
      { text: '}', color: C.punctuation },
    )
  } else if (typeof value === 'boolean') {
    if (!value) return null // skip false booleans
    group.push({ text: key, color: C.prop })
  } else if (typeof value === 'string') {
    group.push(
      { text: key, color: C.prop },
      { text: '=', color: C.punctuation },
      { text: `"${value}"`, color: C.string },
    )
  } else if (typeof value === 'number') {
    group.push(
      { text: key, color: C.prop },
      { text: '={', color: C.punctuation },
      { text: String(value), color: C.number },
      { text: '}', color: C.punctuation },
    )
  } else if (Array.isArray(value)) {
    group.push({ text: key, color: C.prop }, { text: '={', color: C.punctuation })
    group.push(...formatArrayTokens(value, fixtures, C))
    group.push({ text: '}', color: C.punctuation })
  } else if (typeof value === 'object' && value !== null) {
    group.push({ text: key, color: C.prop }, { text: '={', color: C.punctuation })
    group.push(...formatObjectTokens(value as Record<string, unknown>, fixtures, C))
    group.push({ text: '}', color: C.punctuation })
  } else {
    group.push(
      { text: key, color: C.prop },
      { text: '={', color: C.punctuation },
      { text: JSON.stringify(value), color: C.text },
      { text: '}', color: C.punctuation },
    )
  }

  return group.length > 0 ? group : null
}

type JcControlType = ReturnType<typeof resolveControlType>

export function generateCodeTokens(
  component: JcComponentMeta,
  props: Record<string, unknown>,
  childrenItems: ChildItem[],
  fixtures: JcResolvedPluginItem[],
  C: ColorPalette = C_DARK,
  fixtureOverrides: Record<string, FixtureOverride> = {},
  meta?: JcMeta,
  wrapperPropsMap?: Record<string, Record<string, unknown>>,
): CodeToken[] {
  const name = component.displayName
  const tokens: CodeToken[] = []

  // Collect prop tokens
  const propTokenGroups: CodeToken[][] = []

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === '') continue
    // Skip empty arrays
    if (Array.isArray(value) && value.length === 0) continue

    const propMeta = component.props[key]
    const controlType = propMeta ? resolveControlType(propMeta) : null

    const group: CodeToken[] = []

    // Component props: show fixture as JSX or plain text as string
    if (controlType === 'component' && typeof value === 'string') {
      if (!value) continue
      const fixture = fixtures.find((f) => f.qualifiedKey === value)
      if (fixture) {
        // Component fixtures with overrides → full JSX
        const slotKey = `prop:${key}`
        const override = fixtureOverrides[slotKey]
        if (value.startsWith(COMPONENT_FIXTURE_PREFIX) && override && meta) {
          const subTokens = componentFixtureToCodeTokens(value, override, meta, fixtures, C)
          group.push(
            { text: key, color: C.prop },
            { text: '={', color: C.punctuation },
            ...subTokens,
            { text: '}', color: C.punctuation },
          )
        } else {
          const codeStr = fixtureToCodeString(value, fixtures)
          group.push(
            { text: key, color: C.prop },
            { text: '={', color: C.punctuation },
            { text: codeStr, color: C.component },
            { text: '}', color: C.punctuation },
          )
        }
      } else {
        // Text mode — render as a regular string prop
        group.push(
          { text: key, color: C.prop },
          { text: '=', color: C.punctuation },
          { text: `"${value}"`, color: C.string },
        )
      }
      propTokenGroups.push(group)
      continue
    }

    if (typeof value === 'boolean') {
      if (!value) continue // skip false booleans
      group.push({ text: key, color: C.prop })
    } else if (typeof value === 'string') {
      group.push(
        { text: key, color: C.prop },
        { text: '=', color: C.punctuation },
        { text: `"${value}"`, color: C.string },
      )
    } else if (typeof value === 'number') {
      group.push(
        { text: key, color: C.prop },
        { text: '={', color: C.punctuation },
        { text: String(value), color: C.number },
        { text: '}', color: C.punctuation },
      )
    } else if (Array.isArray(value)) {
      // Arrays: format as {["a", "b"]} or {[1, 2]}
      group.push({ text: key, color: C.prop }, { text: '={', color: C.punctuation })
      group.push(...formatArrayTokens(value, fixtures, C))
      group.push({ text: '}', color: C.punctuation })
    } else if (typeof value === 'object' && value !== null) {
      group.push({ text: key, color: C.prop }, { text: '={', color: C.punctuation })
      group.push(...formatObjectTokens(value as Record<string, unknown>, fixtures, C))
      group.push({ text: '}', color: C.punctuation })
    } else {
      group.push(
        { text: key, color: C.prop },
        { text: '={', color: C.punctuation },
        { text: JSON.stringify(value), color: C.text },
        { text: '}', color: C.punctuation },
      )
    }

    propTokenGroups.push(group)
  }

  // Children — build token groups for each child item
  const childTokenGroups: CodeToken[][] = []
  if (component.acceptsChildren) {
    for (let i = 0; i < childrenItems.length; i++) {
      const item = childrenItems[i]
      if (item.type === 'fixture' && item.value) {
        const childOverride = fixtureOverrides[`children:${i}`]
        if (item.value.startsWith(COMPONENT_FIXTURE_PREFIX) && childOverride && meta) {
          childTokenGroups.push(
            componentFixtureToCodeTokens(item.value, childOverride, meta, fixtures, C),
          )
        } else {
          const codeStr = fixtureToCodeString(item.value, fixtures)
          childTokenGroups.push([{ text: codeStr, color: C.component }])
        }
      } else if (item.value) {
        childTokenGroups.push([{ text: item.value, color: C.text }])
      }
    }
  }
  const hasChildren = childTokenGroups.length > 0

  // Decide layout: multiline if >1 prop or has children
  const multiline = propTokenGroups.length > 1 || (propTokenGroups.length > 0 && hasChildren)

  /** Append children tokens */
  const pushChildrenTokens = (indent: string) => {
    for (const group of childTokenGroups) {
      tokens.push({ text: indent, color: '' })
      tokens.push(...group)
    }
  }

  // Opening tag
  tokens.push({ text: '<', color: C.bracket }, { text: name, color: C.tag })

  if (multiline) {
    for (const group of propTokenGroups) {
      tokens.push({ text: '\n  ', color: '' })
      tokens.push(...group)
    }
    if (hasChildren) {
      tokens.push({ text: '\n', color: '' }, { text: '>', color: C.bracket })
      pushChildrenTokens('\n  ')
      tokens.push(
        { text: '\n', color: '' },
        { text: '</', color: C.bracket },
        { text: name, color: C.tag },
        { text: '>', color: C.bracket },
      )
    } else {
      tokens.push({ text: '\n', color: '' }, { text: '/>', color: C.bracket })
    }
  } else {
    // Single line
    for (const group of propTokenGroups) {
      tokens.push({ text: ' ', color: '' })
      tokens.push(...group)
    }
    if (hasChildren) {
      tokens.push({ text: '>', color: C.bracket })
      pushChildrenTokens('')
      tokens.push(
        { text: '</', color: C.bracket },
        { text: name, color: C.tag },
        { text: '>', color: C.bracket },
      )
    } else {
      tokens.push({ text: ' ', color: '' }, { text: '/>', color: C.bracket })
    }
  }

  // Wrap with per-component wrappers if detected (outermost first)
  if (component.wrapperComponents && component.wrapperComponents.length > 0) {
    let innerTokens = tokens

    // Apply wrappers from innermost to outermost
    for (let i = component.wrapperComponents.length - 1; i >= 0; i--) {
      const w = component.wrapperComponents[i]
      const liveProps = wrapperPropsMap?.[w.displayName] ?? w.defaultProps
      const wrapperTokens: CodeToken[] = []

      // Opening wrapper tag
      wrapperTokens.push({ text: '<', color: C.bracket }, { text: w.displayName, color: C.tag })
      for (const [key, value] of Object.entries(liveProps)) {
        if (value === undefined || value === null || value === '') continue
        if (typeof value === 'boolean') {
          if (!value) continue
          wrapperTokens.push({ text: ' ', color: '' }, { text: key, color: C.prop })
        } else if (typeof value === 'number') {
          wrapperTokens.push(
            { text: ' ', color: '' },
            { text: key, color: C.prop },
            { text: '={', color: C.punctuation },
            { text: String(value), color: C.number },
            { text: '}', color: C.punctuation },
          )
        } else if (value === true || value === 'true') {
          wrapperTokens.push({ text: ' ', color: '' }, { text: key, color: C.prop })
        } else {
          wrapperTokens.push(
            { text: ' ', color: '' },
            { text: key, color: C.prop },
            { text: '=', color: C.punctuation },
            { text: `"${value}"`, color: C.string },
          )
        }
      }
      wrapperTokens.push({ text: '>', color: C.bracket })

      // Indent inner tokens by 2 spaces
      wrapperTokens.push({ text: '\n  ', color: '' })
      for (const token of innerTokens) {
        wrapperTokens.push({
          text: token.text.replace(/\n/g, '\n  '),
          color: token.color,
        })
      }

      // Closing wrapper tag
      wrapperTokens.push(
        { text: '\n', color: '' },
        { text: '</', color: C.bracket },
        { text: w.displayName, color: C.tag },
        { text: '>', color: C.bracket },
      )

      innerTokens = wrapperTokens
    }

    return innerTokens
  }

  return tokens
}

/** Format array values as highlighted tokens */
export function formatArrayTokens(
  arr: unknown[],
  fixtures: JcResolvedPluginItem[],
  C: ColorPalette = C_DARK,
): CodeToken[] {
  const tokens: CodeToken[] = []
  tokens.push({ text: '[', color: C.punctuation })

  for (let i = 0; i < arr.length; i++) {
    if (i > 0) tokens.push({ text: ', ', color: C.punctuation })

    const item = arr[i]
    if (typeof item === 'string') {
      // Check if it's a fixture qualified key
      const fixture = fixtures.find((f) => f.qualifiedKey === item)
      if (fixture) {
        tokens.push({ text: toPascalCase(fixture.label), color: C.component })
      } else {
        tokens.push({ text: `"${item}"`, color: C.string })
      }
    } else if (typeof item === 'number') {
      tokens.push({ text: String(item), color: C.number })
    } else if (typeof item === 'boolean') {
      tokens.push({ text: String(item), color: C.boolean })
    } else if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      // Object items — render as { key: "value", icon: <Icon /> }
      const obj = item as Record<string, unknown>
      const entries = Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
      tokens.push({ text: '{ ', color: C.punctuation })
      for (let j = 0; j < entries.length; j++) {
        if (j > 0) tokens.push({ text: ', ', color: C.punctuation })
        const [k, v] = entries[j]
        tokens.push({ text: k, color: C.prop }, { text: ': ', color: C.punctuation })
        if (typeof v === 'string') {
          // Check if it's a fixture qualified key
          const fixture = fixtures.find((f) => f.qualifiedKey === v)
          if (fixture) {
            tokens.push({ text: toPascalCase(fixture.label), color: C.component })
          } else {
            tokens.push({ text: `"${v}"`, color: C.string })
          }
        } else if (typeof v === 'number') {
          tokens.push({ text: String(v), color: C.number })
        } else if (typeof v === 'boolean') {
          tokens.push({ text: String(v), color: C.boolean })
        } else {
          tokens.push({ text: JSON.stringify(v), color: C.text })
        }
      }
      tokens.push({ text: ' }', color: C.punctuation })
    } else {
      tokens.push({ text: JSON.stringify(item), color: C.text })
    }
  }

  tokens.push({ text: ']', color: C.punctuation })
  return tokens
}

/** Format a plain object value as highlighted tokens: { key: "value", ... } */
export function formatObjectTokens(
  obj: Record<string, unknown>,
  fixtures: JcResolvedPluginItem[],
  C: ColorPalette = C_DARK,
): CodeToken[] {
  const tokens: CodeToken[] = []
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  tokens.push({ text: '{ ', color: C.punctuation })
  for (let i = 0; i < entries.length; i++) {
    if (i > 0) tokens.push({ text: ', ', color: C.punctuation })
    const [k, v] = entries[i]
    tokens.push({ text: k, color: C.prop }, { text: ': ', color: C.punctuation })
    if (typeof v === 'string') {
      const fixture = fixtures.find((f) => f.qualifiedKey === v)
      if (fixture) {
        tokens.push({ text: toPascalCase(fixture.label), color: C.component })
      } else {
        tokens.push({ text: `"${v}"`, color: C.string })
      }
    } else if (typeof v === 'number') {
      tokens.push({ text: String(v), color: C.number })
    } else if (typeof v === 'boolean') {
      tokens.push({ text: String(v), color: C.boolean })
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      tokens.push(...formatObjectTokens(v as Record<string, unknown>, fixtures, C))
    } else if (Array.isArray(v)) {
      tokens.push(...formatArrayTokens(v, fixtures, C))
    } else {
      tokens.push({ text: JSON.stringify(v), color: C.text })
    }
  }
  tokens.push({ text: ' }', color: C.punctuation })
  return tokens
}

/**
 * Generate JSX code tokens for a component fixture with overridden props.
 * E.g. `<Button variant="outline">Click me</Button>` instead of `<Button />`
 */
export function componentFixtureToCodeTokens(
  qualifiedKey: string,
  override: FixtureOverride,
  meta: JcMeta,
  fixtures: JcResolvedPluginItem[],
  C: ColorPalette = C_DARK,
): CodeToken[] {
  const compName = qualifiedKey.startsWith(COMPONENT_FIXTURE_PREFIX)
    ? qualifiedKey.slice(COMPONENT_FIXTURE_PREFIX.length)
    : qualifiedKey
  const comp = meta.components.find((c) => c.displayName === compName)

  // Fallback to simple <Name /> if component not found
  if (!comp) {
    return [{ text: `<${compName} />`, color: C.component }]
  }

  const tokens: CodeToken[] = []
  const propGroups: CodeToken[][] = []

  // Collect non-default prop tokens using shared helper
  for (const [key, value] of Object.entries(override.props)) {
    const propMeta = comp.props[key]
    const controlType = propMeta ? resolveControlType(propMeta) : null
    const group = propValueToTokens(key, value, controlType, fixtures, C)
    if (group) propGroups.push(group)
  }

  const childText = comp.acceptsChildren ? override.childrenText : ''

  // Build the JSX
  tokens.push({ text: '<', color: C.bracket }, { text: compName, color: C.component })

  for (const group of propGroups) {
    tokens.push({ text: ' ', color: '' })
    tokens.push(...group)
  }

  if (childText) {
    tokens.push(
      { text: '>', color: C.bracket },
      { text: childText, color: C.text },
      { text: '</', color: C.bracket },
      { text: compName, color: C.component },
      { text: '>', color: C.bracket },
    )
  } else {
    tokens.push({ text: ' />', color: C.bracket })
  }

  return tokens
}
