/**
 * Plugin resolution utilities.
 *
 * Host apps provide JcPlugin[] → this module resolves them into
 * JcResolvedPluginItem[] with qualified keys ('pluginName/key')
 * and provides type-based matching to determine which plugin
 * serves which prop.
 */

import { type ComponentType, createElement, type ReactNode } from 'react'
import type { JcPlugin, JcPluginItem, JcPropMeta, JcResolvedPluginItem } from '../types.js'

// ── Plugin definition helpers ────────────────────────────────

/**
 * Identity helper for type-safe plugin definition.
 * Returns a factory function for consistency with `plugins={[lucide()]}` call pattern.
 *
 * @example
 * export const lucide = definePlugin({
 *   name: 'lucide',
 *   match: { types: ['LucideIcon'] },
 *   items: fromComponents(icons),
 * })
 */
export function definePlugin(plugin: JcPlugin): () => JcPlugin {
  return () => plugin
}

/**
 * Auto-generate plugin items from a module of component exports.
 * Filters for PascalCase function/object exports (React components).
 *
 * @example
 * import * as icons from 'lucide-react'
 * const items = fromComponents(icons)
 * // → [{ key: 'star', label: 'Star', value: Star }, ...]
 */
export function fromComponents(
  module: Record<string, unknown>,
  filter?: (key: string, value: unknown) => boolean,
): JcPluginItem[] {
  const seen = new Set<string>()
  return Object.entries(module)
    .filter(([key, value]) => {
      // Must be function or forwardRef object (React component)
      if (typeof value !== 'function' && typeof value !== 'object') return false
      if (value === null) return false
      // Must start with uppercase (PascalCase = React component convention)
      if (key[0] !== key[0].toUpperCase() || key[0] === key[0].toLowerCase()) return false
      // Skip known non-component/base exports (e.g. lucide-react's `Icon` base component)
      if (
        key === 'default' ||
        key === 'createElement' ||
        key === 'createContext' ||
        key === 'Icon' ||
        key === 'IconBase' ||
        key === 'Icons'
      ) return false
      // User filter
      if (filter && !filter(key, value)) return false
      return true
    })
    .map(([key, value]) => ({
      key: key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
      label: key,
      value,
    }))
    .filter((item) => {
      // Deduplicate by key — some libraries export aliases (e.g. ArrowDownAZ / ArrowDownAz)
      if (seen.has(item.key)) return false
      seen.add(item.key)
      return true
    })
}

// ── Plugin resolution ────────────────────────────────────────

/** Normalize a plugin or plugin factory to a JcPlugin */
export function normalizePlugin(p: JcPlugin | (() => JcPlugin)): JcPlugin {
  return typeof p === 'function' ? p() : p
}

/**
 * Flatten an array of plugins into a single resolved item list.
 * Each item receives a `qualifiedKey` ('pluginName/key') and rendering functions
 * derived from the plugin's `itemType`, `renderProps`, and `previewProps`.
 */
export function resolvePluginItems(plugins: JcPlugin[]): JcResolvedPluginItem[] {
  const resolved: JcResolvedPluginItem[] = []
  for (const plugin of plugins) {
    const renderProps = plugin.renderProps ?? {}
    const previewProps = { ...renderProps, ...(plugin.previewProps ?? {}) }
    const isComponent = (plugin.itemType ?? 'component') === 'component'

    for (const item of plugin.items) {
      resolved.push({
        ...item,
        pluginName: plugin.name,
        qualifiedKey: `${plugin.name}/${item.key}`,
        render: () =>
          isComponent
            ? createElement(item.value as ComponentType, renderProps)
            : (item.value as ReactNode),
        renderPreview: () =>
          isComponent
            ? createElement(item.value as ComponentType, previewProps)
            : (item.value as ReactNode),
        getValue: () => item.value,
      })
    }
  }
  return resolved
}

// ── Plugin matching ──────────────────────────────────────────

/**
 * Find the best-matching plugin for a given prop.
 * Scoring: type name match (+100), componentKind match (+50), prop name pattern (+25).
 * Plugin priority is added to the score. Highest score wins.
 */
export function getPluginForProp(
  prop: JcPropMeta,
  plugins: JcPlugin[],
): JcPlugin | null {
  let best: JcPlugin | null = null
  let bestScore = 0

  for (const plugin of plugins) {
    let score = 0
    const { match } = plugin

    // 1. Type name match (highest signal)
    if (match.types && match.types.length > 0) {
      for (const typeName of match.types) {
        if (
          prop.type === typeName ||
          (prop.rawType && prop.rawType.includes(typeName))
        ) {
          score += 100
          break
        }
      }
    }

    // 2. Component kind match
    if (match.kinds && match.kinds.length > 0 && prop.componentKind) {
      if (match.kinds.includes(prop.componentKind)) {
        score += 50
      }
    }

    // 3. Prop name pattern match
    if (match.propNames && match.propNames.length > 0) {
      for (const pattern of match.propNames) {
        if (new RegExp(pattern, 'i').test(prop.name)) {
          score += 25
          break
        }
      }
    }

    if (score > 0) {
      const total = score + (plugin.priority ?? 0)
      if (total > bestScore) {
        bestScore = total
        best = plugin
      }
    }
  }

  return best
}

/**
 * Get resolved items for a specific plugin from the full resolved items list.
 */
export function getItemsForPlugin(
  plugin: JcPlugin,
  resolvedItems: JcResolvedPluginItem[],
): JcResolvedPluginItem[] {
  return resolvedItems.filter((item) => item.pluginName === plugin.name)
}

/**
 * Get the resolved items matching a prop — finds the best plugin, then returns its items.
 * Returns all items if no specific plugin matches (fallback for generic node/element props).
 */
export function getItemsForProp(
  prop: JcPropMeta,
  plugins: JcPlugin[],
  resolvedItems: JcResolvedPluginItem[],
): JcResolvedPluginItem[] {
  const plugin = getPluginForProp(prop, plugins)
  if (plugin) {
    return getItemsForPlugin(plugin, resolvedItems)
  }
  // No specific match — return all items as fallback
  return resolvedItems
}

// ── Value resolution ─────────────────────────────────────────

/**
 * Look up an item by its qualified key.
 * If `asConstructor` is true, returns the raw value (component constructor).
 * Otherwise returns the rendered ReactNode via render().
 */
export function resolveItemValue(
  qualifiedKey: string | null | undefined,
  items: JcResolvedPluginItem[],
  asConstructor?: boolean,
): unknown {
  if (!qualifiedKey) return undefined
  const item = items.find((i) => i.qualifiedKey === qualifiedKey)
  if (!item) return undefined
  if (asConstructor) return item.getValue()
  return item.render()
}

/**
 * Get the first item key matching a prop, or undefined.
 * Used for auto-populating required icon props with a default value.
 */
export function getDefaultItemKey(
  prop: JcPropMeta,
  plugins: JcPlugin[],
  resolvedItems: JcResolvedPluginItem[],
): string | undefined {
  const items = getItemsForProp(prop, plugins, resolvedItems)
  return items[0]?.qualifiedKey
}
