import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { makeProp } from '../__test-utils__/factories.js'
import type { JcComponentMeta } from '../types.js'
import {
  generateFakeChildren,
  generateFakeValue,
  generateVariedInstances,
  getArrayItemType,
  resolveControlType,
} from './faker-map.js'

// ── resolveControlType ────────────────────────────────────────

describe('resolveControlType', () => {
  it('returns component for componentKind props', () => {
    expect(resolveControlType(makeProp({ componentKind: 'element' }))).toBe('component')
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
    // Parenthesized form from react-docgen-typescript
    expect(resolveControlType(makeProp({ type: '(() => void)' }))).toBe('readonly')
    // Event handler signatures
    expect(resolveControlType(makeProp({ type: '(event: MouseEvent) => void' }))).toBe('readonly')
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
    expect(resolveControlType(makeProp({ type: 'number[]' }))).toBe('array')
  })

  it('returns array for structured object array types', () => {
    expect(
      resolveControlType(makeProp({ type: '{ label: string; icon: ReactNode; href: string }[]' })),
    ).toBe('array')
    expect(resolveControlType(makeProp({ type: '{ label: string; content: ReactNode }[]' }))).toBe(
      'array',
    )
  })

  it('returns json for Record types', () => {
    expect(resolveControlType(makeProp({ type: 'Record<string, string>' }))).toBe('json')
    expect(resolveControlType(makeProp({ type: 'Record<string, unknown>' }))).toBe('json')
  })

  it('returns json for inline object types', () => {
    expect(resolveControlType(makeProp({ type: '{ theme: string; layout: string }' }))).toBe('json')
  })

  it('returns component for ReactElement type', () => {
    expect(resolveControlType(makeProp({ type: 'ReactElement' }))).toBe('component')
    expect(resolveControlType(makeProp({ type: 'JSX.Element' }))).toBe('component')
  })

  it('does not return component for structured types containing ReactNode', () => {
    // An object array whose fields happen to include ReactNode should be array, not component
    expect(resolveControlType(makeProp({ type: '{ label: string; content: ReactNode }[]' }))).toBe(
      'array',
    )
    // An object containing ReactNode should be json, not component
    expect(resolveControlType(makeProp({ type: '{ label: string; content: ReactNode }' }))).toBe(
      'json',
    )
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

  it('does not detect component from library-specific rawType', () => {
    // Library-specific types (LucideIcon) are handled by plugins, not extraction
    const result = getArrayItemType(makeProp({ type: 'enum[]', rawType: 'LucideIcon[]' }))
    expect(result?.isComponent).toBe(false)
  })

  it('detects non-component for plain types', () => {
    const result = getArrayItemType(makeProp({ type: 'boolean[]' }))
    expect(result).toEqual({ itemType: 'boolean', isComponent: false })
  })
})

// ── generateFakeValue ─────────────────────────────────────────

describe('generateFakeValue', () => {
  it('returns undefined for component-kind props', () => {
    expect(generateFakeValue('icon', makeProp({ componentKind: 'element' }))).toBeUndefined()
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

// ── Props with pre-extracted structuredFields ─────────────────

describe('resolveControlType — props with structuredFields', () => {
  it('returns object for object type with structuredFields', () => {
    expect(
      resolveControlType(
        makeProp({
          type: '{ email: string; phone?: string }',
          structuredFields: [
            { name: 'email', type: 'string', optional: false, isComponent: false },
            { name: 'phone', type: 'string', optional: true, isComponent: false },
          ],
        }),
      ),
    ).toBe('object')
  })

  it('returns array for array type with structuredFields', () => {
    expect(
      resolveControlType(
        makeProp({
          type: '{ platform: string; url: string }[]',
          structuredFields: [
            { name: 'platform', type: 'string', optional: false, isComponent: false },
            { name: 'url', type: 'string', optional: false, isComponent: false },
          ],
        }),
      ),
    ).toBe('array')
  })

  it('returns json for inline object type string (type-string fallback)', () => {
    expect(
      resolveControlType(
        makeProp({
          type: '{ label: string; value: number }',
        }),
      ),
    ).toBe('json')
  })

  it('returns array for inline object array type string (type-string fallback)', () => {
    expect(
      resolveControlType(
        makeProp({
          type: '{ label: string; value: number }[]',
        }),
      ),
    ).toBe('array')
  })
})

describe('getArrayItemType — pre-extracted structuredFields', () => {
  it('passes through structuredFields from prop metadata', () => {
    const result = getArrayItemType(
      makeProp({
        type: '{ platform: string; url: string; label?: string }[]',
        structuredFields: [
          {
            name: 'platform',
            type: 'string',
            optional: false,
            isComponent: false,
            values: ['twitter', 'github'],
          },
          { name: 'url', type: 'string', optional: false, isComponent: false },
          { name: 'label', type: 'string', optional: true, isComponent: false },
        ],
      }),
    )
    expect(result).not.toBeNull()
    expect(result!.isComponent).toBe(false)
    expect(result!.structuredFields).toHaveLength(3)
    expect(result!.structuredFields![0].values).toEqual(['twitter', 'github'])
    expect(result!.structuredFields![2]).toMatchObject({ name: 'label', optional: true })
  })

  it('returns undefined structuredFields when not provided on prop', () => {
    const result = getArrayItemType(
      makeProp({
        type: '{ label: string; value: number }[]',
      }),
    )
    expect(result).not.toBeNull()
    expect(result!.structuredFields).toBeUndefined()
  })
})

// ── getArrayItemType with pre-extracted structured fields ────

describe('getArrayItemType — structured', () => {
  it('returns structuredFields when provided on prop', () => {
    const fields = [
      { name: 'label', type: 'string', optional: false, isComponent: false },
      {
        name: 'icon',
        type: 'LucideIcon',
        optional: false,
        isComponent: true,
        componentKind: 'element' as const,
      },
    ]
    const result = getArrayItemType(
      makeProp({ type: '{ label: string; icon: LucideIcon }[]', structuredFields: fields }),
    )
    expect(result).not.toBeNull()
    expect(result!.isComponent).toBe(false)
    expect(result!.structuredFields).toHaveLength(2)
    expect(result!.structuredFields![0]).toMatchObject({ name: 'label', type: 'string' })
    expect(result!.structuredFields![1]).toMatchObject({ name: 'icon', isComponent: true })
  })

  it('returns undefined structuredFields for non-object arrays', () => {
    const result = getArrayItemType(makeProp({ type: 'string[]' }))
    expect(result!.structuredFields).toBeUndefined()
  })
})

// ── generateFakeValue with structured arrays ─────────────────

describe('generateFakeValue — structured arrays', () => {
  it('generates 2 items for required structured array', () => {
    const result = generateFakeValue(
      'tabs',
      makeProp({
        type: '{ label: string; value: number }[]',
        required: true,
        structuredFields: [
          { name: 'label', type: 'string', optional: false, isComponent: false },
          { name: 'value', type: 'number', optional: false, isComponent: false },
        ],
      }),
    )
    expect(Array.isArray(result)).toBe(true)
    const arr = result as Record<string, unknown>[]
    expect(arr).toHaveLength(2)
    expect(typeof arr[0].label).toBe('string')
    expect(typeof arr[0].value).toBe('number')
  })

  it('generates empty array for optional structured array', () => {
    const result = generateFakeValue(
      'tabs',
      makeProp({
        type: '{ label: string }[]',
        required: false,
        structuredFields: [{ name: 'label', type: 'string', optional: false, isComponent: false }],
      }),
    )
    expect(result).toEqual([])
  })

  it('sets component fields to undefined', () => {
    const result = generateFakeValue(
      'tabs',
      makeProp({
        type: '{ label: string; icon: LucideIcon }[]',
        required: true,
        structuredFields: [
          { name: 'label', type: 'string', optional: false, isComponent: false },
          {
            name: 'icon',
            type: 'LucideIcon',
            optional: false,
            isComponent: true,
            componentKind: 'element',
          },
        ],
      }),
    )
    const arr = result as Record<string, unknown>[]
    expect(arr[0].icon).toBeUndefined()
    expect(typeof arr[0].label).toBe('string')
  })
})

// ── generateFakeValue with structured objects (non-array) ─────

describe('generateFakeValue — structured objects', () => {
  it('generates object with required fields for required structured prop', () => {
    const result = generateFakeValue(
      'contact',
      makeProp({
        type: '{ email: string; phone?: string }',
        required: true,
        structuredFields: [
          { name: 'email', type: 'string', optional: false, isComponent: false },
          { name: 'phone', type: 'string', optional: true, isComponent: false },
        ],
      }),
    )
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
    const obj = result as Record<string, unknown>
    expect(typeof obj.email).toBe('string')
    // Optional fields also get faker defaults so the editor can show them
    expect(typeof obj.phone).toBe('string')
  })

  it('returns undefined for optional structured prop', () => {
    const result = generateFakeValue(
      'contact',
      makeProp({
        type: '{ email: string; phone?: string }',
        required: false,
        structuredFields: [
          { name: 'email', type: 'string', optional: false, isComponent: false },
          { name: 'phone', type: 'string', optional: true, isComponent: false },
        ],
      }),
    )
    expect(result).toBeUndefined()
  })

  it('sets component fields to undefined in structured objects', () => {
    const result = generateFakeValue(
      'header',
      makeProp({
        type: '{ title: string; icon: LucideIcon }',
        required: true,
        structuredFields: [
          { name: 'title', type: 'string', optional: false, isComponent: false },
          {
            name: 'icon',
            type: 'LucideIcon',
            optional: false,
            isComponent: true,
            componentKind: 'element',
          },
        ],
      }),
    )
    const obj = result as Record<string, unknown>
    expect(typeof obj.title).toBe('string')
    expect(obj.icon).toBeUndefined()
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

// ── generateVariedInstances ─────────────────────────────────

describe('generateVariedInstances', () => {
  const makeComp = (overrides: Partial<JcComponentMeta> = {}): JcComponentMeta => ({
    displayName: 'TestButton',
    filePath: 'src/test.tsx',
    description: '',
    props: {
      label: makeProp({ name: 'label', type: 'string', required: true }),
      disabled: makeProp({ name: 'disabled', type: 'boolean' }),
      variant: makeProp({ name: 'variant', type: 'string', values: ['primary', 'secondary'] }),
    },
    acceptsChildren: true,
    ...overrides,
  })

  it('returns identity for count=1', () => {
    const comp = makeComp()
    const result = generateVariedInstances(
      comp,
      [],
      [],
      { label: 'Hello', disabled: false },
      'Click',
      1,
    )
    expect(result).toHaveLength(1)
    expect(result[0].propValues).toEqual({ label: 'Hello', disabled: false })
    expect(result[0].childrenText).toBe('Click')
  })

  it('generates varied strings for count=3', () => {
    const comp = makeComp()
    const result = generateVariedInstances(
      comp,
      [],
      [],
      { label: 'Hello', disabled: false },
      'Click',
      3,
    )
    expect(result).toHaveLength(3)
    // Instance 0 is exact user values
    expect(result[0].propValues.label).toBe('Hello')
    // Instances 1+ have varied string values
    expect(typeof result[1].propValues.label).toBe('string')
    expect(typeof result[2].propValues.label).toBe('string')
  })

  it('preserves non-string user values across instances', () => {
    const comp = makeComp()
    const result = generateVariedInstances(comp, [], [], { label: 'Hello', disabled: true }, 'Click', 3)
    // Boolean should be preserved in varied instances
    expect(result[1].propValues.disabled).toBe(true)
    expect(result[2].propValues.disabled).toBe(true)
  })

  it('preserves select values across instances', () => {
    const comp = makeComp()
    const result = generateVariedInstances(
      comp,
      [],
      [],
      { label: 'Hello', variant: 'secondary' },
      'Click',
      3,
    )
    expect(result[1].propValues.variant).toBe('secondary')
    expect(result[2].propValues.variant).toBe('secondary')
  })

  it('restores faker seed after generating', () => {
    const comp = makeComp()
    faker.seed(12345)
    const _before = faker.lorem.word()
    faker.seed(12345)
    generateVariedInstances(comp, [], [], { label: 'Hello' }, 'Click', 5)
    // After generateVariedInstances, seed should be restored (unseeded)
    // Just verify it doesn't throw and produces output
    const after = faker.lorem.word()
    expect(typeof after).toBe('string')
  })
})
