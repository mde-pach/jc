/** Convert a label string to PascalCase (e.g. "status badge" → "StatusBadge") */
export function toPascalCase(label: string): string {
  return label
    .split(/[\s-]+/)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
}

/** Apply path alias mapping: replace source prefixes with alias prefixes */
export function applyPathAlias(filePath: string, pathAlias: Record<string, string>): string {
  for (const [alias, sourcePrefix] of Object.entries(pathAlias)) {
    if (filePath.startsWith(sourcePrefix)) {
      return alias + filePath.slice(sourcePrefix.length)
    }
  }
  return filePath
}

// ── Magic string constants ────────────────────────────────────
//
// Centralized discriminators used across multiple files.
// Change once here → update everywhere.

/** Prefix for component fixture qualified keys, e.g. 'components/Button' */
export const COMPONENT_FIXTURE_PREFIX = 'components/' as const

/** Category name for auto-generated component fixtures */
export const COMPONENT_FIXTURE_CATEGORY = 'components' as const

/** Hash prefix for URL-serialized state */
export const URL_HASH_PREFIX = '#s=' as const

/** Synthetic prop names used by the eager loader to separate internal/external props */
export const EAGER_LOADER_PROPS_KEY = '__jcProps' as const
export const EAGER_LOADER_CHILDREN_KEY = '__jcChildren' as const

// ── Slot key helpers ──────────────────────────────────────────
//
// Fixture overrides are keyed by slot: "prop:variantName" or "children:0".
// These helpers centralize creation and parsing — no more split(':') scattered.

export type SlotKey = { type: 'prop'; name: string } | { type: 'children'; index: number }

export function toSlotKeyString(key: SlotKey): string {
  return key.type === 'prop' ? `prop:${key.name}` : `children:${key.index}`
}

export function parseSlotKey(str: string): SlotKey | null {
  if (str.startsWith('prop:')) {
    return { type: 'prop', name: str.slice(5) }
  }
  if (str.startsWith('children:')) {
    const idx = Number.parseInt(str.slice(9), 10)
    if (!Number.isNaN(idx)) return { type: 'children', index: idx }
  }
  return null
}
