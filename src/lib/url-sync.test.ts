import { describe, expect, it } from 'vitest'
import type { ChildItem } from '../types.js'
import type { FixtureOverride } from './showcase-reducer.js'
import {
  deserializeChildrenItems,
  normalizeSerializedState,
  serializeState,
  type SerializedState,
} from './url-sync.js'

// ── Helpers ─────────────────────────────────────────────────

function makeDefaults(overrides?: Partial<{
  propValues: Record<string, unknown>
  childrenItems: ChildItem[]
  wrapperPropsMap: Record<string, Record<string, unknown>>
}>) {
  return {
    propValues: {} as Record<string, unknown>,
    childrenItems: [] as ChildItem[],
    wrapperPropsMap: {} as Record<string, Record<string, unknown>>,
    ...overrides,
  }
}

function roundTrip(serialized: string): SerializedState {
  return JSON.parse(atob(serialized))
}

// ── serializeState ──────────────────────────────────────────

describe('serializeState', () => {
  it('returns null when no props differ from defaults', () => {
    const result = serializeState(
      { title: 'hello' },
      [],
      {},
      {},
      makeDefaults({ propValues: { title: 'hello' } }),
    )
    expect(result).toBeNull()
  })

  it('serializes diffed props only', () => {
    const result = serializeState(
      { title: 'changed', count: 5 },
      [],
      {},
      {},
      makeDefaults({ propValues: { title: 'original', count: 5 } }),
    )
    expect(result).not.toBeNull()
    const parsed = roundTrip(result!)
    expect(parsed.props).toEqual({ title: 'changed' })
    expect(parsed.props?.count).toBeUndefined()
  })

  it('includes version field', () => {
    const result = serializeState(
      { x: 1 },
      [],
      {},
      {},
      makeDefaults(),
    )
    const parsed = roundTrip(result!)
    expect(parsed._v).toBe(2)
  })

  it('serializes children items when different from defaults', () => {
    const items: ChildItem[] = [
      { type: 'text', value: 'Hello' },
      { type: 'fixture', value: 'lucide/star' },
    ]
    const result = serializeState(
      {},
      items,
      {},
      {},
      makeDefaults(),
    )
    const parsed = roundTrip(result!)
    expect(parsed.children).toEqual([
      { t: 'text', v: 'Hello' },
      { t: 'fixture', v: 'lucide/star' },
    ])
  })

  it('does not include children when they match defaults', () => {
    const items: ChildItem[] = [{ type: 'text', value: 'Hello' }]
    const result = serializeState(
      {},
      items,
      {},
      {},
      makeDefaults({ childrenItems: [{ type: 'text', value: 'Hello' }] }),
    )
    expect(result).toBeNull()
  })

  it('serializes wrapper props diff', () => {
    const result = serializeState(
      {},
      [],
      { Tooltip: { side: 'top', align: 'center' } },
      {},
      makeDefaults({ wrapperPropsMap: { Tooltip: { side: 'bottom', align: 'center' } } }),
    )
    const parsed = roundTrip(result!)
    expect(parsed.wrappers).toEqual({ Tooltip: { side: 'top' } })
  })

  it('serializes fixture overrides', () => {
    const overrides: Record<string, FixtureOverride> = {
      'icon-slot': { props: { size: 24 }, childrenText: '' },
    }
    const result = serializeState({}, [], {}, overrides, makeDefaults())
    const parsed = roundTrip(result!)
    expect(parsed.fixtureOverrides).toEqual({
      'icon-slot': { p: { size: 24 }, c: '' },
    })
  })

  it('handles special characters in string values', () => {
    const result = serializeState(
      { title: 'Hello "world" & <friends>' },
      [],
      {},
      {},
      makeDefaults(),
    )
    expect(result).not.toBeNull()
    const parsed = roundTrip(result!)
    expect(parsed.props?.title).toBe('Hello "world" & <friends>')
  })

  it('returns null for unicode characters (btoa limitation)', () => {
    // btoa only supports Latin1 — non-ASCII chars cause the try/catch to return null
    const result = serializeState(
      { label: '🚀' },
      [],
      {},
      {},
      makeDefaults(),
    )
    expect(result).toBeNull()
  })

  it('handles Latin1 accented characters', () => {
    const result = serializeState(
      { label: 'café' },
      [],
      {},
      {},
      makeDefaults(),
    )
    // btoa handles Latin1 chars fine
    expect(result).not.toBeNull()
    const parsed = roundTrip(result!)
    expect(parsed.props?.label).toBe('café')
  })

  it('handles empty string prop values', () => {
    const result = serializeState(
      { title: '' },
      [],
      {},
      {},
      makeDefaults({ propValues: { title: 'non-empty' } }),
    )
    const parsed = roundTrip(result!)
    expect(parsed.props?.title).toBe('')
  })

  it('handles boolean and number prop values', () => {
    const result = serializeState(
      { disabled: true, count: 42 },
      [],
      {},
      {},
      makeDefaults(),
    )
    const parsed = roundTrip(result!)
    expect(parsed.props?.disabled).toBe(true)
    expect(parsed.props?.count).toBe(42)
  })

  it('handles null prop value', () => {
    const result = serializeState(
      { value: null },
      [],
      {},
      {},
      makeDefaults(),
    )
    const parsed = roundTrip(result!)
    expect(parsed.props?.value).toBeNull()
  })
})

// ── deserializeChildrenItems ────────────────────────────────

describe('deserializeChildrenItems', () => {
  it('converts compact format to ChildItem[]', () => {
    const saved: SerializedState = {
      children: [
        { t: 'text', v: 'Hello' },
        { t: 'fixture', v: 'lucide/star' },
      ],
    }
    const result = deserializeChildrenItems(saved)
    expect(result).toEqual([
      { type: 'text', value: 'Hello' },
      { type: 'fixture', value: 'lucide/star' },
    ])
  })

  it('returns null when no children field', () => {
    expect(deserializeChildrenItems({})).toBeNull()
  })

  it('treats unknown type as "text"', () => {
    const saved: SerializedState = {
      children: [{ t: 'unknown' as 'text', v: 'test' }],
    }
    const result = deserializeChildrenItems(saved)
    expect(result).toEqual([{ type: 'text', value: 'test' }])
  })

  it('handles empty children array', () => {
    const saved: SerializedState = { children: [] }
    const result = deserializeChildrenItems(saved)
    expect(result).toEqual([])
  })
})

// ── normalizeSerializedState ────────────────────────────────

describe('normalizeSerializedState', () => {
  it('passes through v2+ state unchanged', () => {
    const state: SerializedState = { _v: 2, props: { x: 1 } }
    expect(normalizeSerializedState(state)).toBe(state)
  })

  it('passes through v3 state unchanged', () => {
    const state: SerializedState = { _v: 3, props: { x: 1 } }
    expect(normalizeSerializedState(state)).toBe(state)
  })

  it('normalizes v1 state to v2', () => {
    const state: SerializedState = { _v: 1, props: { x: 1 } }
    const result = normalizeSerializedState(state)
    expect(result._v).toBe(2)
    expect(result.props).toEqual({ x: 1 })
  })

  it('normalizes state without version to v2', () => {
    const state: SerializedState = { props: { x: 1 } }
    const result = normalizeSerializedState(state)
    expect(result._v).toBe(2)
    expect(result.props).toEqual({ x: 1 })
  })

  it('preserves all fields during normalization', () => {
    const state: SerializedState = {
      props: { a: 1 },
      children: [{ t: 'text', v: 'hi' }],
      wrappers: { W: { x: 1 } },
      fixtureOverrides: { slot: { p: {}, c: '' } },
    }
    const result = normalizeSerializedState(state)
    expect(result.props).toEqual({ a: 1 })
    expect(result.children).toEqual([{ t: 'text', v: 'hi' }])
    expect(result.wrappers).toEqual({ W: { x: 1 } })
    expect(result.fixtureOverrides).toEqual({ slot: { p: {}, c: '' } })
  })
})
