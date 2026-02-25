/**
 * just-components (jc) — public API
 *
 * This is the main entry point. It exports everything most consumers need:
 * - ShowcaseApp: the root showcase component
 * - definePlugin / fromComponents: plugin creation helpers
 * - loadMeta: type-safe meta.json loader
 * - All public types
 *
 * For custom layouts, state management, sub-components, and internals,
 * import from 'jc/advanced'.
 */

// Root app
export { ShowcaseApp } from './components/showcase-app.js'
export type { ShowcaseRenderContext } from './components/showcase-app.js'

// Plugin system
export { definePlugin, fromComponents } from './lib/plugins.js'

// Meta loader (eliminates the `as unknown as JcMeta` cast for JSON imports)
export { loadMeta } from './lib/load-meta.js'

// Theme
export type { JcTheme } from './lib/use-theme.js'

// Types
export type {
  ChildItem,
  ExtractionResult,
  ExtractionWarning,
  JcChildrenType,
  JcComponentMeta,
  JcComponentPropKind,
  JcConfig,
  JcControlType,
  JcMeta,
  JcPlugin,
  JcPluginItem,
  JcPluginMatch,
  JcPluginPickerProps,
  JcPropMeta,
  JcResolvedPluginItem,
  JcStructuredField,
} from './types.js'
