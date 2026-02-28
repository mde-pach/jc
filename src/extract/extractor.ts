/**
 * Extractor interface — the pluggable seam for component metadata extraction.
 *
 * Extractors receive pre-discovered files and return component metadata.
 * The default extractor uses react-docgen-typescript; custom extractors
 * can use any strategy (ts-morph, Vue SFC parser, Svelte compiler, etc.).
 */

import type { ExtractionWarning, JcComponentMeta, JcConfig } from '../types.js'

/** Context passed to an extractor — pre-discovered files + resolved config */
export interface ExtractorContext {
  projectRoot: string
  config: JcConfig
  /** Pre-discovered files, already filtered by glob + excludeFiles */
  files: string[]
}

/** Output from an extractor — raw components before post-processing */
export interface ExtractorOutput {
  components: JcComponentMeta[]
  warnings: ExtractionWarning[]
  filesSkipped: number
}

/** A pluggable component metadata extractor */
export interface Extractor {
  name: string
  extract(ctx: ExtractorContext): ExtractorOutput
}
