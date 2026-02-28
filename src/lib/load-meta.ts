/**
 * Type-safe loader for generated meta.json files.
 * Eliminates the `as unknown as JcMeta` cast that every consumer needs.
 *
 * Performs basic structural validation to catch mismatched versions
 * or corrupted files early with a clear error message.
 *
 * @example
 * import { loadMeta } from 'jc'
 * import rawMeta from '@/jc/generated/meta.json'
 * const meta = loadMeta(rawMeta)
 */
import type { JcMeta } from '../types.js'

export function loadMeta(json: unknown): JcMeta {
  if (!json || typeof json !== 'object') {
    throw new Error('[jc] loadMeta: expected an object, got ' + typeof json)
  }
  const obj = json as Record<string, unknown>
  if (!Array.isArray(obj.components)) {
    throw new Error(
      '[jc] loadMeta: missing or invalid "components" array. ' +
      'Make sure to run `npx jc extract` to generate meta.json.',
    )
  }
  return json as JcMeta
}
