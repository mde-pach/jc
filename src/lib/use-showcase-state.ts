'use client'

/**
 * Central state hook for the showcase app.
 * Wraps the pure `showcaseReducer` with React state, URL sync effects,
 * and named callbacks for the component tree.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type {
  ChildItem,
  JcComponentMeta,
  JcMeta,
  JcPlugin,
  JcResolvedPluginItem,
} from '../types.js'
import { resolvePluginItems } from './plugins.js'
import {
  type ShowcaseDefaults,
  computeDefaults,
  computeFixtureInit,
  computePresetDefaults,
  createInitialState,
  showcaseReducer,
} from './showcase-reducer.js'
import {
  deserializeChildrenItems,
  deserializeState,
  getComponentFromUrl,
  serializeState,
  setComponentInUrl,
  updateUrlHash,
} from './url-sync.js'
import { COMPONENT_FIXTURE_PREFIX, toSlotKeyString } from './utils.js'

// ── Public types ────────────────────────────────────────────────

/** Per-slot fixture override: custom prop values and children text for a selected component fixture */
export interface FixtureOverride {
  props: Record<string, unknown>
  childrenText: string
}

/** Full state shape returned by useShowcaseState */
export interface ShowcaseState {
  meta: JcMeta
  /** Whether client-side initialization (URL sync + faker defaults) is complete */
  ready: boolean
  selectedName: string | null
  selectedComponent: JcComponentMeta | null
  search: string
  filteredComponents: JcComponentMeta[]
  propValues: Record<string, unknown>
  /** Children items — each can be text or a fixture reference */
  childrenItems: ChildItem[]
  /** All resolved plugin items (flattened from all plugins) */
  resolvedItems: JcResolvedPluginItem[]
  /** All active plugins (for matching props to plugins) */
  plugins: JcPlugin[]
  /** Per-slot overrides for component fixture props (keyed by "prop:<name>" or "children:<index>") */
  fixtureOverrides: Record<string, FixtureOverride>
  /** Live wrapper component prop values keyed by wrapper displayName */
  wrapperPropsMap: Record<string, Record<string, unknown>>
  /** 'generated' = faker defaults, number = example preset index */
  presetMode: 'generated' | number
  /** Number of instances to render (1/3/5). Only active in generated mode. */
  instanceCount: 1 | 3 | 5
  selectComponent: (name: string) => void
  setSearch: (search: string) => void
  setPropValue: (propName: string, value: unknown) => void
  addChildItem: (item?: ChildItem) => void
  removeChildItem: (index: number) => void
  updateChildItem: (index: number, item: ChildItem) => void
  setFixturePropValue: (slotKey: string, propName: string, value: unknown) => void
  setFixtureChildrenText: (slotKey: string, text: string) => void
  setWrapperPropValue: (wrapperName: string, propName: string, value: unknown) => void
  setPresetMode: (mode: 'generated' | number) => void
  setInstanceCount: (count: 1 | 3 | 5) => void
  resetProps: () => void
}

/** Options for useShowcaseState */
interface UseShowcaseStateOptions {
  /** When false, disables all URL read/write (default true) */
  syncUrl?: boolean
  /** Select a specific component on mount instead of the first one */
  initialComponent?: string
}

// ── Helpers ─────────────────────────────────────────────────────

/** Build fixture init data if value is a component fixture key, else undefined */
function maybeFixtureInit(
  slotKey: string,
  value: unknown,
  allComponents: JcComponentMeta[],
  plugins: JcPlugin[],
  resolvedItems: JcResolvedPluginItem[],
) {
  if (typeof value === 'string' && value.startsWith(COMPONENT_FIXTURE_PREFIX)) {
    const compName = value.slice(COMPONENT_FIXTURE_PREFIX.length)
    return computeFixtureInit(slotKey, compName, allComponents, plugins, resolvedItems)
  }
  return undefined
}

// ── Hook ────────────────────────────────────────────────────────

export function useShowcaseState(
  meta: JcMeta,
  plugins: JcPlugin[],
  options?: UseShowcaseStateOptions,
): ShowcaseState {
  const syncUrl = options?.syncUrl ?? true
  const initialComponentName = options?.initialComponent

  const resolvedItems = useMemo(() => resolvePluginItems(plugins), [plugins])

  // Always start with first component during SSR to avoid hydration mismatch.
  const firstComponent = meta.components[0] ?? null

  const [state, dispatch] = useReducer(
    showcaseReducer,
    firstComponent?.displayName ?? null,
    createInitialState,
  )

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Client-side only: read URL param and generate faker defaults, then restore state from hash
  useEffect(() => {
    if (state.initialized) return

    // Determine initial component: explicit prop > URL param > first component
    let target = firstComponent
    if (initialComponentName) {
      target = meta.components.find((c) => c.displayName === initialComponentName) ?? target
    } else if (syncUrl) {
      const fromUrl = getComponentFromUrl()
      if (fromUrl) {
        target = meta.components.find((c) => c.displayName === fromUrl) ?? target
      }
    }

    if (target) {
      const defaults = computeDefaults(target, plugins, resolvedItems, meta.components)

      // Restore from URL hash if present (only when syncUrl is enabled)
      const saved = syncUrl ? deserializeState() : null
      let urlRestore = null
      if (saved) {
        const restoredChildren = deserializeChildrenItems(saved)
        urlRestore = {
          props: saved.props,
          children: restoredChildren ?? undefined,
          wrappers: saved.wrappers,
          fixtureOverrides: saved.fixtureOverrides
            ? Object.fromEntries(
                Object.entries(saved.fixtureOverrides).map(([k, v]) => [
                  k,
                  { props: v.p, childrenText: v.c },
                ]),
              )
            : undefined,
        }
      }

      dispatch({
        type: 'INITIALIZE',
        selectedName: target.displayName,
        defaults,
        urlRestore,
      })
    }
  }, [
    state.initialized,
    meta.components,
    firstComponent,
    plugins,
    resolvedItems,
    syncUrl,
    initialComponentName,
  ])

  const selectedComponent = useMemo(
    () => meta.components.find((c) => c.displayName === state.selectedName) ?? null,
    [meta.components, state.selectedName],
  )

  const filteredComponents = useMemo(() => {
    if (!state.search) return meta.components
    const q = state.search.toLowerCase()
    return meta.components.filter((c) => c.displayName.toLowerCase().includes(q))
  }, [meta.components, state.search])

  // Sync URL on component change
  useEffect(() => {
    if (syncUrl && state.selectedName) setComponentInUrl(state.selectedName)
  }, [syncUrl, state.selectedName])

  // Debounced sync of prop/children/wrapper state to URL hash
  useEffect(() => {
    if (!syncUrl || !state.initialized || !state.defaults) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      const encoded = serializeState(
        state.propValues,
        state.childrenItems,
        state.wrapperPropsMap,
        state.fixtureOverrides,
        state.defaults!,
      )
      updateUrlHash(encoded)
    }, 300)
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    }
  }, [
    syncUrl,
    state.initialized,
    state.propValues,
    state.childrenItems,
    state.wrapperPropsMap,
    state.fixtureOverrides,
    state.defaults,
  ])

  // ── Named callbacks ─────────────────────────────────────────

  const selectComponent = useCallback(
    (name: string) => {
      if (syncUrl) {
        setComponentInUrl(name)
        updateUrlHash(null)
      }
      const comp = meta.components.find((c) => c.displayName === name)
      if (comp) {
        const defaults = computeDefaults(comp, plugins, resolvedItems, meta.components)
        dispatch({ type: 'SELECT_COMPONENT', name, defaults })
      }
    },
    [meta.components, plugins, resolvedItems, syncUrl],
  )

  const setSearch = useCallback((search: string) => {
    dispatch({ type: 'SET_SEARCH', search })
  }, [])

  const setPropValue = useCallback(
    (propName: string, value: unknown) => {
      const slotKey = toSlotKeyString({ type: 'prop', name: propName })
      const fixtureInit = maybeFixtureInit(
        slotKey,
        value,
        meta.components,
        plugins,
        resolvedItems,
      )
      dispatch({ type: 'SET_PROP', propName, value, fixtureInit })
    },
    [meta.components, plugins, resolvedItems],
  )

  const addChildItem = useCallback(
    (item?: ChildItem) => {
      const newItem = item ?? { type: 'text' as const, value: '' }
      // We need the current length for the slot key — read from state via dispatch
      // Since we dispatch first and the reducer appends, the index is the current length
      const slotKey = toSlotKeyString({ type: 'children', index: state.childrenItems.length })
      const fixtureInit = maybeFixtureInit(
        slotKey,
        newItem.type === 'fixture' ? newItem.value : undefined,
        meta.components,
        plugins,
        resolvedItems,
      )
      dispatch({ type: 'ADD_CHILD', item: newItem, fixtureInit })
    },
    [state.childrenItems.length, meta.components, plugins, resolvedItems],
  )

  const removeChildItem = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_CHILD', index })
  }, [])

  const updateChildItem = useCallback(
    (index: number, item: ChildItem) => {
      const slotKey = toSlotKeyString({ type: 'children', index })
      const fixtureInit = maybeFixtureInit(
        slotKey,
        item.type === 'fixture' ? item.value : undefined,
        meta.components,
        plugins,
        resolvedItems,
      )
      dispatch({ type: 'UPDATE_CHILD', index, item, fixtureInit })
    },
    [meta.components, plugins, resolvedItems],
  )

  const setFixturePropValue = useCallback(
    (slotKey: string, propName: string, value: unknown) => {
      dispatch({ type: 'SET_FIXTURE_PROP', slotKey, propName, value })
    },
    [],
  )

  const setFixtureChildrenText = useCallback((slotKey: string, text: string) => {
    dispatch({ type: 'SET_FIXTURE_CHILDREN', slotKey, text })
  }, [])

  const setWrapperPropValue = useCallback(
    (wrapperName: string, propName: string, value: unknown) => {
      dispatch({ type: 'SET_WRAPPER_PROP', wrapperName, propName, value })
    },
    [],
  )

  const setPresetMode = useCallback(
    (mode: 'generated' | number) => {
      if (!selectedComponent) return

      let applied: ShowcaseDefaults
      if (mode === 'generated') {
        applied = computeDefaults(selectedComponent, plugins, resolvedItems, meta.components)
      } else {
        const preset = selectedComponent.examples?.[mode]
        if (!preset) return
        applied = computePresetDefaults(
          selectedComponent,
          preset,
          plugins,
          resolvedItems,
          meta.components,
        )
      }
      dispatch({ type: 'SET_PRESET', mode, applied })
    },
    [selectedComponent, plugins, resolvedItems, meta.components],
  )

  const setInstanceCount = useCallback((count: 1 | 3 | 5) => {
    dispatch({ type: 'SET_INSTANCE_COUNT', count })
  }, [])

  const resetProps = useCallback(() => {
    if (selectedComponent) {
      const defaults = computeDefaults(selectedComponent, plugins, resolvedItems, meta.components)
      dispatch({ type: 'RESET', defaults })
    }
  }, [selectedComponent, plugins, resolvedItems, meta.components])

  return {
    meta,
    ready: state.initialized,
    selectedName: state.selectedName,
    selectedComponent,
    search: state.search,
    filteredComponents,
    propValues: state.propValues,
    childrenItems: state.childrenItems,
    resolvedItems,
    plugins,
    fixtureOverrides: state.fixtureOverrides,
    wrapperPropsMap: state.wrapperPropsMap,
    presetMode: state.presetMode,
    instanceCount: state.instanceCount,
    selectComponent,
    setSearch,
    setPropValue,
    addChildItem,
    removeChildItem,
    updateChildItem,
    setFixturePropValue,
    setFixtureChildrenText,
    setWrapperPropValue,
    setPresetMode,
    setInstanceCount,
    resetProps,
  }
}
