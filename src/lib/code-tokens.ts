/**
 * Syntax highlighting engine for JSX code preview.
 *
 * Generates an array of colored text tokens for syntax-highlighted JSX.
 * Supports light and dark color palettes.
 */

import type { JcComponentMeta, JcResolvedFixture } from '../types.js'
import { resolveControlType } from './faker-map.js'
import { fixtureToCodeString } from './fixtures.js'
import { toPascalCase } from './utils.js'

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

    // Component props: show fixture as JSX
    if (controlType === 'component' && typeof value === 'string') {
      if (!value) continue
      const codeStr = fixtureToCodeString(value, fixtures)
      group.push(
        { text: key, color: C.prop },
        { text: '={', color: C.punctuation },
        { text: codeStr, color: C.component },
        { text: '}', color: C.punctuation },
      )
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
  if (component.acceptsChildren) {
    if (childrenMode === 'fixture' && childrenFixtureKey) {
      childrenStr = fixtureToCodeString(childrenFixtureKey, fixtures)
    } else if (children) {
      childrenStr = children
    }
  }

  // Decide layout: multiline if >1 prop or has children
  const multiline = propTokenGroups.length > 1 || (propTokenGroups.length > 0 && childrenStr)

  // Opening tag
  tokens.push({ text: '<', color: C.bracket }, { text: name, color: C.tag })

  if (multiline) {
    for (const group of propTokenGroups) {
      tokens.push({ text: '\n  ', color: '' })
      tokens.push(...group)
    }
    if (childrenStr) {
      tokens.push(
        { text: '\n', color: '' },
        { text: '>', color: C.bracket },
        { text: '\n  ', color: '' },
      )
      // Children content — fixture references are component-colored
      if (childrenMode === 'fixture' && childrenFixtureKey) {
        tokens.push({ text: childrenStr, color: C.component })
      } else {
        tokens.push({ text: childrenStr, color: C.text })
      }
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
    if (childrenStr) {
      tokens.push({ text: '>', color: C.bracket })
      if (childrenMode === 'fixture' && childrenFixtureKey) {
        tokens.push({ text: childrenStr, color: C.component })
      } else {
        tokens.push({ text: childrenStr, color: C.text })
      }
      tokens.push(
        { text: '</', color: C.bracket },
        { text: name, color: C.tag },
        { text: '>', color: C.bracket },
      )
    } else {
      tokens.push({ text: ' ', color: '' }, { text: '/>', color: C.bracket })
    }
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
    } else {
      tokens.push({ text: JSON.stringify(item), color: C.text })
    }
  }

  tokens.push({ text: ']', color: C.punctuation })
  return tokens
}
