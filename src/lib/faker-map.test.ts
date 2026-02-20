import { describe, expect, it } from 'vitest'
import type { JcPropMeta } from '../types.js'
import { generateFakeChildren, generateFakeValue, resolveControlType } from './faker-map.js'

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
    expect(generateFakeValue('disabled', makeProp({ type: 'boolean', defaultValue: 'true' }))).toBe(true)
    expect(generateFakeValue('disabled', makeProp({ type: 'boolean', defaultValue: 'false' }))).toBe(false)
  })

  it('returns parsed number default', () => {
    expect(generateFakeValue('count', makeProp({ type: 'number', defaultValue: '42' }))).toBe(42)
  })

  it('returns first enum value', () => {
    expect(generateFakeValue('variant', makeProp({ values: ['primary', 'secondary'] }))).toBe('primary')
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

  it('returns a non-empty string for other components', () => {
    const result = generateFakeChildren('Card')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
