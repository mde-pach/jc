import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import type { JcComponentMeta, JcMeta, JcPlugin, JcResolvedPluginItem } from '../types.js'
import {
  buildComponentFixturesPlugin,
  fixtureToCodeString,
  renderComponentFixture,
  resolveComponentFixtureItems,
} from './fixtures.js'
import {
  definePlugin,
  fromComponents,
  getDefaultItemKey,
  getItemsForPlugin,
  getItemsForProp,
  resolveItemValue,
  resolvePluginItems,
} from './plugins.js'

// ── Test plugins ───────────────────────────────────────────────

const mockPlugin: JcPlugin = {
  name: 'test',
  match: { kinds: ['icon'] },
  items: [
    { key: 'star', label: 'Star', value: 'star-value' },
    { key: 'heart', label: 'Heart', value: 'heart-value' },
    { key: 'badge', label: 'Status Badge', value: 'badge-value' },
  ],
}

const mockPlugin2: JcPlugin = {
  name: 'custom',
  match: { kinds: ['element'] },
  items: [{ key: 'logo', label: 'App Logo', value: 'logo-value' }],
}

// ── resolvePluginItems ─────────────────────────────────────────

describe('resolvePluginItems', () => {
  it('returns empty array for empty list', () => {
    expect(resolvePluginItems([])).toEqual([])
  })

  it('flattens plugins with qualified keys', () => {
    const resolved = resolvePluginItems([mockPlugin])
    expect(resolved).toHaveLength(3)
    expect(resolved[0].qualifiedKey).toBe('test/star')
    expect(resolved[0].pluginName).toBe('test')
    expect(resolved[1].qualifiedKey).toBe('test/heart')
    expect(resolved[2].qualifiedKey).toBe('test/badge')
  })

  it('merges multiple plugins', () => {
    const resolved = resolvePluginItems([mockPlugin, mockPlugin2])
    expect(resolved).toHaveLength(4)
    expect(resolved[3].qualifiedKey).toBe('custom/logo')
  })
})

// ── resolveItemValue ──────────────────────────────────────────

describe('resolveItemValue', () => {
  const resolved = resolvePluginItems([mockPlugin])

  it('returns render() result for valid key', () => {
    const result = resolveItemValue('test/star', resolved)
    expect(result).toBeDefined()
  })

  it('returns undefined for null key', () => {
    expect(resolveItemValue(null, resolved)).toBeUndefined()
  })

  it('returns undefined for undefined key', () => {
    expect(resolveItemValue(undefined, resolved)).toBeUndefined()
  })

  it('returns undefined for unknown key', () => {
    expect(resolveItemValue('test/unknown', resolved)).toBeUndefined()
  })

  it('returns getValue() when asConstructor is true', () => {
    const result = resolveItemValue('test/star', resolved, true)
    expect(result).toBe('star-value')
  })
})

// ── fixtureToCodeString ──────────────────────────────────────

describe('fixtureToCodeString', () => {
  const resolved = resolvePluginItems([mockPlugin])

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

// ── getItemsForProp ──────────────────────────────────────────

describe('getItemsForProp', () => {
  const plugins = [mockPlugin, mockPlugin2]
  const resolved = resolvePluginItems(plugins)

  it('returns all items when no specific plugin matches', () => {
    const prop = { name: 'thing', type: 'string', required: false, description: '', isChildren: false }
    const result = getItemsForProp(prop, plugins, resolved)
    expect(result).toHaveLength(4)
  })

  it('matches by componentKind', () => {
    const prop = { name: 'icon', type: 'LucideIcon', required: false, description: '', isChildren: false, componentKind: 'icon' as const }
    const result = getItemsForProp(prop, plugins, resolved)
    // mockPlugin matches 'icon' kind → 3 items
    expect(result).toHaveLength(3)
    expect(result.every((f) => f.pluginName === 'test')).toBe(true)
  })
})

// ── getDefaultItemKey ─────────────────────────────────────────

describe('getDefaultItemKey', () => {
  const plugins = [mockPlugin]
  const resolved = resolvePluginItems(plugins)

  it('returns first matching item key', () => {
    const prop = { name: 'icon', type: 'LucideIcon', required: false, description: '', isChildren: false, componentKind: 'icon' as const }
    expect(getDefaultItemKey(prop, plugins, resolved)).toBe('test/star')
  })

  it('returns undefined for empty items', () => {
    const prop = { name: 'icon', type: 'LucideIcon', required: false, description: '', isChildren: false, componentKind: 'icon' as const }
    expect(getDefaultItemKey(prop, [], [])).toBeUndefined()
  })
})

// ── definePlugin ────────────────────────────────────────────

describe('definePlugin', () => {
  it('returns a factory function that produces the plugin', () => {
    const plugin: JcPlugin = {
      name: 'test',
      match: { types: ['LucideIcon'] },
      items: [{ key: 'a', label: 'A', value: 'a' }],
    }
    const factory = definePlugin(plugin)
    expect(typeof factory).toBe('function')
    expect(factory()).toBe(plugin)
  })
})

// ── fromComponents ──────────────────────────────────────────

describe('fromComponents', () => {
  it('generates items from PascalCase exports', () => {
    const module = {
      Star: () => null,
      Heart: () => null,
      default: () => null,
      helper: 'not a component',
    }
    const items = fromComponents(module)
    expect(items).toHaveLength(2)
    expect(items[0].label).toBe('Star')
    expect(items[1].label).toBe('Heart')
  })

  it('respects custom filter', () => {
    const module = {
      Star: () => null,
      Heart: () => null,
      Zap: () => null,
    }
    const items = fromComponents(module, (key) => key !== 'Zap')
    expect(items).toHaveLength(2)
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

  const plugins = [mockPlugin]
  const resolvedItems = resolvePluginItems(plugins)

  it('returns a ReactNode for a valid component fixture', () => {
    const override = { props: { label: 'Go' }, childrenText: 'Click' }
    const node = renderComponentFixture('components/Button', override, meta, registry, plugins, resolvedItems)
    expect(node).not.toBeNull()
    expect(node).toBeDefined()
  })

  it('returns null for unknown component', () => {
    const override = { props: {}, childrenText: '' }
    const node = renderComponentFixture('components/Unknown', override, meta, registry, plugins, resolvedItems)
    expect(node).toBeNull()
  })

  it('returns null for missing registry entry', () => {
    const meta2: JcMeta = {
      ...meta,
      components: [makeComp('Card')],
    }
    const override = { props: {}, childrenText: '' }
    const node = renderComponentFixture('components/Card', override, meta2, registry, plugins, resolvedItems)
    expect(node).toBeNull()
  })
})

// ── buildComponentFixturesPlugin ────────────────────────────

describe('buildComponentFixturesPlugin', () => {
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

  const basePlugins = [mockPlugin]
  const baseItems = resolvePluginItems(basePlugins)

  it('returns a plugin with name "components"', () => {
    const plugin = buildComponentFixturesPlugin(meta, registry, basePlugins, baseItems)
    expect(plugin.name).toBe('components')
  })

  it('creates one item per component with a registry entry', () => {
    const plugin = buildComponentFixturesPlugin(meta, registry, basePlugins, baseItems)
    expect(plugin.items).toHaveLength(2)
    expect(plugin.items.map((f) => f.key)).toEqual(['Button', 'Badge'])
  })

  it('skips components without a registry entry', () => {
    const plugin = buildComponentFixturesPlugin(meta, registry, basePlugins, baseItems)
    expect(plugin.items.find((f) => f.key === 'Card')).toBeUndefined()
  })

  it('has priority -1', () => {
    const plugin = buildComponentFixturesPlugin(meta, registry, basePlugins, baseItems)
    expect(plugin.priority).toBe(-1)
  })
})

// ── resolveComponentFixtureItems ────────────────────────────

describe('resolveComponentFixtureItems', () => {
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
    components: [makeComp('Button', true), makeComp('Badge')],
  }

  const DummyButton = () => null
  const DummyBadge = () => null

  // biome-ignore lint/suspicious/noExplicitAny: test registry matches ShowcaseApp's props signature
  const registry: Record<string, () => Promise<ComponentType<any>>> = {
    Button: () => Promise.resolve(DummyButton),
    Badge: () => Promise.resolve(DummyBadge),
  }

  const basePlugins = [mockPlugin]
  const baseItems = resolvePluginItems(basePlugins)

  it('returns resolved items with qualified keys', () => {
    const items = resolveComponentFixtureItems(meta, registry, basePlugins, baseItems)
    expect(items).toHaveLength(2)
    expect(items[0].qualifiedKey).toBe('components/Button')
    expect(items[1].qualifiedKey).toBe('components/Badge')
  })

  it('items have render() that returns a ReactNode', () => {
    const items = resolveComponentFixtureItems(meta, registry, basePlugins, baseItems)
    for (const item of items) {
      const node = item.render()
      expect(node).not.toBeNull()
      expect(node).toBeDefined()
    }
  })
})
