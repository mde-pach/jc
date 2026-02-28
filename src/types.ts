import type { ReactNode } from 'react'

/** A single field inside a structured object/array-of-objects prop */
export interface JcStructuredField {
  name: string
  type: string
  optional: boolean
  /** True when the field type is a component (ReactNode, ReactElement, ComponentType, etc.) */
  isComponent: boolean
  /** Component sub-kind for React-native types */
  componentKind?: JcComponentPropKind
  /** Enum values when the field type is a string literal union */
  values?: string[]
  /** Nested structured fields when the field itself is an object type */
  fields?: JcStructuredField[]
}

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
  /**
   * Structured field metadata for object and array-of-objects props.
   * Extracted at CLI time from the TypeScript type checker — no runtime parsing needed.
   * For array props (e.g. `Metric[]`), these are the fields of each array item.
   * For object props (e.g. `ContactInfo`), these are the top-level fields.
   */
  structuredFields?: JcStructuredField[]
}

/** A single child parsed from an @example JSX block */
export interface JcExampleChild {
  type: 'text' | 'element'
  /** Text content for 'text' type, tag name for 'element' type */
  value: string
  /** Props on the JSX element (only for 'element' type) */
  props?: Record<string, string>
  /** Inner text of the JSX element (only for 'element' type) */
  innerText?: string
}

/** A parsed @example preset — prop values the user can toggle to */
export interface JcExamplePreset {
  /** Index of the @example block this came from */
  index: number
  /** Optional label from `@example Label text` syntax */
  label?: string
  /** Props extracted from the subject element as string key-value pairs */
  propValues: Record<string, string>
  /** Text content of the subject element's children (legacy fallback) */
  childrenText: string
  /** Structured children preserving JSX elements from the @example */
  parsedChildren?: JcExampleChild[]
  /** Per-wrapper props from the @example block */
  wrapperProps: Record<string, Record<string, string>>
}

/** Type of children a component accepts (extracted from the TypeScript type system) */
export type JcChildrenType = 'node' | 'string' | 'element' | 'function'

/** Metadata for a single exported component */
export interface JcComponentMeta {
  displayName: string
  filePath: string
  description: string
  props: Record<string, JcPropMeta>
  acceptsChildren: boolean
  /** Specific type of children accepted (ReactNode, string, ReactElement, render prop) */
  childrenType?: JcChildrenType
  /** Whether the component is a default export or named export */
  exportType?: 'named' | 'default'
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
  | 'object'
  | 'color'

/** Categories for component-type props (React-native types only — plugins handle library-specific kinds) */
export type JcComponentPropKind = 'element' | 'node'

// ── Plugin system types ──────────────────────────────────────
//
// Plugins let the host app supply real components (icons, badges, etc.)
// to the showcase. Each plugin declares which prop types it handles via
// `match`, provides items (fixtures), and optionally a custom picker UI.
// Items are resolved to qualified keys ('pluginName/key') used as stable
// identifiers in prop values.

/** How a plugin declares which props it can serve */
export interface JcPluginMatch {
  /**
   * Type names this plugin handles.
   * Matched against JcPropMeta.rawType and JcPropMeta.type.
   * e.g. ['LucideIcon'] matches any prop typed `LucideIcon`.
   */
  types?: string[]
  /**
   * Component kinds this plugin handles.
   * Matched against JcPropMeta.componentKind.
   * e.g. ['element'] matches any prop with componentKind 'element'.
   */
  kinds?: JcComponentPropKind[]
  /**
   * Prop name patterns (regex strings) this plugin handles.
   * e.g. ['^icon$', 'Icon$'] matches props named "icon" or ending in "Icon".
   */
  propNames?: string[]
}

/** A single item provided by a plugin */
export interface JcPluginItem {
  /** Unique within the plugin, e.g. 'star' */
  key: string
  /** Human-readable display name, e.g. 'Star' */
  label: string
  /**
   * The actual value — a React component constructor, rendered element, etc.
   * For constructor plugins (valueMode: 'constructor'): the component constructor (e.g. Star).
   * For element plugins (valueMode: 'element'): a ReactNode value.
   */
  value: unknown
  /** Optional search keywords for filtering in the picker */
  keywords?: string[]
}

/** A resolved plugin item with rendering capabilities (computed internally) */
export interface JcResolvedPluginItem extends JcPluginItem {
  /** Name of the plugin that owns this item */
  pluginName: string
  /** Fully qualified key in 'pluginName/key' format, e.g. 'lucide/star' */
  qualifiedKey: string
  /** Render at full size for preview */
  render(): ReactNode
  /** Render at small/compact size for picker grids and thumbnails */
  renderPreview(): ReactNode
  /** Get the raw value (component constructor, etc.) */
  getValue(): unknown
}

/**
 * Props passed to custom plugin picker components.
 * When a plugin provides a `Picker`, this is the interface it receives.
 *
 * Plugin authors build their own pickers and can use jc's exported
 * primitives (e.g. `GridPicker`) as building blocks.
 */
export interface JcPluginPickerProps {
  items: JcResolvedPluginItem[]
  value: string
  required: boolean
  onChange: (qualifiedKey: string) => void
}

/**
 * Plugin definition — created via `definePlugin()`.
 *
 * @example
 * const lucide = definePlugin({
 *   name: 'lucide',
 *   match: { types: ['LucideIcon'] },
 *   importPath: 'lucide-react',
 *   renderProps: { size: 20 },
 *   previewProps: { size: 14 },
 *   items: fromComponents(icons),
 * })
 */
export interface JcPlugin {
  /** Unique plugin name, used as namespace prefix */
  name: string
  /** Declares which props this plugin handles */
  match: JcPluginMatch
  /** The items this plugin provides */
  items: JcPluginItem[]
  /**
   * Import path for code generation, e.g. 'lucide-react'.
   * Defaults to the plugin name.
   */
  importPath?: string
  /**
   * How items are rendered and resolved to prop values:
   * - `'render'`: Component constructors. `createElement` for previews,
   *   rendered elements for props. (default)
   * - `'constructor'`: Component constructors. `createElement` for previews,
   *   raw constructors for props (e.g. LucideIcon).
   * - `'element'`: Already ReactNode values. Used as-is for both.
   */
  valueMode?: 'render' | 'constructor' | 'element'
  /**
   * Default props passed to component items when rendering at full size.
   * e.g. { size: 20 }. Only used when valueMode is 'render' or 'constructor'.
   */
  renderProps?: Record<string, unknown>
  /**
   * Props for the compact preview (picker grids, thumbnails).
   * Merged on top of renderProps. e.g. { size: 14 }.
   */
  previewProps?: Record<string, unknown>
  /**
   * Optional custom picker component.
   * When provided, replaces the default dropdown for this plugin's props.
   * Receives `JcPluginPickerProps` (items, value, required, onChange).
   */
  Picker?: React.ComponentType<JcPluginPickerProps>
  /**
   * Priority for conflict resolution (higher wins).
   * Default: 0. Built-in component fixtures use -1.
   */
  priority?: number
}

/**
 * A single children item — text content or a fixture reference.
 *
 * Unlike prop values (which use plain strings as fixture keys, resolved
 * via componentKind metadata), children items need an explicit discriminator
 * because children have no type metadata and text/fixture values are ambiguous.
 */
export interface ChildItem {
  type: 'text' | 'fixture' | 'element'
  /** Plain text when type='text', fixture qualified key when type='fixture', tag name when type='element' */
  value: string
  /** Props on the element (only for type='element') */
  elementProps?: Record<string, string>
  /** Nested children inside the element (only for type='element') */
  elementChildren?: ChildItem[]
}

// ── Extraction warnings ──────────────────────────────────────

/** A warning emitted during the extraction pipeline */
export type ExtractionWarning =
  | { type: 'FILE_PARSE_ERROR'; file: string; error: string }
  | { type: 'FILE_SKIPPED'; file: string; reason: string }
  | { type: 'PROP_FALLBACK'; component: string; prop: string; from: 'ast' | 'regex' }
  | { type: 'COMPONENT_SKIPPED'; component: string; reason: string }

/** Extraction result with metadata and warnings */
export interface ExtractionResult {
  meta: JcMeta
  warnings: ExtractionWarning[]
  stats: {
    filesScanned: number
    filesSkipped: number
    componentsBefore: number
    componentsAfter: number
  }
}

/** User-provided configuration */
export interface JcConfig {
  /** Glob pattern for component files (relative to project root) */
  componentGlob: string
  /**
   * Multiple glob patterns for component files.
   * When set, all patterns are used and results deduplicated.
   * Takes precedence over `componentGlob` when both are set.
   */
  componentGlobs?: string[]
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
  /**
   * Custom type-to-componentKind mappings.
   * Checked before the built-in patterns, allowing users to teach jc
   * about project-specific component types.
   * @example { 'CustomSlot': 'element', 'MyNode': 'node' }
   */
  componentTypeMap?: Record<string, JcComponentPropKind>
  /**
   * Component metadata extractor.
   * Use `'react-docgen'` (default) for the built-in react-docgen-typescript extractor,
   * or provide a custom `Extractor` object for alternative extraction strategies.
   * @default 'react-docgen'
   */
  extractor?: 'react-docgen' | import('./extract/extractor.js').Extractor
}
