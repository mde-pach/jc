import { describe, expect, it } from 'vitest'
import { lucide, lucidePlugin } from './index.js'

// ── lucidePlugin ────────────────────────────────────────────

describe('lucidePlugin', () => {
  it('is a factory function', () => {
    expect(typeof lucidePlugin).toBe('function')
  })

  it('produces a plugin with name "lucide"', () => {
    const plugin = lucidePlugin()
    expect(plugin.name).toBe('lucide')
  })

  it('matches LucideIcon type', () => {
    const plugin = lucidePlugin()
    expect(plugin.match.types).toContain('LucideIcon')
  })

  it('uses constructor valueMode', () => {
    const plugin = lucidePlugin()
    expect(plugin.valueMode).toBe('constructor')
  })

  it('sets importPath to lucide-react', () => {
    const plugin = lucidePlugin()
    expect(plugin.importPath).toBe('lucide-react')
  })

  it('has non-empty items from lucide-react', () => {
    const plugin = lucidePlugin()
    expect(plugin.items.length).toBeGreaterThan(100)
  })

  it('has default render size of 20', () => {
    const plugin = lucidePlugin()
    expect(plugin.renderProps).toEqual({ size: 20 })
  })

  it('has default preview size of 14', () => {
    const plugin = lucidePlugin()
    expect(plugin.previewProps).toEqual({ size: 14 })
  })

  it('has a Picker component', () => {
    const plugin = lucidePlugin()
    expect(plugin.Picker).toBeDefined()
  })

  it('items have key and label', () => {
    const plugin = lucidePlugin()
    const first = plugin.items[0]
    expect(first).toHaveProperty('key')
    expect(first).toHaveProperty('label')
    expect(first).toHaveProperty('value')
    expect(typeof first.key).toBe('string')
    expect(typeof first.label).toBe('string')
  })
})

// ── lucide (custom options) ─────────────────────────────────

describe('lucide', () => {
  it('returns a factory function', () => {
    const factory = lucide()
    expect(typeof factory).toBe('function')
  })

  it('uses default sizes when no options given', () => {
    const plugin = lucide()()
    expect(plugin.renderProps).toEqual({ size: 20 })
    expect(plugin.previewProps).toEqual({ size: 14 })
  })

  it('applies custom size', () => {
    const plugin = lucide({ size: 32 })()
    expect(plugin.renderProps).toEqual({ size: 32 })
  })

  it('applies custom previewSize', () => {
    const plugin = lucide({ previewSize: 18 })()
    expect(plugin.previewProps).toEqual({ size: 18 })
  })

  it('applies both custom sizes', () => {
    const plugin = lucide({ size: 48, previewSize: 24 })()
    expect(plugin.renderProps).toEqual({ size: 48 })
    expect(plugin.previewProps).toEqual({ size: 24 })
  })

  it('preserves core plugin properties', () => {
    const plugin = lucide({ size: 32 })()
    expect(plugin.name).toBe('lucide')
    expect(plugin.match.types).toContain('LucideIcon')
    expect(plugin.valueMode).toBe('constructor')
    expect(plugin.importPath).toBe('lucide-react')
    expect(plugin.items.length).toBeGreaterThan(100)
  })
})
