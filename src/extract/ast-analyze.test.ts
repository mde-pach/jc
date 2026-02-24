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
