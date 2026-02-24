/**
 * Syntax highlighting engine for JSX code preview.
 *
 * Generates an array of colored text tokens for syntax-highlighted JSX.
 * Supports light and dark color palettes.
 */

import type { JcComponentMeta, JcMeta, JcResolvedFixture } from '../types.js'
import { resolveControlType } from './faker-map.js'
import { fixtureToCodeString } from './fixtures.js'
import type { FixtureOverride } from './use-showcase-state.js'
import { toPascalCase } from './utils.js'

/** Well-known fixture plugin → npm package mappings */
const PLUGIN_PACKAGE_MAP: Record<string, string> = {
  lucide: 'lucide-react',
  'react-icons': 'react-icons',
  heroicons: '@heroicons/react/24/outline',
  phosphor: '@phosphor-icons/react',
}

/** Apply path alias mapping (same logic as extract.ts applyPathAlias) */
function applyPathAlias(filePath: string, pathAlias: Record<string, string>): string {
  for (const [alias, sourcePrefix] of Object.entries(pathAlias)) {
    if (filePath.startsWith(sourcePrefix)) {
      return alias + filePath.slice(sourcePrefix.length)
    }
  }
  return filePath
}

/**
 * Generate highlighted import statement tokens for "Full" code mode.
 * Collects all components and fixtures used, dedupes, and generates import lines.
 */
export function generateImportTokens(
  component: JcComponentMeta,
  props: Record<string, unknown>,
  childrenMode: 'text' | 'fixture',
  childrenFixtureKey: string | null,
  fixtures: JcResolvedFixture[],
  fixtureOverrides: Record<string, FixtureOverride>,
  meta: JcMeta,
  C: ColorPalette,
): CodeToken[] {
  const pathAlias = meta.pathAlias ?? { '@/': 'src/' }
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
    if (qualifiedKey.startsWith('components/')) {
      const compName = qualifiedKey.slice('components/'.length)
      const comp = meta.components.find((c) => c.displayName === compName)
      if (comp) {
        const cPath = applyPathAlias(comp.filePath, pathAlias).replace(/\.tsx$/, '')
        addImport(compName, cPath)
      }
      return
    }
    // Plugin fixtures → import from package
    const fixture = fixtures.find((f) => f.qualifiedKey === qualifiedKey)
    if (fixture) {
      const pkg = PLUGIN_PACKAGE_MAP[fixture.pluginName] ?? fixture.pluginName
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
      if (override && value.startsWith('components/')) {
        collectOverrideImports(override, value, meta, fixtures, pathAlias, addImport)
      }
    }
  }

  // Children fixture
  if (childrenMode === 'fixture' && childrenFixtureKey) {
    collectFixtureImport(childrenFixtureKey)
    const childOverride = fixtureOverrides.children
    if (childOverride && childrenFixtureKey.startsWith('components/')) {
      collectOverrideImports(
        childOverride,
        childrenFixtureKey,
        meta,
        fixtures,
        pathAlias,
        addImport,
      )
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
  fixtures: JcResolvedFixture[],
  pathAlias: Record<string, string>,
  addImport: (name: string, path: string) => void,
) {
  for (const value of Object.values(override.props)) {
    if (typeof value !== 'string') continue
    const fixture = fixtures.find((f) => f.qualifiedKey === value)
    if (fixture) {
      if (value.startsWith('components/')) {
        const compName = value.slice('components/'.length)
        const comp = meta.components.find((c) => c.displayName === compName)
        if (comp) {
          const cPath = applyPathAlias(comp.filePath, pathAlias).replace(/\.tsx$/, '')
          addImport(compName, cPath)
        }
      } else {
        const pkg = PLUGIN_PACKAGE_MAP[fixture.pluginName] ?? fixture.pluginName
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

export function generateCodeTokens(
  component: JcComponentMeta,
  props: Record<string, unknown>,
  children: string,
  childrenMode: 'text' | 'fixture',
  childrenFixtureKey: string | null,
  fixtures: JcResolvedFixture[],
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
        if (value.startsWith('components/') && override && meta) {
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

  // Children
  let childrenStr = ''
  let childrenTokens: CodeToken[] | null = null
  if (component.acceptsChildren) {
    if (childrenMode === 'fixture' && childrenFixtureKey) {
      // Component fixtures with overrides → full JSX tokens
      const childOverride = fixtureOverrides.children
      if (childrenFixtureKey.startsWith('components/') && childOverride && meta) {
        childrenTokens = componentFixtureToCodeTokens(
          childrenFixtureKey,
          childOverride,
          meta,
          fixtures,
          C,
        )
      } else {
        childrenStr = fixtureToCodeString(childrenFixtureKey, fixtures)
      }
    } else if (children) {
      childrenStr = children
    }
  }
  const hasChildren = childrenStr || childrenTokens

  // Decide layout: multiline if >1 prop or has children
  const multiline = propTokenGroups.length > 1 || (propTokenGroups.length > 0 && hasChildren)

  /** Append children tokens (either inline text or sub-component JSX) */
  const pushChildrenTokens = (indent: string) => {
    if (childrenTokens) {
      tokens.push({ text: indent, color: '' })
      tokens.push(...childrenTokens)
    } else if (childrenStr) {
      tokens.push({ text: indent, color: '' })
      if (childrenMode === 'fixture' && childrenFixtureKey) {
        tokens.push({ text: childrenStr, color: C.component })
      } else {
        tokens.push({ text: childrenStr, color: C.text })
      }
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
  fixtures: JcResolvedFixture[],
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

/**
 * Generate JSX code tokens for a component fixture with overridden props.
 * E.g. `<Button variant="outline">Click me</Button>` instead of `<Button />`
 */
export function componentFixtureToCodeTokens(
  qualifiedKey: string,
  override: FixtureOverride,
  meta: JcMeta,
  fixtures: JcResolvedFixture[],
  C: ColorPalette = C_DARK,
): CodeToken[] {
  const compName = qualifiedKey.startsWith('components/')
    ? qualifiedKey.slice('components/'.length)
    : qualifiedKey
  const comp = meta.components.find((c) => c.displayName === compName)

  // Fallback to simple <Name /> if component not found
  if (!comp) {
    return [{ text: `<${compName} />`, color: C.component }]
  }

  const tokens: CodeToken[] = []
  const propGroups: CodeToken[][] = []

  // Collect non-default prop tokens
  for (const [key, value] of Object.entries(override.props)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value) && value.length === 0) continue

    const propMeta = comp.props[key]
    const controlType = propMeta ? resolveControlType(propMeta) : null
    const group: CodeToken[] = []

    if (controlType === 'component' && typeof value === 'string') {
      if (!value) continue
      const codeStr = fixtureToCodeString(value, fixtures)
      group.push(
        { text: key, color: C.prop },
        { text: '={', color: C.punctuation },
        { text: codeStr, color: C.component },
        { text: '}', color: C.punctuation },
      )
    } else if (typeof value === 'boolean') {
      if (!value) continue
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
    } else {
      group.push(
        { text: key, color: C.prop },
        { text: '={', color: C.punctuation },
        { text: JSON.stringify(value), color: C.text },
        { text: '}', color: C.punctuation },
      )
    }

    if (group.length > 0) propGroups.push(group)
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
