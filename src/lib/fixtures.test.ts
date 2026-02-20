import { describe, expect, it } from 'vitest'
import type { JcFixturePlugin, JcResolvedFixture } from '../types.js'
import {
  fixtureToCodeString,
  getDefaultFixtureKey,
  getFixturesForKind,
  resolveFixturePlugins,
  resolveFixtureValue,
} from './fixtures.js'

const mockPlugin: JcFixturePlugin = {
  name: 'test',
  fixtures: [
    { key: 'star', label: 'Star', category: 'icons', render: () => 'star-node' },
    { key: 'heart', label: 'Heart', category: 'icons', render: () => 'heart-node' },
    { key: 'badge', label: 'Status Badge', category: 'elements', render: () => 'badge-node' },
  ],
}

const mockPlugin2: JcFixturePlugin = {
  name: 'custom',
  fixtures: [
    { key: 'logo', label: 'App Logo', category: 'icons', render: () => 'logo-node' },
  ],
}

// ── resolveFixturePlugins ─────────────────────────────────────

describe('resolveFixturePlugins', () => {
  it('returns empty array for undefined', () => {
    expect(resolveFixturePlugins(undefined)).toEqual([])
  })

  it('returns empty array for empty list', () => {
    expect(resolveFixturePlugins([])).toEqual([])
  })

  it('flattens plugins with qualified keys', () => {
    const resolved = resolveFixturePlugins([mockPlugin])
    expect(resolved).toHaveLength(3)
    expect(resolved[0].qualifiedKey).toBe('test/star')
    expect(resolved[0].pluginName).toBe('test')
    expect(resolved[1].qualifiedKey).toBe('test/heart')
    expect(resolved[2].qualifiedKey).toBe('test/badge')
  })

  it('merges multiple plugins', () => {
    const resolved = resolveFixturePlugins([mockPlugin, mockPlugin2])
    expect(resolved).toHaveLength(4)
    expect(resolved[3].qualifiedKey).toBe('custom/logo')
  })
})

// ── resolveFixtureValue ───────────────────────────────────────

describe('resolveFixtureValue', () => {
  const resolved = resolveFixturePlugins([mockPlugin])

  it('returns render() result for valid key', () => {
    expect(resolveFixtureValue('test/star', resolved)).toBe('star-node')
  })

  it('returns undefined for null key', () => {
    expect(resolveFixtureValue(null, resolved)).toBeUndefined()
  })

  it('returns undefined for undefined key', () => {
    expect(resolveFixtureValue(undefined, resolved)).toBeUndefined()
  })

  it('returns undefined for unknown key', () => {
    expect(resolveFixtureValue('test/unknown', resolved)).toBeUndefined()
  })
})

// ── fixtureToCodeString ───────────────────────────────────────

describe('fixtureToCodeString', () => {
  const resolved = resolveFixturePlugins([mockPlugin])

  it('converts label to PascalCase JSX', () => {
    expect(fixtureToCodeString('test/star', resolved)).toBe('<Star />')
  })

  it('handles multi-word labels', () => {
    expect(fixtureToCodeString('test/badge', resolved)).toBe('<StatusBadge />')
  })

  it('returns key for unknown fixture', () => {
    expect(fixtureToCodeString('test/unknown', resolved)).toBe('test/unknown')
  })
})

// ── getFixturesForKind ────────────────────────────────────────

describe('getFixturesForKind', () => {
  const resolved = resolveFixturePlugins([mockPlugin])

  it('returns all fixtures when no kind specified', () => {
    expect(getFixturesForKind(resolved)).toHaveLength(3)
  })

  it('filters by kind with singular/plural tolerance', () => {
    const icons = getFixturesForKind(resolved, 'icon')
    expect(icons).toHaveLength(2)
    expect(icons.every((f) => f.category === 'icons')).toBe(true)
  })

  it('filters by exact category match', () => {
    const elements = getFixturesForKind(resolved, 'elements')
    // 'elements' matches 'elements' exactly, plus fixtures without category
    expect(elements.some((f) => f.key === 'badge')).toBe(true)
  })

  it('falls back to all fixtures when no category matches', () => {
    const result = getFixturesForKind(resolved, 'nonexistent')
    expect(result).toHaveLength(3)
  })
})

// ── getDefaultFixtureKey ──────────────────────────────────────

describe('getDefaultFixtureKey', () => {
  const resolved = resolveFixturePlugins([mockPlugin])

  it('returns first matching fixture key for kind', () => {
    expect(getDefaultFixtureKey(resolved, 'icon')).toBe('test/star')
  })

  it('returns first fixture key when no kind', () => {
    expect(getDefaultFixtureKey(resolved)).toBe('test/star')
  })

  it('returns undefined for empty fixtures', () => {
    expect(getDefaultFixtureKey([], 'icon')).toBeUndefined()
  })
})
