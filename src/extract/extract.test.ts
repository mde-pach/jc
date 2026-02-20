import { describe, expect, it } from 'vitest'
import {
  applyPathAlias,
  cleanValues,
  detectComponentKind,
  extractValues,
  isTypeName,
  simplifyType,
} from './extract.js'

// ── simplifyType ──────────────────────────────────────────────

describe('simplifyType', () => {
  it('strips null', () => {
    expect(simplifyType('string | null')).toBe('string')
  })

  it('strips undefined', () => {
    expect(simplifyType('string | undefined')).toBe('string')
  })

  it('strips both null and undefined', () => {
    expect(simplifyType('string | null | undefined')).toBe('string')
  })

  it('deduplicates repeated types', () => {
    expect(simplifyType('string | string')).toBe('string')
  })

  it('preserves union of different types', () => {
    expect(simplifyType('"sm" | "md" | "lg"')).toBe('"sm" | "md" | "lg"')
  })

  it('handles empty string', () => {
    expect(simplifyType('')).toBe('')
  })
})

// ── extractValues ─────────────────────────────────────────────

describe('extractValues', () => {
  it('extracts quoted string literals', () => {
    expect(extractValues('"sm" | "md" | "lg"')).toEqual(['sm', 'md', 'lg'])
  })

  it('returns undefined for single value', () => {
    expect(extractValues('"sm"')).toBeUndefined()
  })

  it('returns undefined for no quoted values', () => {
    expect(extractValues('string')).toBeUndefined()
  })

  it('extracts from mixed type with quoted values', () => {
    expect(extractValues('"primary" | "secondary" | ReactNode')).toEqual([
      'primary',
      'secondary',
    ])
  })
})

// ── isTypeName ────────────────────────────────────────────────

describe('isTypeName', () => {
  it('identifies JS primitives', () => {
    expect(isTypeName('string')).toBe(true)
    expect(isTypeName('number')).toBe(true)
    expect(isTypeName('boolean')).toBe(true)
    expect(isTypeName('object')).toBe(true)
    expect(isTypeName('void')).toBe(true)
    expect(isTypeName('never')).toBe(true)
    expect(isTypeName('any')).toBe(true)
    expect(isTypeName('unknown')).toBe(true)
  })

  it('identifies React types', () => {
    expect(isTypeName('ReactNode')).toBe(true)
    expect(isTypeName('ReactElement')).toBe(true)
    expect(isTypeName('ReactPortal')).toBe(true)
    expect(isTypeName('ComponentType')).toBe(true)
    expect(isTypeName('LucideIcon')).toBe(true)
    expect(isTypeName('Element')).toBe(true)
  })

  it('identifies prefixed React/JSX types', () => {
    expect(isTypeName('React.ReactNode')).toBe(true)
    expect(isTypeName('JSX.Element')).toBe(true)
  })

  it('identifies generic types', () => {
    expect(isTypeName('Promise<void>')).toBe(true)
    expect(isTypeName('Record<string, any>')).toBe(true)
    expect(isTypeName('Array<number>')).toBe(true)
  })

  it('identifies function signatures', () => {
    expect(isTypeName('() => void')).toBe(true)
    expect(isTypeName('(value: string) => void')).toBe(true)
  })

  it('identifies array types', () => {
    expect(isTypeName('string[]')).toBe(true)
  })

  it('identifies object literal types', () => {
    expect(isTypeName('{ name: string }')).toBe(true)
  })

  it('does NOT filter real enum values — including PascalCase ones', () => {
    expect(isTypeName('Primary')).toBe(false)
    expect(isTypeName('Secondary')).toBe(false)
    expect(isTypeName('Success')).toBe(false)
    expect(isTypeName('Danger')).toBe(false)
    expect(isTypeName('Destructive')).toBe(false)
    expect(isTypeName('Warning')).toBe(false)
    expect(isTypeName('Default')).toBe(false)
    expect(isTypeName('Outline')).toBe(false)
  })

  it('does NOT filter lowercase enum values', () => {
    expect(isTypeName('sm')).toBe(false)
    expect(isTypeName('md')).toBe(false)
    expect(isTypeName('lg')).toBe(false)
    expect(isTypeName('default')).toBe(false)
    expect(isTypeName('primary')).toBe(false)
  })
})

// ── cleanValues ───────────────────────────────────────────────

describe('cleanValues', () => {
  it('returns undefined for undefined input', () => {
    expect(cleanValues(undefined)).toBeUndefined()
  })

  it('filters out null and undefined strings', () => {
    expect(cleanValues(['sm', 'undefined', 'null', 'lg'])).toEqual(['sm', 'lg'])
  })

  it('filters out TS type names', () => {
    expect(cleanValues(['primary', 'ReactNode', 'secondary'])).toEqual([
      'primary',
      'secondary',
    ])
  })

  it('preserves real enum values including PascalCase', () => {
    expect(cleanValues(['Primary', 'Secondary', 'Destructive'])).toEqual([
      'Primary',
      'Secondary',
      'Destructive',
    ])
  })

  it('returns undefined when all values are filtered', () => {
    expect(cleanValues(['undefined', 'null'])).toBeUndefined()
  })

  it('returns undefined for empty array', () => {
    expect(cleanValues([])).toBeUndefined()
  })
})

// ── detectComponentKind ───────────────────────────────────────

describe('detectComponentKind', () => {
  it('detects LucideIcon from rawType', () => {
    expect(detectComponentKind('icon', 'LucideIcon')).toBe('icon')
  })

  it('detects IconType from rawType', () => {
    expect(detectComponentKind('myProp', 'IconType')).toBe('icon')
  })

  it('detects ComponentType from rawType', () => {
    expect(detectComponentKind('renderer', 'ComponentType')).toBe('icon')
  })

  it('detects ReactElement from rawType', () => {
    expect(detectComponentKind('content', 'ReactElement')).toBe('element')
  })

  it('detects JSX.Element from rawType', () => {
    expect(detectComponentKind('content', 'JSX.Element')).toBe('element')
  })

  it('detects ReactNode from rawType', () => {
    expect(detectComponentKind('content', 'ReactNode')).toBe('node')
  })

  it('detects icon-named props via source', () => {
    expect(detectComponentKind('icon', 'enum', 'icon?: LucideIcon')).toBe('icon')
    expect(detectComponentKind('icon', 'enum', 'icon?: React.ReactNode')).toBe('element')
  })

  it('defaults icon-named props to icon kind', () => {
    expect(detectComponentKind('icon', 'enum')).toBe('icon')
    expect(detectComponentKind('leftIcon', 'enum')).toBe('icon')
  })

  it('detects confident node names', () => {
    expect(detectComponentKind('badge', 'ReactNode')).toBe('node')
    expect(detectComponentKind('action', 'enum')).toBe('node')
    expect(detectComponentKind('prefix', 'ReactNode')).toBe('node')
  })

  it('only detects less-confident names when type matches', () => {
    expect(detectComponentKind('header', 'string')).toBeUndefined()
    expect(detectComponentKind('header', 'ReactNode')).toBe('node')
    // JSX.Element hits type-based detection first → 'element' (not 'node')
    expect(detectComponentKind('trigger', 'JSX.Element')).toBe('element')
    // With a generic 'enum' type, less-confident names only match Node/Element patterns
    expect(detectComponentKind('trigger', 'enum')).toBeUndefined()
    expect(detectComponentKind('label', 'ReactNode')).toBe('node')
  })

  it('returns undefined for unknown props', () => {
    expect(detectComponentKind('title', 'string')).toBeUndefined()
    expect(detectComponentKind('onClick', '() => void')).toBeUndefined()
  })
})

// ── applyPathAlias ────────────────────────────────────────────

describe('applyPathAlias', () => {
  it('replaces src/ with @/ by default convention', () => {
    expect(applyPathAlias('src/components/ui/button', { '@/': 'src/' })).toBe(
      '@/components/ui/button',
    )
  })

  it('supports tilde alias', () => {
    expect(applyPathAlias('src/components/ui/button', { '~/': 'src/' })).toBe(
      '~/components/ui/button',
    )
  })

  it('supports custom alias', () => {
    expect(
      applyPathAlias('src/components/ui/button', {
        '@components/': 'src/components/',
      }),
    ).toBe('@components/ui/button')
  })

  it('returns path unchanged when no alias matches', () => {
    expect(applyPathAlias('lib/utils', { '@/': 'src/' })).toBe('lib/utils')
  })

  it('applies first matching alias', () => {
    expect(
      applyPathAlias('src/components/ui/button', {
        '@ui/': 'src/components/ui/',
        '@/': 'src/',
      }),
    ).toBe('@ui/button')
  })
})
