/**
 * jc/plugins/lucide — Zero-config Lucide icon plugin.
 *
 * Usage:
 * ```ts
 * import { lucidePlugin } from 'jc/plugins/lucide'
 *
 * <ShowcaseApp plugins={[lucidePlugin()]} ... />
 * ```
 *
 * Requires `lucide-react` as a peer dependency.
 */

import { definePlugin, fromComponents } from '../../lib/plugins.js'
import { GridPicker } from '../../components/field/grid-picker.js'
import * as icons from 'lucide-react'

export interface LucidePluginOptions {
  /** Override render size (default: 20) */
  size?: number
  /** Override preview size (default: 14) */
  previewSize?: number
  /** Override Picker component */
  Picker?: React.ComponentType<import('../../types.js').JcPluginPickerProps>
}

/** Cached items — `fromComponents(icons)` is expensive, only compute once */
let cachedItems: ReturnType<typeof fromComponents> | undefined

function getLucideItems() {
  if (!cachedItems) {
    cachedItems = fromComponents(icons)
  }
  return cachedItems
}

/**
 * Create a lucide plugin with custom options.
 *
 * @example
 * // Default (same as lucidePlugin()):
 * lucide()
 *
 * // Custom size:
 * lucide({ size: 24, previewSize: 16 })
 */
export function lucide(options?: LucidePluginOptions) {
  return definePlugin({
    name: 'lucide',
    match: { types: ['LucideIcon'] },
    importPath: 'lucide-react',
    renderProps: { size: options?.size ?? 20 },
    previewProps: { size: options?.previewSize ?? 14 },
    valueMode: 'constructor',
    items: getLucideItems(),
    Picker: options?.Picker ?? GridPicker,
  })
}

/** Zero-config lucide plugin factory — equivalent to `lucide()` */
export const lucidePlugin = lucide()
