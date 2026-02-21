import type { ReactNode } from 'react'

/** Metadata for a single component prop */
export interface JcPropMeta {
  name: string
  type: string
  rawType?: string
  values?: string[]
  required: boolean
  defaultValue?: string
  description: string
  isChildren: boolean
  /** Set when the prop accepts a React component/element/node */
  componentKind?: JcComponentPropKind
}

/** Metadata for a single exported component */
export interface JcComponentMeta {
  displayName: string
  filePath: string
  description: string
  props: Record<string, JcPropMeta>
  acceptsChildren: boolean
}

/** Full extraction output */
export interface JcMeta {
  generatedAt: string
  componentDir: string
  components: JcComponentMeta[]
}

/** Control type for the UI prop editor */
export type JcControlType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiline'
  | 'json'
  | 'readonly'
  | 'component'
  | 'array'

/** Categories for component-type props */
export type JcComponentPropKind = 'icon' | 'element' | 'node'

// ── Fixture plugin types ─────────────────────────────────────
//
// Fixtures let the host app supply real components (icons, badges, etc.)
// to the showcase instead of relying on hardcoded SVG placeholders.
// The host registers one or more JcFixturePlugin instances; internally
// they are flattened into JcResolvedFixture[] with qualified keys
// (e.g. 'lucide/star') used as stable identifiers in prop values.

/**
 * A single fixture item provided by a plugin.
 *
 * @example
 * { key: 'star', label: 'Star', category: 'icons',
 *   render: () => <Star size={20} />,
 *   renderIcon: () => <Star size={14} /> }
 */
export interface JcFixture {
  /** Unique within the plugin, e.g. 'star', 'heart' */
  key: string
  /** Human-readable display name, e.g. 'Star' */
  label: string
  /** Optional grouping used to filter fixtures by componentKind, e.g. 'icons' */
  category?: string
  /** Renders the fixture at full size for the preview area */
  render: () => ReactNode
  /** Optional small preview (14-16px) for the picker grid; falls back to render() */
  renderIcon?: () => ReactNode
  /**
   * Optional raw component constructor for icon-kind props (e.g. LucideIcon).
   * When a prop expects a component type rather than a rendered element,
   * this value is passed instead of calling render().
   */
  component?: React.ComponentType<any>
}

/**
 * A fixture plugin provided by the host app.
 * Create one with `defineFixtures()` for type safety.
 *
 * @example
 * const lucide = defineFixtures({
 *   name: 'lucide',
 *   fixtures: [{ key: 'star', label: 'Star', ... }],
 * })
 */
export interface JcFixturePlugin {
  /** Unique plugin name, used as namespace prefix, e.g. 'lucide' */
  name: string
  /** The fixture items this plugin provides */
  fixtures: JcFixture[]
}

/**
 * A fixture enriched with its plugin origin and a fully qualified key.
 * Produced by `resolveFixturePlugins()` — not created by the host directly.
 */
export interface JcResolvedFixture extends JcFixture {
  /** Name of the plugin that owns this fixture */
  pluginName: string
  /** Fully qualified key in 'pluginName/key' format, e.g. 'lucide/star' */
  qualifiedKey: string
}

/** User-provided configuration */
export interface JcConfig {
  /** Glob pattern for component files (relative to project root) */
  componentGlob: string
  /** Files to exclude from extraction (basenames) */
  excludeFiles?: string[]
  /** Components to exclude by display name */
  excludeComponents?: string[]
  /** Props to always filter out */
  filteredProps?: string[]
  /** Prop name regex patterns to filter */
  filteredPropPatterns?: string[]
  /** Output directory for generated files (relative to project root) */
  outputDir: string
  /**
   * Path alias mapping for generated registry imports.
   * Keys are the alias prefix, values are the source directory prefix they replace.
   * @default { '@/': 'src/' }
   * @example { '~/': 'src/', '@components/': 'src/components/' }
   */
  pathAlias?: Record<string, string>
}
