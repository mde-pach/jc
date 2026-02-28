import { describe, expect, it } from 'vitest'
import type { JcPlugin, JcResolvedPluginItem } from '../types.js'
import { FixtureRegistry } from './fixture-registry.js'

// ── Test plugins ───────────────────────────────────────────────

const iconsPlugin: JcPlugin = {
  name: 'lucide',
  match: { types: ['LucideIcon'] },
  items: [
    { key: 'star', label: 'Star', value: 'star-comp' },
    { key: 'heart', label: 'Heart', value: 'heart-comp' },
    { key: 'zap', label: 'Zap', value: 'zap-comp' },
  ],
}

const componentsPlugin: JcPlugin = {
  name: 'components',
  match: { kinds: ['element', 'node'] },
  items: [
    { key: 'badge', label: 'Badge', value: 'badge-comp' },
    { key: 'tag', label: 'Tag', value: 'tag-comp' },
  ],
}

const uncategorizedPlugin: JcPlugin = {
  name: 'misc',
  match: {},
  items: [
    { key: 'widget', label: 'Widget', value: 'widget-comp' },
  ],
}

// ── Constructor ────────────────────────────────────────────────

describe('FixtureRegistry', () => {
  it('creates an empty registry with no plugins', () => {
    const reg = new FixtureRegistry()
    expect(reg.size).toBe(0)
    expect(reg.isEmpty).toBe(true)
  })

  it('creates a registry with empty plugins array', () => {
    const reg = new FixtureRegistry([])
    expect(reg.size).toBe(0)
    expect(reg.isEmpty).toBe(true)
  })

  it('populates from plugins', () => {
    const reg = new FixtureRegistry([iconsPlugin])
    expect(reg.size).toBe(3)
    expect(reg.isEmpty).toBe(false)
  })

  it('merges multiple plugins', () => {
    const reg = new FixtureRegistry([iconsPlugin, componentsPlugin])
    expect(reg.size).toBe(5)
  })

  // ── resolve ────────────────────────────────────────────────

  describe('resolve', () => {
    const reg = new FixtureRegistry([iconsPlugin, componentsPlugin])

    it('finds item by qualified key', () => {
      const item = reg.resolve('lucide/star')
      expect(item).toBeDefined()
      expect(item!.label).toBe('Star')
      expect(item!.pluginName).toBe('lucide')
    })

    it('returns undefined for null', () => {
      expect(reg.resolve(null)).toBeUndefined()
    })

    it('returns undefined for undefined', () => {
      expect(reg.resolve(undefined)).toBeUndefined()
    })

    it('returns undefined for unknown key', () => {
      expect(reg.resolve('lucide/unknown')).toBeUndefined()
    })
  })

  // ── renderValue ────────────────────────────────────────────

  describe('renderValue', () => {
    const reg = new FixtureRegistry([iconsPlugin])

    it('returns render() result', () => {
      const result = reg.renderValue('lucide/star')
      expect(result).toBeDefined()
    })

    it('returns getValue() when asConstructor is true', () => {
      const result = reg.renderValue('lucide/star', true)
      expect(result).toBe('star-comp')
    })

    it('returns undefined for null key', () => {
      expect(reg.renderValue(null)).toBeUndefined()
    })

    it('returns undefined for unknown key', () => {
      expect(reg.renderValue('lucide/unknown')).toBeUndefined()
    })
  })

  // ── getAll ─────────────────────────────────────────────────

  describe('getAll', () => {
    it('returns all resolved items as array', () => {
      const reg = new FixtureRegistry([iconsPlugin, componentsPlugin])
      expect(reg.getAll()).toHaveLength(5)
    })

    it('returns empty array for empty registry', () => {
      const reg = new FixtureRegistry()
      expect(reg.getAll()).toEqual([])
    })
  })

  // ── listByPlugin ───────────────────────────────────────────

  describe('listByPlugin', () => {
    const reg = new FixtureRegistry([iconsPlugin, componentsPlugin])

    it('filters by plugin name', () => {
      const items = reg.listByPlugin('lucide')
      expect(items).toHaveLength(3)
      expect(items.every((f) => f.pluginName === 'lucide')).toBe(true)
    })

    it('returns empty for unknown plugin', () => {
      expect(reg.listByPlugin('nonexistent')).toHaveLength(0)
    })
  })

  // ── getDefaultKey ──────────────────────────────────────────

  describe('getDefaultKey', () => {
    const reg = new FixtureRegistry([iconsPlugin, componentsPlugin])

    it('returns first item of named plugin', () => {
      expect(reg.getDefaultKey('lucide')).toBe('lucide/star')
    })

    it('returns first item overall when no plugin specified', () => {
      expect(reg.getDefaultKey()).toBe('lucide/star')
    })

    it('returns undefined for empty registry', () => {
      const emptyReg = new FixtureRegistry()
      expect(emptyReg.getDefaultKey()).toBeUndefined()
    })
  })

  // ── toCodeString ───────────────────────────────────────────

  describe('toCodeString', () => {
    const reg = new FixtureRegistry([iconsPlugin])

    it('converts to PascalCase JSX', () => {
      expect(reg.toCodeString('lucide/star')).toBe('<Star />')
    })

    it('returns original key for unknown', () => {
      expect(reg.toCodeString('lucide/unknown')).toBe('lucide/unknown')
    })
  })

  // ── has ────────────────────────────────────────────────────

  describe('has', () => {
    const reg = new FixtureRegistry([iconsPlugin])

    it('returns true for existing key', () => {
      expect(reg.has('lucide/star')).toBe(true)
    })

    it('returns false for missing key', () => {
      expect(reg.has('lucide/unknown')).toBe(false)
    })
  })

  // ── clear ──────────────────────────────────────────────────

  describe('clear', () => {
    it('removes all items', () => {
      const reg = new FixtureRegistry([iconsPlugin])
      expect(reg.size).toBe(3)
      reg.clear()
      expect(reg.size).toBe(0)
      expect(reg.isEmpty).toBe(true)
      expect(reg.resolve('lucide/star')).toBeUndefined()
    })
  })
})
