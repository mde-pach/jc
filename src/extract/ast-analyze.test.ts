import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { createAstAnalyzer, getCompilerOptions } from './ast-analyze.js'

const fixturesDir = resolve(__dirname, '__fixtures__')
const projectRoot = resolve(__dirname, '../..')

function createTestProgram(files: string[]) {
  const fullPaths = files.map((f) => resolve(fixturesDir, f))
  const options = getCompilerOptions(projectRoot, { '@/': 'src/' })
  return ts.createProgram(fullPaths, options)
}

function analyzeFixture(fixture: string, componentName: string) {
  const program = createTestProgram([fixture])
  const analyzer = createAstAnalyzer(program)
  return analyzer.analyzeComponent(resolve(fixturesDir, fixture), componentName)
}

// ── Component kind detection ─────────────────────────────────

describe('componentKind detection', () => {
  it('detects ComponentType as icon kind', () => {
    const result = analyzeFixture('icon-component.tsx', 'IconComponent')
    expect(result).toBeDefined()
    expect(result!.props.icon?.componentKind).toBe('icon')
  })

  it('detects ReactElement as element kind', () => {
    const result = analyzeFixture('icon-component.tsx', 'IconComponent')
    expect(result!.props.element?.componentKind).toBe('element')
  })

  it('detects ReactNode as node kind', () => {
    const result = analyzeFixture('icon-component.tsx', 'IconComponent')
    expect(result!.props.node?.componentKind).toBe('node')
  })

  it('returns undefined componentKind for string props', () => {
    const result = analyzeFixture('icon-component.tsx', 'IconComponent')
    expect(result!.props.label?.componentKind).toBeUndefined()
  })

  it('detects another ComponentType variant as icon kind', () => {
    const result = analyzeFixture('icon-component.tsx', 'IconComponent')
    expect(result!.props.renderer?.componentKind).toBe('icon')
  })

  it('does not classify structured object arrays containing ReactNode as component kind', () => {
    const result = analyzeFixture('structured-array.tsx', 'Tabs')
    expect(result).toBeDefined()
    // tabs is { label: string; content: ReactNode }[] — a data structure, not a component slot
    expect(result!.props.tabs?.componentKind).toBeUndefined()
  })
})

// ── Children detection ───────────────────────────────────────

describe('children detection', () => {
  it('detects explicit children prop', () => {
    const result = analyzeFixture('children-variants.tsx', 'ExplicitChildren')
    expect(result).toBeDefined()
    expect(result!.acceptsChildren).toBe(true)
  })

  it('detects PropsWithChildren', () => {
    const result = analyzeFixture('children-variants.tsx', 'CardWithChildren')
    expect(result).toBeDefined()
    expect(result!.acceptsChildren).toBe(true)
  })

  it('returns undefined/falsy for component without children', () => {
    const result = analyzeFixture('children-variants.tsx', 'NoChildren')
    expect(result).toBeDefined()
    expect(result!.acceptsChildren).toBeFalsy()
  })
})

// ── Union value analysis ─────────────────────────────────────

describe('union value analysis', () => {
  it('extracts string literal union values', () => {
    const result = analyzeFixture('union-types.tsx', 'StringUnion')
    expect(result).toBeDefined()
    expect(result!.props.variant?.values).toEqual(['primary', 'secondary', 'destructive'])
  })

  it('extracts optional string literal union values', () => {
    const result = analyzeFixture('union-types.tsx', 'StringUnion')
    expect(result!.props.size?.values).toEqual(['sm', 'md', 'lg'])
  })

  it('detects boolean type', () => {
    const result = analyzeFixture('union-types.tsx', 'StringUnion')
    expect(result!.props.disabled?.isBoolean).toBe(true)
  })

  it('detects true|false as boolean', () => {
    const result = analyzeFixture('union-types.tsx', 'StringUnion')
    expect(result!.props.open?.isBoolean).toBe(true)
  })

  it('extracts optional union values (strips undefined)', () => {
    const result = analyzeFixture('union-types.tsx', 'StringUnion')
    expect(result!.props.color?.values).toEqual(['red', 'blue', 'green'])
  })
})

// ── Wrapped components ───────────────────────────────────────

describe('wrapped components (forwardRef, memo)', () => {
  it('extracts forwardRef props', () => {
    const result = analyzeFixture('wrapped-components.tsx', 'ForwardRefButton')
    expect(result).toBeDefined()
    expect(result!.props.variant?.values).toEqual(['solid', 'outline', 'ghost'])
  })

  it('detects forwardRef children', () => {
    const result = analyzeFixture('wrapped-components.tsx', 'ForwardRefButton')
    expect(result!.acceptsChildren).toBe(true)
  })

  it('detects forwardRef icon prop', () => {
    const result = analyzeFixture('wrapped-components.tsx', 'ForwardRefButton')
    expect(result!.props.icon?.componentKind).toBe('icon')
  })

  it('extracts memo component props', () => {
    const result = analyzeFixture('wrapped-components.tsx', 'MemoCard')
    expect(result).toBeDefined()
    expect(result!.props.size?.values).toEqual(['sm', 'md', 'lg'])
  })
})

// ── Full integration ─────────────────────────────────────────

describe('full integration', () => {
  it('analyzes sample-button fixture completely', () => {
    const result = analyzeFixture('sample-button.tsx', 'Button')
    expect(result).toBeDefined()
    expect(result!.acceptsChildren).toBe(true)
    expect(result!.props.variant?.values).toEqual(['primary', 'secondary', 'destructive'])
    expect(result!.props.size?.values).toEqual(['sm', 'md', 'lg'])
    expect(result!.props.disabled?.isBoolean).toBe(true)
    expect(result!.props.icon?.componentKind).toBe('icon')
  })

  it('returns undefined for non-existent component', () => {
    const result = analyzeFixture('sample-button.tsx', 'NonExistent')
    expect(result).toBeUndefined()
  })

  it('returns undefined for non-existent file', () => {
    const program = createTestProgram(['sample-button.tsx'])
    const analyzer = createAstAnalyzer(program)
    const result = analyzer.analyzeComponent('/non/existent/file.tsx', 'Button')
    expect(result).toBeUndefined()
  })
})

// ── Named interface type expansion ───────────────────────────

describe('named interface type expansion', () => {
  it('expands ContactInfo into inline object literal', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    expect(result).toBeDefined()
    expect(result!.props.contact?.simplifiedType).toBeDefined()
    expect(result!.props.contact!.simplifiedType).toMatch(/^\{/)
    expect(result!.props.contact!.simplifiedType).toMatch(/email/)
    expect(result!.props.contact!.simplifiedType).toMatch(/string/)
  })

  it('expands NotificationPrefs into inline object literal with boolean and enum fields', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    expect(result!.props.notifications?.simplifiedType).toBeDefined()
    expect(result!.props.notifications!.simplifiedType).toMatch(/^\{/)
    expect(result!.props.notifications!.simplifiedType).toMatch(/email/)
    expect(result!.props.notifications!.simplifiedType).toMatch(/boolean/)
    expect(result!.props.notifications!.simplifiedType).toMatch(/frequency/)
  })

  it('expands SocialLink[] into inline object array', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    expect(result!.props.socialLinks?.simplifiedType).toBeDefined()
    expect(result!.props.socialLinks!.simplifiedType).toMatch(/\[\]$/)
    expect(result!.props.socialLinks!.simplifiedType).toMatch(/platform/)
    expect(result!.props.socialLinks!.simplifiedType).toMatch(/url/)
  })

  it('expands Metric[] into inline object array', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    expect(result!.props.metrics?.simplifiedType).toBeDefined()
    expect(result!.props.metrics!.simplifiedType).toMatch(/\[\]$/)
    expect(result!.props.metrics!.simplifiedType).toMatch(/label/)
    expect(result!.props.metrics!.simplifiedType).toMatch(/value/)
    expect(result!.props.metrics!.simplifiedType).toMatch(/number/)
  })

  it('does not expand Record<string, string>', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    expect(result!.props.metadata?.simplifiedType).toMatch(/Record/)
  })

  it('does not misclassify named interface as component kind', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    expect(result!.props.contact?.componentKind).toBeUndefined()
    expect(result!.props.notifications?.componentKind).toBeUndefined()
    expect(result!.props.socialLinks?.componentKind).toBeUndefined()
    expect(result!.props.metrics?.componentKind).toBeUndefined()
  })

  it('still detects ReactNode as node kind for badge/footer', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    expect(result!.props.badge?.componentKind).toBe('node')
    expect(result!.props.footer?.componentKind).toBe('node')
  })

  it('preserves simple types alongside expanded ones', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    expect(result!.props.name?.simplifiedType).toBe('string')
    expect(result!.props.online?.isBoolean).toBe(true)
    expect(result!.props.role?.values).toEqual(['admin', 'member', 'owner', 'guest'])
  })

  it('expands nested Address inside ContactInfo', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    const contactType = result!.props.contact!.simplifiedType!
    // Address should be expanded too (recursive expansion)
    expect(contactType).toMatch(/street/)
    expect(contactType).toMatch(/city/)
  })
})

// ── structuredFields extraction ──────────────────────────────

describe('structuredFields extraction', () => {
  it('extracts structuredFields for contact (named interface)', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    const sf = result!.props.contact?.structuredFields
    expect(sf).toBeDefined()
    expect(sf!.length).toBe(3) // email, phone, address
    expect(sf!.find((f) => f.name === 'email')).toMatchObject({
      type: 'string',
      optional: false,
      isComponent: false,
    })
    expect(sf!.find((f) => f.name === 'phone')).toMatchObject({
      type: 'string',
      optional: true,
      isComponent: false,
    })
  })

  it('extracts nested fields for address inside contact', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    const sf = result!.props.contact?.structuredFields
    const addressField = sf!.find((f) => f.name === 'address')
    expect(addressField).toBeDefined()
    expect(addressField!.fields).toBeDefined()
    expect(addressField!.fields!.length).toBe(4)
    expect(addressField!.fields!.map((f) => f.name)).toEqual([
      'street',
      'city',
      'zipCode',
      'country',
    ])
  })

  it('extracts structuredFields for notifications with enum values', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    const sf = result!.props.notifications?.structuredFields
    expect(sf).toBeDefined()
    expect(sf!.length).toBe(4) // email, push, sms, frequency
    const freq = sf!.find((f) => f.name === 'frequency')
    expect(freq).toBeDefined()
    expect(freq!.values).toEqual(['instant', 'daily', 'weekly'])
  })

  it('extracts structuredFields for socialLinks array with enum values', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    const sf = result!.props.socialLinks?.structuredFields
    expect(sf).toBeDefined()
    expect(sf!.length).toBe(3) // platform, url, label
    const platform = sf!.find((f) => f.name === 'platform')
    expect(platform!.values).toEqual(['twitter', 'github', 'linkedin', 'website'])
  })

  it('extracts structuredFields for metrics array with optional enum', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    const sf = result!.props.metrics?.structuredFields
    expect(sf).toBeDefined()
    expect(sf!.length).toBe(4) // label, value, unit, trend
    const trend = sf!.find((f) => f.name === 'trend')
    expect(trend!.optional).toBe(true)
    expect(trend!.values).toEqual(['up', 'down', 'flat'])
    const value = sf!.find((f) => f.name === 'value')
    expect(value!.type).toBe('number')
  })

  it('does not extract structuredFields for primitive props', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    expect(result!.props.name?.structuredFields).toBeUndefined()
    expect(result!.props.online?.structuredFields).toBeUndefined()
    expect(result!.props.role?.structuredFields).toBeUndefined()
  })

  it('does not extract structuredFields for ReactNode props', () => {
    const result = analyzeFixture('named-interfaces.tsx', 'ProfileCard')
    expect(result!.props.badge?.structuredFields).toBeUndefined()
    expect(result!.props.footer?.structuredFields).toBeUndefined()
  })
})

// ── getCompilerOptions ───────────────────────────────────────

describe('getCompilerOptions', () => {
  it('builds TS paths from pathAlias', () => {
    const opts = getCompilerOptions('/project', { '@/': 'src/' })
    expect(opts.paths).toEqual({ '@/*': ['./src/*'] })
    expect(opts.baseUrl).toBe('/project')
  })

  it('supports multiple aliases', () => {
    const opts = getCompilerOptions('/project', { '@/': 'src/', '~/': 'lib/' })
    expect(opts.paths).toEqual({ '@/*': ['./src/*'], '~/*': ['./lib/*'] })
  })
})
