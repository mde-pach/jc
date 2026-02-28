/**
 * FixtureRegistry — consolidated plugin item resolution with O(1) lookups.
 *
 * Wraps the plugin system's resolved items in a Map-backed registry
 * for O(1) lookups by qualified key. Provides a `clear()` method
 * for deterministic testing.
 */

import type { JcPlugin, JcResolvedPluginItem } from '../types.js'
import { resolvePluginItems } from './plugins.js'
import { toPascalCase } from './utils.js'

export class FixtureRegistry {
  private readonly byKey: Map<string, JcResolvedPluginItem>
  private readonly items: JcResolvedPluginItem[]

  constructor(plugins?: JcPlugin[]) {
    this.byKey = new Map()
    this.items = []

    if (plugins) {
      const resolved = resolvePluginItems(plugins)
      for (const item of resolved) {
        this.items.push(item)
        this.byKey.set(item.qualifiedKey, item)
      }
    }
  }

  /** O(1) lookup by qualified key */
  resolve(qualifiedKey: string | null | undefined): JcResolvedPluginItem | undefined {
    if (!qualifiedKey) return undefined
    return this.byKey.get(qualifiedKey)
  }

  /** Resolve a plugin item value — render or return constructor */
  renderValue(qualifiedKey: string | null | undefined, returnConstructor?: boolean): unknown {
    const item = this.resolve(qualifiedKey)
    if (!item) return undefined
    if (returnConstructor) return item.getValue()
    return item.render()
  }

  /** Get all resolved items as an array */
  getAll(): JcResolvedPluginItem[] {
    return this.items
  }

  /** Filter items by plugin name */
  listByPlugin(pluginName: string): JcResolvedPluginItem[] {
    return this.items.filter((item) => item.pluginName === pluginName)
  }

  /** Get first item key matching a plugin, or undefined */
  getDefaultKey(pluginName?: string): string | undefined {
    if (!pluginName) return this.items[0]?.qualifiedKey
    return this.listByPlugin(pluginName)[0]?.qualifiedKey
  }

  /** Convert a qualified key to a readable JSX code string */
  toCodeString(qualifiedKey: string): string {
    if (!qualifiedKey) return ''
    const item = this.byKey.get(qualifiedKey)
    if (!item) return qualifiedKey
    return `<${toPascalCase(item.label)} />`
  }

  /** Number of registered items */
  get size(): number {
    return this.items.length
  }

  /** Whether the registry has any items */
  get isEmpty(): boolean {
    return this.items.length === 0
  }

  /** Check if a qualified key exists in the registry */
  has(qualifiedKey: string): boolean {
    return this.byKey.has(qualifiedKey)
  }

  /** Clear all items (useful for tests and HMR) */
  clear(): void {
    this.byKey.clear()
    this.items.length = 0
  }
}
