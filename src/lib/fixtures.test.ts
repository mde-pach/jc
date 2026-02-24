import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import type { JcComponentMeta, JcFixturePlugin, JcMeta } from '../types.js'
import {
  buildComponentFixtures,
  defineFixtures,
  fixtureToCodeString,
  getDefaultFixtureKey,
  getFixturesForKind,
  renderComponentFixture,
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
  fixtures: [{ key: 'logo', label: 'App Logo', category: 'icons', render: () => 'logo-node' }],
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

  it('returns component constructor when asConstructor is true', () => {
    const MockComponent = () => null
    const pluginWithComponent: JcFixturePlugin = {
      name: 'icons',
      fixtures: [
        {
          key: 'star',
          label: 'Star',
          render: () => 'star-node',
          component: MockComponent,
        },
      ],
    }
    const resolvedWithComponent = resolveFixturePlugins([pluginWithComponent])
    expect(resolveFixtureValue('icons/star', resolvedWithComponent, true)).toBe(MockComponent)
  })

  it('falls back to render() when asConstructor is true but no component field', () => {
    expect(resolveFixtureValue('test/star', resolved, true)).toBe('star-node')
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

// ── defineFixtures ───────────────────────────────────────────

describe('defineFixtures', () => {
  it('returns the same plugin object (identity)', () => {
    const plugin: JcFixturePlugin = {
      name: 'test',
      fixtures: [{ key: 'a', label: 'A', render: () => 'a' }],
    }
    expect(defineFixtures(plugin)).toBe(plugin)
  })
})

// ── renderComponentFixture ──────────────────────────────────

describe('renderComponentFixture', () => {
  const makeComp = (name: string, acceptsChildren = false): JcComponentMeta => ({
    displayName: name,
    filePath: `src/components/${name.toLowerCase()}.tsx`,
    description: '',
    props: {
      label: { name: 'label', type: 'string', required: true, description: '', isChildren: false },
    },
    acceptsChildren,
  })

  const meta: JcMeta = {
    generatedAt: '2026-01-01',
    componentDir: 'src/components',
    components: [makeComp('Button', true)],
  }

  const DummyButton = () => null

  // biome-ignore lint/suspicious/noExplicitAny: test registry matches ShowcaseApp's props signature
  const registry: Record<string, () => Promise<ComponentType<any>>> = {
    Button: () => Promise.resolve(DummyButton),
  }

  const baseFixtures = resolveFixturePlugins([mockPlugin])

  it('returns a ReactNode for a valid component fixture', () => {
    const override = { props: { label: 'Go' }, childrenText: 'Click' }
    const node = renderComponentFixture('components/Button', override, meta, registry, baseFixtures)
    expect(node).not.toBeNull()
    expect(node).toBeDefined()
  })

  it('returns null for unknown component', () => {
    const override = { props: {}, childrenText: '' }
    const node = renderComponentFixture(
      'components/Unknown',
      override,
      meta,
      registry,
      baseFixtures,
    )
    expect(node).toBeNull()
  })

  it('returns null for missing registry entry', () => {
    const meta2: JcMeta = {
      ...meta,
      components: [makeComp('Card')],
    }
    const override = { props: {}, childrenText: '' }
    const node = renderComponentFixture('components/Card', override, meta2, registry, baseFixtures)
    expect(node).toBeNull()
  })
})

// ── buildComponentFixtures ──────────────────────────────────

describe('buildComponentFixtures', () => {
  const makeComp = (name: string, acceptsChildren = false): JcComponentMeta => ({
    displayName: name,
    filePath: `src/components/${name.toLowerCase()}.tsx`,
    description: '',
    props: {
      label: { name: 'label', type: 'string', required: true, description: '', isChildren: false },
    },
    acceptsChildren,
  })

  const meta: JcMeta = {
    generatedAt: '2026-01-01',
    componentDir: 'src/components',
    components: [makeComp('Button', true), makeComp('Badge'), makeComp('Card')],
  }

  const DummyButton = () => null
  const DummyBadge = () => null

  // biome-ignore lint/suspicious/noExplicitAny: test registry matches ShowcaseApp's props signature
  const registry: Record<string, () => Promise<ComponentType<any>>> = {
    Button: () => Promise.resolve(DummyButton),
    Badge: () => Promise.resolve(DummyBadge),
    // Card intentionally missing from registry
  }

  const baseFixtures = resolveFixturePlugins([mockPlugin])

  it('returns a plugin with name "components"', () => {
    const plugin = buildComponentFixtures(meta, registry, baseFixtures)
    expect(plugin.name).toBe('components')
  })

  it('creates one fixture per component with a registry entry', () => {
    const plugin = buildComponentFixtures(meta, registry, baseFixtures)
    expect(plugin.fixtures).toHaveLength(2)
    expect(plugin.fixtures.map((f) => f.key)).toEqual(['Button', 'Badge'])
  })

  it('skips components without a registry entry', () => {
    const plugin = buildComponentFixtures(meta, registry, baseFixtures)
    expect(plugin.fixtures.find((f) => f.key === 'Card')).toBeUndefined()
  })

  it('each fixture has correct key, label, and category', () => {
    const plugin = buildComponentFixtures(meta, registry, baseFixtures)
    for (const fixture of plugin.fixtures) {
      expect(fixture.label).toBe(fixture.key)
      expect(fixture.category).toBe('components')
    }
  })

  it('render() returns a ReactNode (not null)', () => {
    const plugin = buildComponentFixtures(meta, registry, baseFixtures)
    for (const fixture of plugin.fixtures) {
      const node = fixture.render()
      expect(node).not.toBeNull()
      expect(node).toBeDefined()
    }
  })
})
