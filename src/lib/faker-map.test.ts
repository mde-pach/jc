import { describe, expect, it } from 'vitest'
import type { JcPropMeta } from '../types.js'
import {
  generateFakeChildren,
  generateFakeValue,
  getArrayItemType,
  resolveControlType,
} from './faker-map.js'

function makeProp(overrides: Partial<JcPropMeta> = {}): JcPropMeta {
  return {
    name: 'test',
    type: 'string',
    required: false,
    description: '',
    isChildren: false,
    ...overrides,
  }
}

// ── resolveControlType ────────────────────────────────────────

describe('resolveControlType', () => {
  it('returns component for componentKind props', () => {
    expect(resolveControlType(makeProp({ componentKind: 'icon' }))).toBe('component')
  })

  it('returns select when values exist', () => {
    expect(resolveControlType(makeProp({ values: ['sm', 'md', 'lg'] }))).toBe('select')
  })

  it('returns boolean for boolean type', () => {
    expect(resolveControlType(makeProp({ type: 'boolean' }))).toBe('boolean')
  })

  it('returns number for number type', () => {
    expect(resolveControlType(makeProp({ type: 'number' }))).toBe('number')
  })

  it('returns component for ReactNode type', () => {
    expect(resolveControlType(makeProp({ type: 'ReactNode' }))).toBe('component')
  })

  it('returns readonly for function types', () => {
    expect(resolveControlType(makeProp({ type: '() => void' }))).toBe('readonly')
    expect(resolveControlType(makeProp({ type: 'Function' }))).toBe('readonly')
  })

  it('returns json for object/array types', () => {
    expect(resolveControlType(makeProp({ type: '{ name: string }' }))).toBe('json')
    expect(resolveControlType(makeProp({ type: 'Array<string>' }))).toBe('json')
    expect(resolveControlType(makeProp({ type: 'Record<string, any>' }))).toBe('json')
  })

  it('returns text for string', () => {
    expect(resolveControlType(makeProp({ type: 'string' }))).toBe('text')
  })

  it('returns text for enum without values', () => {
    expect(resolveControlType(makeProp({ type: 'enum' }))).toBe('text')
  })

  it('returns array for T[] types', () => {
    expect(resolveControlType(makeProp({ type: 'string[]' }))).toBe('array')
    expect(resolveControlType(makeProp({ type: 'LucideIcon[]' }))).toBe('array')
  })

  it('returns component for ReactElement type', () => {
    expect(resolveControlType(makeProp({ type: 'ReactElement' }))).toBe('component')
    expect(resolveControlType(makeProp({ type: 'JSX.Element' }))).toBe('component')
  })
})

// ── getArrayItemType ─────────────────────────────────────────

describe('getArrayItemType', () => {
  it('returns null for non-array types', () => {
    expect(getArrayItemType(makeProp({ type: 'string' }))).toBeNull()
    expect(getArrayItemType(makeProp({ type: 'number' }))).toBeNull()
  })

  it('extracts string item type', () => {
    const result = getArrayItemType(makeProp({ type: 'string[]' }))
    expect(result).toEqual({ itemType: 'string', isComponent: false })
  })

  it('extracts number item type', () => {
    const result = getArrayItemType(makeProp({ type: 'number[]' }))
    expect(result).toEqual({ itemType: 'number', isComponent: false })
  })

  it('detects component item type from type name', () => {
    const result = getArrayItemType(makeProp({ type: 'ReactNode[]' }))
    expect(result?.isComponent).toBe(true)
  })

  it('detects component item type from rawType', () => {
    const result = getArrayItemType(makeProp({ type: 'enum[]', rawType: 'LucideIcon[]' }))
    expect(result?.isComponent).toBe(true)
  })

  it('detects non-component for plain types', () => {
    const result = getArrayItemType(makeProp({ type: 'boolean[]' }))
    expect(result).toEqual({ itemType: 'boolean', isComponent: false })
  })
})

// ── generateFakeValue ─────────────────────────────────────────

describe('generateFakeValue', () => {
  it('returns undefined for component-kind props', () => {
    expect(generateFakeValue('icon', makeProp({ componentKind: 'icon' }))).toBeUndefined()
  })

  it('returns default value when available', () => {
    expect(generateFakeValue('size', makeProp({ defaultValue: 'md' }))).toBe('md')
  })

  it('returns parsed boolean default', () => {
    expect(generateFakeValue('disabled', makeProp({ type: 'boolean', defaultValue: 'true' }))).toBe(
      true,
    )
    expect(
      generateFakeValue('disabled', makeProp({ type: 'boolean', defaultValue: 'false' })),
    ).toBe(false)
  })

  it('returns parsed number default', () => {
    expect(generateFakeValue('count', makeProp({ type: 'number', defaultValue: '42' }))).toBe(42)
  })

  it('returns first enum value for required prop', () => {
    expect(
      generateFakeValue('variant', makeProp({ values: ['primary', 'secondary'], required: true })),
    ).toBe('primary')
  })

  it('returns undefined for optional enum prop', () => {
    expect(
      generateFakeValue('variant', makeProp({ values: ['primary', 'secondary'], required: false })),
    ).toBeUndefined()
  })

  it('returns false for boolean without default', () => {
    expect(generateFakeValue('disabled', makeProp({ type: 'boolean' }))).toBe(false)
  })

  it('returns a number for number types', () => {
    const result = generateFakeValue('count', makeProp({ type: 'number' }))
    expect(typeof result).toBe('number')
  })

  it('returns a string for string types', () => {
    const result = generateFakeValue('title', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
    expect((result as string).length).toBeGreaterThan(0)
  })

  it('returns email-like value for email prop', () => {
    const result = generateFakeValue('email', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
    expect(result).toContain('@')
  })

  it('returns empty string for search/query/filter props', () => {
    expect(generateFakeValue('search', makeProp({ type: 'string' }))).toBe('')
    expect(generateFakeValue('query', makeProp({ type: 'string' }))).toBe('')
    expect(generateFakeValue('filter', makeProp({ type: 'string' }))).toBe('')
  })

  it('returns undefined for complex types', () => {
    expect(generateFakeValue('stats', makeProp({ type: 'object' }))).toBeUndefined()
    expect(generateFakeValue('items', makeProp({ type: 'string' }))).toBeUndefined()
  })

  it('returns undefined for component controlType without componentKind', () => {
    expect(generateFakeValue('content', makeProp({ type: 'ReactNode' }))).toBeUndefined()
  })

  it('returns undefined for trend prop', () => {
    expect(generateFakeValue('trend', makeProp({ type: 'string' }))).toBeUndefined()
  })

  // Number heuristics
  it('returns 1 for page-related number props', () => {
    expect(generateFakeValue('page', makeProp({ type: 'number' }))).toBe(1)
    expect(generateFakeValue('currentPage', makeProp({ type: 'number' }))).toBe(1)
  })

  it('returns 10 for max-related number props', () => {
    expect(generateFakeValue('maxItems', makeProp({ type: 'number' }))).toBe(10)
  })

  it('returns ~65 for percent-related number props', () => {
    expect(generateFakeValue('percent', makeProp({ type: 'number' }))).toBe(65)
    expect(generateFakeValue('progress', makeProp({ type: 'number' }))).toBe(65)
  })

  it('returns a float for price-related number props', () => {
    const result = generateFakeValue('price', makeProp({ type: 'number' }))
    expect(typeof result).toBe('number')
    expect(result as number).toBeGreaterThan(0)
  })

  it('returns a float for rating-related number props', () => {
    const result = generateFakeValue('rating', makeProp({ type: 'number' }))
    expect(typeof result).toBe('number')
    expect(result as number).toBeGreaterThanOrEqual(1)
    expect(result as number).toBeLessThanOrEqual(5)
  })

  // String heuristics
  it('returns a name for name prop', () => {
    const result = generateFakeValue('name', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
    expect((result as string).length).toBeGreaterThan(0)
  })

  it('returns a sentence for description prop', () => {
    const result = generateFakeValue('description', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
    expect((result as string).length).toBeGreaterThan(5)
  })

  it('returns a placeholder for placeholder prop', () => {
    const result = generateFakeValue('placeholder', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
    expect(result as string).toContain('...')
  })

  it('returns a URL for url prop', () => {
    const result = generateFakeValue('url', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
    expect(result as string).toContain('://')
  })

  it('returns an image URL for avatar prop', () => {
    const result = generateFakeValue('avatar', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
    expect(result as string).toContain('://')
  })

  it('returns a color for color prop', () => {
    const result = generateFakeValue('color', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
  })

  it('returns a date string for date prop', () => {
    const result = generateFakeValue('date', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
    expect(result as string).toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  it('returns a phone number for phone prop', () => {
    const result = generateFakeValue('phone', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
    expect((result as string).length).toBeGreaterThan(0)
  })

  it('returns an address for address prop', () => {
    const result = generateFakeValue('address', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
    expect((result as string).length).toBeGreaterThan(0)
  })

  it('returns a paragraph for text/content prop', () => {
    const result = generateFakeValue('text', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
    expect((result as string).length).toBeGreaterThan(10)
  })

  it('returns fallback words for unknown string prop', () => {
    const result = generateFakeValue('unknownProp', makeProp({ type: 'string' }))
    expect(typeof result).toBe('string')
    expect((result as string).length).toBeGreaterThan(0)
  })

  it('returns undefined for unknown non-string types', () => {
    expect(generateFakeValue('unknownProp', makeProp({ type: 'SomeCustomType' }))).toBeUndefined()
  })

  // Array defaults
  it('returns array of strings for string[] props', () => {
    const result = generateFakeValue('tags', makeProp({ type: 'string[]' }))
    expect(Array.isArray(result)).toBe(true)
    expect((result as string[]).length).toBe(3)
    expect(typeof (result as string[])[0]).toBe('string')
  })

  it('returns feature-like strings for feature[] props', () => {
    const result = generateFakeValue('features', makeProp({ type: 'string[]' }))
    expect(Array.isArray(result)).toBe(true)
    expect((result as string[]).length).toBe(3)
  })

  it('returns array of numbers for number[] props', () => {
    const result = generateFakeValue('scores', makeProp({ type: 'number[]' }))
    expect(Array.isArray(result)).toBe(true)
    expect((result as number[]).length).toBe(3)
    expect(typeof (result as number[])[0]).toBe('number')
  })

  it('returns array of booleans for boolean[] props', () => {
    const result = generateFakeValue('flags', makeProp({ type: 'boolean[]' }))
    expect(result).toEqual([true, false, true])
  })

  it('returns empty array for component[] props', () => {
    // ReactNode[] resolves to 'component' controlType before reaching array logic,
    // so use a rawType-based detection path instead
    const result = generateFakeValue('icons', makeProp({ type: 'enum[]', rawType: 'LucideIcon[]' }))
    expect(result).toEqual([])
  })

  it('returns empty array for unknown array item types', () => {
    const result = generateFakeValue('data', makeProp({ type: 'SomeObject[]' }))
    expect(result).toEqual([])
  })
})

// ── generateFakeChildren ──────────────────────────────────────

describe('generateFakeChildren', () => {
  it('returns "Click me" for button components', () => {
    expect(generateFakeChildren('Button')).toBe('Click me')
    expect(generateFakeChildren('IconButton')).toBe('Click me')
  })

  it('returns "New" for badge components', () => {
    expect(generateFakeChildren('Badge')).toBe('New')
    expect(generateFakeChildren('StatusBadge')).toBe('New')
  })

  it('returns words for title components', () => {
    const result = generateFakeChildren('PageTitle')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns sentence for description components', () => {
    const result = generateFakeChildren('CardDescription')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns words for label components', () => {
    const result = generateFakeChildren('FormLabel')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns words for header components', () => {
    const result = generateFakeChildren('Header')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns words for footer components', () => {
    const result = generateFakeChildren('Footer')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns a word for tab components', () => {
    const result = generateFakeChildren('Tab')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns a non-empty string for other components', () => {
    const result = generateFakeChildren('Card')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
