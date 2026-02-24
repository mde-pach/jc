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

/** A parsed @example preset — prop values the user can toggle to */
export interface JcExamplePreset {
  /** Index of the @example block this came from */
  index: number
  /** Props extracted from the subject element as string key-value pairs */
  propValues: Record<string, string>
  /** Text content of the subject element's children (empty if none) */
  childrenText: string
  /** Per-wrapper props from the @example block */
  wrapperProps: Record<string, Record<string, string>>
}

/** Metadata for a single exported component */
export interface JcComponentMeta {
  displayName: string
  filePath: string
  description: string
  props: Record<string, JcPropMeta>
  acceptsChildren: boolean
  /** Usage counts across the project (populated by extract) */
  usageCount?: {
    direct: number
    indirect: number
    total: number
  }
  /** JSDoc tags extracted from the component's doc comment */
  tags?: Record<string, string[]>
  /** Auto-detected wrapper components from @example blocks (outermost first) */
  wrapperComponents?: {
    displayName: string
    defaultProps: Record<string, string>
  }[]
  /** Parsed @example presets — each block becomes a selectable preset in the UI */
  examples?: JcExamplePreset[]
}

/** Full extraction output */
export interface JcMeta {
  generatedAt: string
  componentDir: string
  components: JcComponentMeta[]
  /** Path alias mapping for generating import statements in the showcase UI */
  pathAlias?: Record<string, string>
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

/** A single children item — text content or a fixture reference */
export interface ChildItem {
  type: 'text' | 'fixture'
  /** Plain text when type='text', fixture qualified key when type='fixture' */
  value: string
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
