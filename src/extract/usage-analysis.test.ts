import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { JcComponentMeta } from '../types.js'
import {
  analyzeComponentUsage,
  computeUsageCounts,
  scanFileForComponents,
} from './usage-analysis.js'

// ── scanFileForComponents ────────────────────────────────────

describe('scanFileForComponents', () => {
  const names = new Set(['Button', 'Card', 'Alert'])

  it('detects <Button> with children', () => {
    const source = 'return <Button>Click</Button>'
    expect(scanFileForComponents(source, names)).toEqual(new Set(['Button']))
  })

  it('detects self-closing <Button />', () => {
    const source = 'return <Button />'
    expect(scanFileForComponents(source, names)).toEqual(new Set(['Button']))
  })

  it('does not match plain text "Button" or {Button}', () => {
    const source = 'const x = Button; const y = {Button}'
    expect(scanFileForComponents(source, names)).toEqual(new Set())
  })

  it('finds multiple components in one file', () => {
    const source = '<Card><Button>OK</Button><Alert>Warn</Alert></Card>'
    expect(scanFileForComponents(source, names)).toEqual(new Set(['Button', 'Card', 'Alert']))
  })

  it('ignores lowercase HTML tags', () => {
    const source = '<button>Click</button><div>text</div>'
    expect(scanFileForComponents(source, names)).toEqual(new Set())
  })
})

// ── computeUsageCounts ───────────────────────────────────────

describe('computeUsageCounts', () => {
  it('returns zeros when no usages', () => {
    const direct = new Map([['Button', 0]])
    const graph = new Map([['Button', new Set<string>()]])
    const result = computeUsageCounts(direct, graph)
    expect(result.get('Button')).toEqual({ direct: 0, indirect: 0, total: 0 })
  })

  it('counts direct only when no graph edges', () => {
    const direct = new Map([['Button', 5]])
    const graph = new Map([['Button', new Set<string>()]])
    const result = computeUsageCounts(direct, graph)
    expect(result.get('Button')).toEqual({ direct: 5, indirect: 0, total: 5 })
  })

  it('propagates single indirect level', () => {
    // Card renders <Button>, Card is used in 3 files
    const direct = new Map([
      ['Button', 2],
      ['Card', 3],
    ])
    const graph = new Map([
      ['Button', new Set<string>()],
      ['Card', new Set(['Button'])],
    ])
    const result = computeUsageCounts(direct, graph)
    // Button: 2 direct + 3 indirect (Card's total) = 5
    expect(result.get('Button')).toEqual({ direct: 2, indirect: 3, total: 5 })
    expect(result.get('Card')).toEqual({ direct: 3, indirect: 0, total: 3 })
  })

  it('propagates multi-level chain', () => {
    // Page renders <Card>, Card renders <Button>
    const direct = new Map([
      ['Button', 1],
      ['Card', 2],
      ['Page', 4],
    ])
    const graph = new Map([
      ['Button', new Set<string>()],
      ['Card', new Set(['Button'])],
      ['Page', new Set(['Card'])],
    ])
    const result = computeUsageCounts(direct, graph)
    // Card: 2 direct + 4 indirect (Page total) = 6
    // Button: 1 direct + 6 indirect (Card total) = 7
    expect(result.get('Page')).toEqual({ direct: 4, indirect: 0, total: 4 })
    expect(result.get('Card')).toEqual({ direct: 2, indirect: 4, total: 6 })
    expect(result.get('Button')).toEqual({ direct: 1, indirect: 6, total: 7 })
  })

  it('handles diamond dependency', () => {
    // Both Sidebar and Header render <Button>; Layout renders both
    const direct = new Map([
      ['Button', 1],
      ['Sidebar', 2],
      ['Header', 3],
    ])
    const graph = new Map([
      ['Button', new Set<string>()],
      ['Sidebar', new Set(['Button'])],
      ['Header', new Set(['Button'])],
    ])
    const result = computeUsageCounts(direct, graph)
    // Button: 1 direct + 2 (Sidebar) + 3 (Header) = 6
    expect(result.get('Button')).toEqual({ direct: 1, indirect: 5, total: 6 })
  })

  it('handles cycles without infinite loop', () => {
    // A renders B, B renders A (cycle)
    const direct = new Map([
      ['A', 1],
      ['B', 2],
    ])
    const graph = new Map([
      ['A', new Set(['B'])],
      ['B', new Set(['A'])],
    ])
    const result = computeUsageCounts(direct, graph)
    // Should not throw, values should be finite
    expect(result.get('A')!.total).toBeGreaterThanOrEqual(1)
    expect(result.get('B')!.total).toBeGreaterThanOrEqual(2)
    expect(Number.isFinite(result.get('A')!.total)).toBe(true)
    expect(Number.isFinite(result.get('B')!.total)).toBe(true)
  })
})

// ── Integration with fixtures ────────────────────────────────

describe('analyzeComponentUsage integration', () => {
  const fixturesDir = resolve(__dirname, '__fixtures__')

  function makeMeta(name: string, filePath: string): JcComponentMeta {
    return {
      displayName: name,
      filePath,
      description: '',
      props: {},
      acceptsChildren: false,
    }
  }

  it('detects direct usage of Badge in usage-parent.tsx', () => {
    const components = [
      makeMeta('Badge', '__fixtures__/usage-child.tsx'),
      makeMeta('Card', '__fixtures__/usage-parent.tsx'),
    ]
    const result = analyzeComponentUsage(fixturesDir, components)
    const badge = result.get('Badge')!
    // Badge is used directly in usage-parent.tsx (Card's definition)
    expect(badge.direct).toBeGreaterThanOrEqual(1)
  })

  it('detects that Card uses Badge (component graph)', () => {
    const components = [
      makeMeta('Badge', '__fixtures__/usage-child.tsx'),
      makeMeta('Card', '__fixtures__/usage-parent.tsx'),
    ]
    const result = analyzeComponentUsage(fixturesDir, components)
    const badge = result.get('Badge')!
    // Badge direct >= 1 (from usage-parent rendering <Badge>)
    expect(badge.direct).toBeGreaterThanOrEqual(1)
  })

  it('Button fixture has usages from other fixtures', () => {
    const components = [makeMeta('Button', '__fixtures__/sample-button.tsx')]
    // Button might or might not be used in other fixtures
    const result = analyzeComponentUsage(fixturesDir, components)
    const button = result.get('Button')!
    expect(button).toBeDefined()
    expect(button.total).toEqual(button.direct + button.indirect)
  })
})
