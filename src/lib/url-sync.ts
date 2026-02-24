/**
 * URL synchronization utilities for the showcase app.
 * Handles reading/writing query params and hash-based state serialization.
 */

import type { ChildItem } from '../types.js'
import type { FixtureOverride } from './use-showcase-state.js'

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
  p?: Record<string, unknown> // propValues (non-default only)
  ci?: Array<{ t: string; v: string }> // childrenItems (compact format)
  // Legacy fields for backward compat when deserializing
  ct?: string // childrenText (legacy)
  cm?: 'fixture' // childrenMode (legacy)
  cf?: string // childrenFixtureKey (legacy)
  w?: Record<string, Record<string, unknown>> // wrapperPropsMap (non-default only)
  fo?: Record<string, { p: Record<string, unknown>; c: string }> // fixtureOverrides
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
  const state: SerializedState = {}

  // Only include non-default prop values
  const diffProps: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(propValues)) {
    if (value !== defaults.propValues[key]) {
      diffProps[key] = value
    }
  }
  if (Object.keys(diffProps).length > 0) state.p = diffProps

  // Serialize children items if different from defaults
  const defaultCI = defaults.childrenItems
  const ciChanged =
    childrenItems.length !== defaultCI.length ||
    childrenItems.some(
      (item, i) => item.type !== defaultCI[i]?.type || item.value !== defaultCI[i]?.value,
    )
  if (ciChanged && childrenItems.length > 0) {
    state.ci = childrenItems.map((item) => ({ t: item.type, v: item.value }))
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
  if (Object.keys(diffWrappers).length > 0) state.w = diffWrappers

  // Fixture overrides (serializable parts only)
  const fo: Record<string, { p: Record<string, unknown>; c: string }> = {}
  for (const [slotKey, override] of Object.entries(fixtureOverrides)) {
    fo[slotKey] = { p: override.props, c: override.childrenText }
  }
  if (Object.keys(fo).length > 0) state.fo = fo

  if (Object.keys(state).length === 0) return null

  try {
    return btoa(JSON.stringify(state))
  } catch {
    return null
  }
}

/** Convert legacy serialized children fields to ChildItem[] */
export function deserializeChildrenItems(saved: SerializedState): ChildItem[] | null {
  // New format
  if (saved.ci) {
    return saved.ci.map((item) => ({
      type: item.t === 'fixture' ? 'fixture' : 'text',
      value: item.v,
    }))
  }
  // Legacy format
  if (saved.cm === 'fixture' && saved.cf) {
    return [{ type: 'fixture', value: saved.cf }]
  }
  if (saved.ct !== undefined) {
    return [{ type: 'text', value: saved.ct }]
  }
  return null
}

export function deserializeState(): SerializedState | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  if (!hash.startsWith('#s=')) return null
  try {
    return JSON.parse(atob(hash.slice(3)))
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
