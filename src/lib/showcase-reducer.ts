/**
 * Pure state reducer for the showcase.
 *
 * All state transitions are modeled as actions. The reducer is pure —
 * no side effects, no React imports. This makes every transition
 * unit-testable without rendering components.
 *
 * The hook (use-showcase-state.ts) is responsible for:
 * - Computing action payloads (defaults, fixture init data)
 * - URL sync effects
 * - Exposing dispatch as named callbacks
 */

import type {
  ChildItem,
  JcComponentMeta,
  JcExamplePreset,
  JcPlugin,
  JcResolvedPluginItem,
} from '../types.js'
import { generateDefaults, generateFakeChildren } from './faker-map.js'
import { parseSlotKey, toSlotKeyString } from './utils.js'

// ── Defaults shape ──────────────────────────────────────────

/** Pre-computed defaults for a component (prop values, children, wrapper props) */
export interface ShowcaseDefaults {
  propValues: Record<string, unknown>
  childrenItems: ChildItem[]
  wrapperPropsMap: Record<string, Record<string, unknown>>
}

/** Data needed to initialize a fixture override slot */
export interface FixtureInitData {
  slotKey: string
  props: Record<string, unknown>
  childrenText: string
}

/** Data restored from URL state */
export interface UrlRestoreData {
  props?: Record<string, unknown>
  children?: ChildItem[]
  wrappers?: Record<string, Record<string, unknown>>
  fixtureOverrides?: Record<string, FixtureOverride>
}

/** Per-slot fixture override: custom prop values and children text for a selected component fixture */
export interface FixtureOverride {
  props: Record<string, unknown>
  childrenText: string
}

// ── State shape ─────────────────────────────────────────────

export interface ShowcaseReducerState {
  selectedName: string | null
  search: string
  propValues: Record<string, unknown>
  childrenItems: ChildItem[]
  fixtureOverrides: Record<string, FixtureOverride>
  wrapperPropsMap: Record<string, Record<string, unknown>>
  presetMode: 'generated' | number
  instanceCount: 1 | 3 | 5
  initialized: boolean
  /** Snapshot of defaults for the current component (used for URL diff) */
  defaults: ShowcaseDefaults | null
}

// ── Actions ─────────────────────────────────────────────────

export type ShowcaseAction =
  | {
      type: 'INITIALIZE'
      selectedName: string
      defaults: ShowcaseDefaults
      urlRestore: UrlRestoreData | null
    }
  | { type: 'SELECT_COMPONENT'; name: string; defaults: ShowcaseDefaults }
  | { type: 'SET_SEARCH'; search: string }
  | {
      type: 'SET_PROP'
      propName: string
      value: unknown
      fixtureInit?: FixtureInitData
    }
  | { type: 'ADD_CHILD'; item: ChildItem; fixtureInit?: FixtureInitData }
  | { type: 'REMOVE_CHILD'; index: number }
  | {
      type: 'UPDATE_CHILD'
      index: number
      item: ChildItem
      fixtureInit?: FixtureInitData
    }
  | { type: 'SET_FIXTURE_PROP'; slotKey: string; propName: string; value: unknown }
  | { type: 'SET_FIXTURE_CHILDREN'; slotKey: string; text: string }
  | {
      type: 'SET_WRAPPER_PROP'
      wrapperName: string
      propName: string
      value: unknown
    }
  | { type: 'SET_PRESET'; mode: 'generated' | number; applied: ShowcaseDefaults }
  | { type: 'SET_INSTANCE_COUNT'; count: 1 | 3 | 5 }
  | { type: 'RESET'; defaults: ShowcaseDefaults }

// ── Internal helpers ────────────────────────────────────────

/** Remove a fixture override by slot key, returning unchanged ref if key doesn't exist */
function clearFixtureOverride(
  overrides: Record<string, FixtureOverride>,
  slotKey: string,
): Record<string, FixtureOverride> {
  if (!(slotKey in overrides)) return overrides
  const next = { ...overrides }
  delete next[slotKey]
  return next
}

/** Shift children fixture override indices after a removal */
function shiftChildOverrides(
  overrides: Record<string, FixtureOverride>,
  removedIndex: number,
): Record<string, FixtureOverride> {
  const removedKey = toSlotKeyString({ type: 'children', index: removedIndex })
  const next = { ...overrides }
  delete next[removedKey]

  for (const key of Object.keys(next)) {
    const parsed = parseSlotKey(key)
    if (parsed && parsed.type === 'children' && parsed.index > removedIndex) {
      const newKey = toSlotKeyString({ type: 'children', index: parsed.index - 1 })
      next[newKey] = next[key]
      delete next[key]
    }
  }
  return next
}

// ── Reducer ─────────────────────────────────────────────────

export function showcaseReducer(
  state: ShowcaseReducerState,
  action: ShowcaseAction,
): ShowcaseReducerState {
  switch (action.type) {
    case 'INITIALIZE': {
      const { selectedName, defaults, urlRestore } = action
      if (!urlRestore) {
        return {
          ...state,
          selectedName,
          propValues: defaults.propValues,
          childrenItems: defaults.childrenItems,
          wrapperPropsMap: defaults.wrapperPropsMap,
          defaults,
          initialized: true,
        }
      }
      // Merge URL-restored state with defaults
      const mergedWrappers = { ...defaults.wrapperPropsMap }
      if (urlRestore.wrappers) {
        for (const [wName, wDiff] of Object.entries(urlRestore.wrappers)) {
          mergedWrappers[wName] = { ...(mergedWrappers[wName] ?? {}), ...wDiff }
        }
      }
      return {
        ...state,
        selectedName,
        propValues: { ...defaults.propValues, ...(urlRestore.props ?? {}) },
        childrenItems: urlRestore.children ?? defaults.childrenItems,
        wrapperPropsMap: mergedWrappers,
        fixtureOverrides: urlRestore.fixtureOverrides ?? {},
        defaults,
        initialized: true,
      }
    }

    case 'SELECT_COMPONENT':
      return {
        ...state,
        selectedName: action.name,
        propValues: action.defaults.propValues,
        childrenItems: action.defaults.childrenItems,
        wrapperPropsMap: action.defaults.wrapperPropsMap,
        fixtureOverrides: {},
        presetMode: 'generated',
        instanceCount: 1,
        defaults: action.defaults,
      }

    case 'SET_SEARCH':
      return { ...state, search: action.search }

    case 'SET_PROP': {
      const newPropValues = { ...state.propValues, [action.propName]: action.value }
      const slotKey = toSlotKeyString({ type: 'prop', name: action.propName })

      let newOverrides = state.fixtureOverrides
      if (action.fixtureInit) {
        newOverrides = {
          ...newOverrides,
          [action.fixtureInit.slotKey]: {
            props: action.fixtureInit.props,
            childrenText: action.fixtureInit.childrenText,
          },
        }
      } else {
        newOverrides = clearFixtureOverride(newOverrides, slotKey)
      }

      return { ...state, propValues: newPropValues, fixtureOverrides: newOverrides }
    }

    case 'ADD_CHILD': {
      const newItems = [...state.childrenItems, action.item]
      let newOverrides = state.fixtureOverrides
      if (action.fixtureInit) {
        newOverrides = {
          ...newOverrides,
          [action.fixtureInit.slotKey]: {
            props: action.fixtureInit.props,
            childrenText: action.fixtureInit.childrenText,
          },
        }
      }
      return { ...state, childrenItems: newItems, fixtureOverrides: newOverrides }
    }

    case 'REMOVE_CHILD':
      return {
        ...state,
        childrenItems: state.childrenItems.filter((_, i) => i !== action.index),
        fixtureOverrides: shiftChildOverrides(state.fixtureOverrides, action.index),
      }

    case 'UPDATE_CHILD': {
      const newItems = [...state.childrenItems]
      newItems[action.index] = action.item
      const slotKey = toSlotKeyString({ type: 'children', index: action.index })

      let newOverrides = state.fixtureOverrides
      if (action.fixtureInit) {
        newOverrides = {
          ...newOverrides,
          [action.fixtureInit.slotKey]: {
            props: action.fixtureInit.props,
            childrenText: action.fixtureInit.childrenText,
          },
        }
      } else {
        newOverrides = clearFixtureOverride(newOverrides, slotKey)
      }
      return { ...state, childrenItems: newItems, fixtureOverrides: newOverrides }
    }

    case 'SET_FIXTURE_PROP': {
      const existing = state.fixtureOverrides[action.slotKey]
      if (!existing) return state
      return {
        ...state,
        fixtureOverrides: {
          ...state.fixtureOverrides,
          [action.slotKey]: {
            ...existing,
            props: { ...existing.props, [action.propName]: action.value },
          },
        },
      }
    }

    case 'SET_FIXTURE_CHILDREN': {
      const existing = state.fixtureOverrides[action.slotKey]
      if (!existing) return state
      return {
        ...state,
        fixtureOverrides: {
          ...state.fixtureOverrides,
          [action.slotKey]: { ...existing, childrenText: action.text },
        },
      }
    }

    case 'SET_WRAPPER_PROP':
      return {
        ...state,
        wrapperPropsMap: {
          ...state.wrapperPropsMap,
          [action.wrapperName]: {
            ...state.wrapperPropsMap[action.wrapperName],
            [action.propName]: action.value,
          },
        },
      }

    case 'SET_PRESET':
      return {
        ...state,
        presetMode: action.mode,
        instanceCount: action.mode !== 'generated' ? 1 : state.instanceCount,
        propValues: action.applied.propValues,
        childrenItems: action.applied.childrenItems,
        wrapperPropsMap: action.applied.wrapperPropsMap,
        fixtureOverrides: {},
        ...(action.mode === 'generated' ? { defaults: action.applied } : {}),
      }

    case 'SET_INSTANCE_COUNT':
      return { ...state, instanceCount: action.count }

    case 'RESET':
      return {
        ...state,
        propValues: action.defaults.propValues,
        childrenItems: action.defaults.childrenItems,
        wrapperPropsMap: action.defaults.wrapperPropsMap,
        fixtureOverrides: {},
        presetMode: 'generated',
        instanceCount: 1,
        defaults: action.defaults,
      }

    default:
      return state
  }
}

/** Create initial state for the reducer */
export function createInitialState(initialSelectedName: string | null): ShowcaseReducerState {
  return {
    selectedName: initialSelectedName,
    search: '',
    propValues: {},
    childrenItems: [],
    fixtureOverrides: {},
    wrapperPropsMap: {},
    presetMode: 'generated',
    instanceCount: 1,
    initialized: false,
    defaults: null,
  }
}

// ── Default computation helpers ─────────────────────────────
//
// These are pure functions used by the hook to compute action payloads.
// They live here because they're tightly coupled to the state shape.

/**
 * Try to parse a JS object/array literal string (from @example getText()) into
 * a real value. Converts unquoted property keys to JSON-quoted keys first.
 */
function tryParseJsLiteral(str: string): unknown | undefined {
  try {
    return JSON.parse(str)
  } catch {
    // Not valid JSON — try converting JS object literal syntax to JSON
    // Quote unquoted property keys: `{ email:` → `{ "email":`
    const jsonified = str.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
    try {
      return JSON.parse(jsonified)
    } catch {
      return undefined
    }
  }
}

/** Compute default prop values, children, and wrapper props for a component */
export function computeDefaults(
  comp: JcComponentMeta,
  plugins: JcPlugin[],
  resolvedItems: JcResolvedPluginItem[],
  allComponents?: JcComponentMeta[],
): ShowcaseDefaults {
  const wrapperPropsMap: Record<string, Record<string, unknown>> = {}
  if (comp.wrapperComponents && allComponents) {
    for (const wrapper of comp.wrapperComponents) {
      const wrapperComp = allComponents.find((c) => c.displayName === wrapper.displayName)
      if (wrapperComp) {
        wrapperPropsMap[wrapper.displayName] = {
          ...generateDefaults(wrapperComp, plugins, resolvedItems),
          ...wrapper.defaultProps,
        }
      } else {
        wrapperPropsMap[wrapper.displayName] = { ...wrapper.defaultProps }
      }
    }
  }

  const childrenItems: ChildItem[] = comp.acceptsChildren
    ? [{ type: 'text', value: generateFakeChildren(comp.displayName) }]
    : []

  return {
    propValues: generateDefaults(comp, plugins, resolvedItems),
    childrenItems,
    wrapperPropsMap,
  }
}

/**
 * Apply an @example preset: start with faker defaults, overlay preset values
 * with type coercion, and merge wrapper props.
 */
export function computePresetDefaults(
  comp: JcComponentMeta,
  preset: JcExamplePreset,
  plugins: JcPlugin[],
  resolvedItems: JcResolvedPluginItem[],
  allComponents?: JcComponentMeta[],
): ShowcaseDefaults {
  const base = computeDefaults(comp, plugins, resolvedItems, allComponents)

  // Overlay preset prop values with type coercion
  for (const [key, strVal] of Object.entries(preset.propValues)) {
    const propMeta = comp.props[key]
    if (!propMeta) continue

    if (propMeta.type === 'boolean') {
      if (strVal === 'true' || strVal === 'false') {
        base.propValues[key] = strVal === 'true'
      }
    } else if (propMeta.type === 'number') {
      const num = Number(strVal)
      if (!Number.isNaN(num)) {
        base.propValues[key] = num
      }
    } else if (propMeta.componentKind) {
      // Component-kind props: try to resolve string value to a plugin item by label
      const byLabel = resolvedItems.find(
        (f) => f.label === strVal || f.label.toLowerCase() === strVal.toLowerCase(),
      )
      base.propValues[key] = byLabel ? byLabel.qualifiedKey : strVal
    } else if (propMeta.type.endsWith('[]')) {
      const parsed = tryParseJsLiteral(strVal)
      if (Array.isArray(parsed)) {
        base.propValues[key] = parsed
      } else {
        base.propValues[key] = strVal
      }
    } else if (propMeta.structuredFields) {
      // Structured object types (e.g. ContactInfo) — parse JS object literal from @example
      const parsed = tryParseJsLiteral(strVal)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        base.propValues[key] = parsed
      } else {
        base.propValues[key] = strVal
      }
    } else {
      base.propValues[key] = strVal
    }
  }

  if (preset.childrenText) {
    base.childrenItems = [{ type: 'text', value: preset.childrenText }]
  }

  for (const [wName, wProps] of Object.entries(preset.wrapperProps)) {
    base.wrapperPropsMap[wName] = {
      ...(base.wrapperPropsMap[wName] ?? {}),
      ...wProps,
    }
  }

  return base
}

/** Compute fixture override init data for a component fixture selection */
export function computeFixtureInit(
  slotKey: string,
  compName: string,
  allComponents: JcComponentMeta[],
  plugins: JcPlugin[],
  resolvedItems: JcResolvedPluginItem[],
): FixtureInitData | undefined {
  const comp = allComponents.find((c) => c.displayName === compName)
  if (!comp) return undefined
  return {
    slotKey,
    props: generateDefaults(comp, plugins, resolvedItems),
    childrenText: comp.acceptsChildren ? generateFakeChildren(compName) : '',
  }
}
