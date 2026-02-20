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

/** Categories for component-type props */
export type JcComponentPropKind = 'icon' | 'element' | 'node'

/** Resolved control definition for a prop */
export interface JcControl {
  propName: string
  controlType: JcControlType
  label: string
  description: string
  required: boolean
  defaultValue: unknown
  options?: string[]
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
}
