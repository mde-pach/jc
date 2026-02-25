/**
 * URL synchronization utilities for the showcase app.
 * Handles reading/writing query params and hash-based state serialization.
 */

import type { ChildItem } from '../types.js'
import type { FixtureOverride } from './showcase-reducer.js'
import { URL_HASH_PREFIX } from './utils.js'

/** Current serialization format version */
const CURRENT_VERSION = 2

// ── URL utilities ──────────────────────────────────────────────

/** Read a query param from the current URL */
export function getUrlParam(key: string): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get(key)
}

/** Read the ?component= param from the current URL */
export function getComponentFromUrl(): string | null {
  return getUrlParam('component')
}

/** Read the ?viewport= param from the current URL */
export function getViewportFromUrl(): string | null {
  return getUrlParam('viewport')
}

/** Update multiple URL params + hash without navigation */
export function updateUrl(params: Record<string, string | undefined>, hash?: string): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value)
    } else {
      url.searchParams.delete(key)
    }
  }
  if (hash !== undefined) {
    url.hash = hash
  }
  window.history.replaceState({}, '', url.toString())
}

/** Update ?component= in the URL without navigation */
export function setComponentInUrl(name: string): void {
  updateUrl({ component: name })
}

/** Update the ?viewport= param */
export function setViewportInUrl(viewport: string): void {
  updateUrl({ viewport: viewport === 'responsive' ? undefined : viewport })
}

// ── State serialization ─────────────────────────────────────────

export interface SerializedState {
  /** Format version — enables migration when the format changes */
  _v?: number
  props?: Record<string, unknown> // propValues (non-default only)
  children?: Array<{ t: string; v: string }> // childrenItems (compact format)
  wrappers?: Record<string, Record<string, unknown>> // wrapperPropsMap (non-default only)
  fixtureOverrides?: Record<string, { p: Record<string, unknown>; c: string }>

  // ── Legacy v1 fields (read-only, for backward compat) ──
  p?: Record<string, unknown>
  ci?: Array<{ t: string; v: string }>
  ct?: string // childrenText (legacy)
  cm?: 'fixture' // childrenMode (legacy)
  cf?: string // childrenFixtureKey (legacy)
  w?: Record<string, Record<string, unknown>>
  fo?: Record<string, { p: Record<string, unknown>; c: string }>
}

export function serializeState(
  propValues: Record<string, unknown>,
  childrenItems: ChildItem[],
  wrapperPropsMap: Record<string, Record<string, unknown>>,
  fixtureOverrides: Record<string, FixtureOverride>,
  defaults: {
    propValues: Record<string, unknown>
    childrenItems: ChildItem[]
    wrapperPropsMap: Record<string, Record<string, unknown>>
  },
): string | null {
  const state: SerializedState = { _v: CURRENT_VERSION }

  // Only include non-default prop values
  const diffProps: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(propValues)) {
    if (value !== defaults.propValues[key]) {
      diffProps[key] = value
    }
  }
  if (Object.keys(diffProps).length > 0) state.props = diffProps

  // Serialize children items if different from defaults
  const defaultCI = defaults.childrenItems
  const ciChanged =
    childrenItems.length !== defaultCI.length ||
    childrenItems.some(
      (item, i) => item.type !== defaultCI[i]?.type || item.value !== defaultCI[i]?.value,
    )
  if (ciChanged && childrenItems.length > 0) {
    state.children = childrenItems.map((item) => ({ t: item.type, v: item.value }))
  }

  // Wrapper props diff
  const diffWrappers: Record<string, Record<string, unknown>> = {}
  for (const [wName, wProps] of Object.entries(wrapperPropsMap)) {
    const defaultWProps = defaults.wrapperPropsMap[wName] ?? {}
    const diff: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(wProps)) {
      if (value !== defaultWProps[key]) {
        diff[key] = value
      }
    }
    if (Object.keys(diff).length > 0) diffWrappers[wName] = diff
  }
  if (Object.keys(diffWrappers).length > 0) state.wrappers = diffWrappers

  // Fixture overrides (serializable parts only)
  const fo: Record<string, { p: Record<string, unknown>; c: string }> = {}
  for (const [slotKey, override] of Object.entries(fixtureOverrides)) {
    fo[slotKey] = { p: override.props, c: override.childrenText }
  }
  if (Object.keys(fo).length > 0) state.fixtureOverrides = fo

  // Only the version field? Nothing to serialize
  const fieldCount = Object.keys(state).length
  if (fieldCount <= 1) return null // only _v

  try {
    return btoa(JSON.stringify(state))
  } catch {
    return null
  }
}

/** Convert serialized children fields to ChildItem[], handling all format versions */
export function deserializeChildrenItems(saved: SerializedState): ChildItem[] | null {
  // V2 format
  if (saved.children) {
    return saved.children.map((item) => ({
      type: item.t === 'fixture' ? 'fixture' : 'text',
      value: item.v,
    }))
  }
  // V1 format
  if (saved.ci) {
    return saved.ci.map((item) => ({
      type: item.t === 'fixture' ? 'fixture' : 'text',
      value: item.v,
    }))
  }
  // Legacy format (v0)
  if (saved.cm === 'fixture' && saved.cf) {
    return [{ type: 'fixture', value: saved.cf }]
  }
  if (saved.ct !== undefined) {
    return [{ type: 'text', value: saved.ct }]
  }
  return null
}

/**
 * Normalize a deserialized state to v2 field names.
 * Handles backward compat with v1 and legacy formats.
 */
export function normalizeSerializedState(raw: SerializedState): SerializedState {
  // Already v2+
  if (raw._v && raw._v >= 2) return raw

  // Migrate v1 short field names to v2 full names
  return {
    _v: CURRENT_VERSION,
    props: raw.props ?? raw.p,
    children: raw.children ?? raw.ci,
    wrappers: raw.wrappers ?? raw.w,
    fixtureOverrides: raw.fixtureOverrides ?? raw.fo,
    // Carry legacy fields for deserializeChildrenItems
    ct: raw.ct,
    cm: raw.cm,
    cf: raw.cf,
  }
}

export function deserializeState(): SerializedState | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  if (!hash.startsWith(URL_HASH_PREFIX)) return null
  try {
    const raw = JSON.parse(atob(hash.slice(URL_HASH_PREFIX.length)))
    return normalizeSerializedState(raw)
  } catch {
    return null
  }
}

export function updateUrlHash(encoded: string | null): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.hash = encoded ? `s=${encoded}` : ''
  window.history.replaceState({}, '', url.toString())
}
