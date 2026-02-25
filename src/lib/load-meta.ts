/**
 * Type-safe loader for generated meta.json files.
 * Eliminates the `as unknown as JcMeta` cast that every consumer needs.
 *
 * @example
 * import { loadMeta } from 'jc'
 * import rawMeta from '@/jc/generated/meta.json'
 * const meta = loadMeta(rawMeta)
 */
import type { JcMeta } from '../types.js'

export function loadMeta(json: unknown): JcMeta {
  return json as JcMeta
}
