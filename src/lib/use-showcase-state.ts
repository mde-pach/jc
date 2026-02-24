'use client'

/**
 * Central state hook for the showcase app.
 * Manages component selection, prop values, children mode (text vs fixture),
 * fixture resolution from host-provided plugins, and URL sync.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  JcComponentMeta,
  JcExamplePreset,
  JcFixturePlugin,
  JcMeta,
  JcResolvedFixture,
} from '../types.js'
import { generateDefaults, generateFakeChildren } from './faker-map.js'
import { resolveFixturePlugins } from './fixtures.js'
import {
  deserializeState,
  getComponentFromUrl,
  serializeState,
  setComponentInUrl,
  updateUrlHash,
} from './url-sync.js'

// ── Helpers ─────────────────────────────────────────────────────

/** Reset prop values, children text, and children mode to defaults for a component */
function resetToDefaults(
  comp: JcComponentMeta,
  fixtures: JcResolvedFixture[],
  allComponents?: JcComponentMeta[],
): {
  propValues: Record<string, unknown>
  childrenText: string
  childrenMode: 'text' | 'fixture'
  childrenFixtureKey: string | null
  wrapperPropsMap: Record<string, Record<string, unknown>>
} {
  // Compute wrapper props map: faker defaults + @example-detected defaults on top
  const wrapperPropsMap: Record<string, Record<string, unknown>> = {}
  if (comp.wrapperComponents && allComponents) {
    for (const wrapper of comp.wrapperComponents) {
      const wrapperComp = allComponents.find((c) => c.displayName === wrapper.displayName)
      if (wrapperComp) {
        wrapperPropsMap[wrapper.displayName] = {
          ...generateDefaults(wrapperComp, fixtures),
          ...wrapper.defaultProps,
        }
      } else {
        wrapperPropsMap[wrapper.displayName] = { ...wrapper.defaultProps }
      }
    }
  }

  return {
    propValues: generateDefaults(comp, fixtures),
    childrenText: comp.acceptsChildren ? generateFakeChildren(comp.displayName) : '',
    childrenMode: 'text',
    childrenFixtureKey: null,
    wrapperPropsMap,
  }
}

/**
 * Apply an @example preset: start with faker defaults, overlay preset values
 * with type coercion, and merge wrapper props.
 */
function applyExamplePreset(
  comp: JcComponentMeta,
  preset: JcExamplePreset,
  fixtures: JcResolvedFixture[],
  allComponents?: JcComponentMeta[],
): {
  propValues: Record<string, unknown>
  childrenText: string
  wrapperPropsMap: Record<string, Record<string, unknown>>
} {
  const base = resetToDefaults(comp, fixtures, allComponents)

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
    } else if (propMeta.componentKind === 'icon') {
      // Icon props from @example have raw names like "Heart" — resolve to qualified fixture key
      const byLabel = fixtures.find(
        (f) => f.label === strVal || f.label.toLowerCase() === strVal.toLowerCase(),
      )
      base.propValues[key] = byLabel ? byLabel.qualifiedKey : strVal
    } else {
      // String, enum, etc. — use the raw string value
      base.propValues[key] = strVal
    }
  }

  // Override children text if preset has it
  if (preset.childrenText) {
    base.childrenText = preset.childrenText
  }

  // Merge wrapper props
  for (const [wName, wProps] of Object.entries(preset.wrapperProps)) {
    base.wrapperPropsMap[wName] = {
      ...(base.wrapperPropsMap[wName] ?? {}),
      ...wProps,
    }
  }

  return {
    propValues: base.propValues,
    childrenText: base.childrenText,
    wrapperPropsMap: base.wrapperPropsMap,
  }
}

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
  childrenText: string
  childrenMode: 'text' | 'fixture'
  childrenFixtureKey: string | null
  resolvedFixtures: JcResolvedFixture[]
  /** Per-slot overrides for component fixture props (keyed by "prop:<name>" or "children") */
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
  setChildrenText: (text: string) => void
  setChildrenMode: (mode: 'text' | 'fixture') => void
  setChildrenFixtureKey: (key: string | null) => void
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

export function useShowcaseState(
  meta: JcMeta,
  fixturePlugins?: JcFixturePlugin[],
  options?: UseShowcaseStateOptions,
): ShowcaseState {
  const syncUrl = options?.syncUrl ?? true
  const initialComponentName = options?.initialComponent

  const resolvedFixtures = useMemo(() => resolveFixturePlugins(fixturePlugins), [fixturePlugins])

  // Always start with first component during SSR to avoid hydration mismatch.
  // URL sync happens client-side in useEffect below.
  const firstComponent = meta.components[0] ?? null

  const [selectedName, setSelectedName] = useState<string | null>(
    firstComponent?.displayName ?? null,
  )
  const [search, setSearch] = useState('')
  const [propValues, setPropValues] = useState<Record<string, unknown>>({})
  const [childrenText, setChildrenText] = useState('')
  const [childrenMode, setChildrenMode] = useState<'text' | 'fixture'>('text')
  const [childrenFixtureKey, setChildrenFixtureKey] = useState<string | null>(null)
  const [fixtureOverrides, setFixtureOverrides] = useState<Record<string, FixtureOverride>>({})
  const [wrapperPropsMap, setWrapperPropsMap] = useState<Record<string, Record<string, unknown>>>(
    {},
  )
  const [presetMode, setPresetModeState] = useState<'generated' | number>('generated')
  const [instanceCount, setInstanceCountState] = useState<1 | 3 | 5>(1)
  const [initialized, setInitialized] = useState(false)
  const defaultsRef = useRef<{
    propValues: Record<string, unknown>
    childrenText: string
    wrapperPropsMap: Record<string, Record<string, unknown>>
  } | null>(null)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Initialize overrides for a slot when a component fixture is selected */
  const initFixtureOverrides = useCallback(
    (slotKey: string, compName: string) => {
      const comp = meta.components.find((c) => c.displayName === compName)
      if (!comp) return
      const defaults = generateDefaults(comp, resolvedFixtures)
      const childText = comp.acceptsChildren ? generateFakeChildren(compName) : ''
      setFixtureOverrides((prev) => ({
        ...prev,
        [slotKey]: { props: defaults, childrenText: childText },
      }))
    },
    [meta.components, resolvedFixtures],
  )

  // Client-side only: read URL param and generate faker defaults, then restore state from hash
  useEffect(() => {
    if (initialized) return

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
      if (target.displayName !== firstComponent?.displayName) {
        setSelectedName(target.displayName)
      }
      const defaults = resetToDefaults(target, resolvedFixtures, meta.components)
      defaultsRef.current = {
        propValues: defaults.propValues,
        childrenText: defaults.childrenText,
        wrapperPropsMap: defaults.wrapperPropsMap,
      }

      // Restore from URL hash if present (only when syncUrl is enabled)
      const saved = syncUrl ? deserializeState() : null
      if (saved) {
        setPropValues({ ...defaults.propValues, ...(saved.p ?? {}) })
        setChildrenText(saved.ct ?? defaults.childrenText)
        if (saved.cm === 'fixture') setChildrenMode('fixture')
        if (saved.cf) setChildrenFixtureKey(saved.cf)
        const mergedWrappers = { ...defaults.wrapperPropsMap }
        if (saved.w) {
          for (const [wName, wDiff] of Object.entries(saved.w)) {
            mergedWrappers[wName] = { ...(mergedWrappers[wName] ?? {}), ...wDiff }
          }
        }
        setWrapperPropsMap(mergedWrappers)
        if (saved.fo) {
          const restoredOverrides: Record<string, FixtureOverride> = {}
          for (const [slotKey, data] of Object.entries(saved.fo)) {
            restoredOverrides[slotKey] = { props: data.p, childrenText: data.c }
          }
          setFixtureOverrides(restoredOverrides)
        }
      } else {
        setPropValues(defaults.propValues)
        setChildrenText(defaults.childrenText)
        setWrapperPropsMap(defaults.wrapperPropsMap)
      }
    }
    setInitialized(true)
  }, [
    initialized,
    meta.components,
    firstComponent,
    resolvedFixtures,
    syncUrl,
    initialComponentName,
  ])

  const selectedComponent = useMemo(
    () => meta.components.find((c) => c.displayName === selectedName) ?? null,
    [meta.components, selectedName],
  )

  const filteredComponents = useMemo(() => {
    if (!search) return meta.components
    const q = search.toLowerCase()
    return meta.components.filter((c) => c.displayName.toLowerCase().includes(q))
  }, [meta.components, search])

  // Sync URL on initial mount
  useEffect(() => {
    if (syncUrl && selectedName) setComponentInUrl(selectedName)
  }, [syncUrl, selectedName]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced sync of prop/children/wrapper state to URL hash
  useEffect(() => {
    if (!syncUrl || !initialized || !defaultsRef.current) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      const encoded = serializeState(
        propValues,
        childrenText,
        childrenMode,
        childrenFixtureKey,
        wrapperPropsMap,
        fixtureOverrides,
        defaultsRef.current!,
      )
      updateUrlHash(encoded)
    }, 300)
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    }
  }, [
    syncUrl,
    initialized,
    propValues,
    childrenText,
    childrenMode,
    childrenFixtureKey,
    wrapperPropsMap,
    fixtureOverrides,
  ])

  const selectComponent = useCallback(
    (name: string) => {
      setSelectedName(name)
      if (syncUrl) setComponentInUrl(name)
      setFixtureOverrides({})
      setPresetModeState('generated')
      setInstanceCountState(1)
      if (syncUrl) updateUrlHash(null)
      const comp = meta.components.find((c) => c.displayName === name)
      if (comp) {
        const defaults = resetToDefaults(comp, resolvedFixtures, meta.components)
        defaultsRef.current = {
          propValues: defaults.propValues,
          childrenText: defaults.childrenText,
          wrapperPropsMap: defaults.wrapperPropsMap,
        }
        setPropValues(defaults.propValues)
        setChildrenText(defaults.childrenText)
        setChildrenMode(defaults.childrenMode)
        setChildrenFixtureKey(defaults.childrenFixtureKey)
        setWrapperPropsMap(defaults.wrapperPropsMap)
      }
    },
    [meta.components, resolvedFixtures, syncUrl],
  )

  const setPropValue = useCallback(
    (propName: string, value: unknown) => {
      setPropValues((prev) => ({ ...prev, [propName]: value }))
      // Auto-init fixture overrides when selecting a component fixture
      const slotKey = `prop:${propName}`
      if (typeof value === 'string' && value.startsWith('components/')) {
        const compName = value.slice('components/'.length)
        initFixtureOverrides(slotKey, compName)
      } else {
        // Clear overrides when switching away from a component fixture
        setFixtureOverrides((prev) => {
          if (!(slotKey in prev)) return prev
          const next = { ...prev }
          delete next[slotKey]
          return next
        })
      }
    },
    [initFixtureOverrides],
  )

  const setPresetMode = useCallback(
    (mode: 'generated' | number) => {
      setPresetModeState(mode)
      if (mode !== 'generated') {
        setInstanceCountState(1) // Reset instance count when switching to preset
      }
      if (!selectedComponent) return

      if (mode === 'generated') {
        // Restore faker defaults
        const defaults = resetToDefaults(selectedComponent, resolvedFixtures, meta.components)
        defaultsRef.current = {
          propValues: defaults.propValues,
          childrenText: defaults.childrenText,
          wrapperPropsMap: defaults.wrapperPropsMap,
        }
        setPropValues(defaults.propValues)
        setChildrenText(defaults.childrenText)
        setChildrenMode(defaults.childrenMode)
        setChildrenFixtureKey(defaults.childrenFixtureKey)
        setWrapperPropsMap(defaults.wrapperPropsMap)
        setFixtureOverrides({})
      } else {
        // Apply the example preset
        const preset = selectedComponent.examples?.[mode]
        if (preset) {
          const applied = applyExamplePreset(
            selectedComponent,
            preset,
            resolvedFixtures,
            meta.components,
          )
          setPropValues(applied.propValues)
          setChildrenText(applied.childrenText)
          setChildrenMode('text')
          setChildrenFixtureKey(null)
          setWrapperPropsMap(applied.wrapperPropsMap)
          setFixtureOverrides({})
        }
      }
    },
    [selectedComponent, resolvedFixtures, meta.components],
  )

  const setInstanceCount = useCallback((count: 1 | 3 | 5) => {
    setInstanceCountState(count)
  }, [])

  const resetPropsAction = useCallback(() => {
    if (selectedComponent) {
      const defaults = resetToDefaults(selectedComponent, resolvedFixtures, meta.components)
      setPropValues(defaults.propValues)
      setChildrenText(defaults.childrenText)
      setChildrenMode(defaults.childrenMode)
      setChildrenFixtureKey(defaults.childrenFixtureKey)
      setWrapperPropsMap(defaults.wrapperPropsMap)
      setFixtureOverrides({})
      setPresetModeState('generated')
      setInstanceCountState(1)
    }
  }, [selectedComponent, resolvedFixtures, meta.components])

  /** Wrap setChildrenFixtureKey to auto-init overrides for component fixtures */
  const setChildrenFixtureKeyWrapped = useCallback(
    (key: string | null) => {
      setChildrenFixtureKey(key)
      if (key?.startsWith('components/')) {
        const compName = key.slice('components/'.length)
        initFixtureOverrides('children', compName)
      } else {
        setFixtureOverrides((prev) => {
          if (!('children' in prev)) return prev
          const next = { ...prev }
          delete next.children
          return next
        })
      }
    },
    [initFixtureOverrides],
  )

  const setFixturePropValue = useCallback((slotKey: string, propName: string, value: unknown) => {
    setFixtureOverrides((prev) => {
      const existing = prev[slotKey]
      if (!existing) return prev
      return {
        ...prev,
        [slotKey]: {
          ...existing,
          props: { ...existing.props, [propName]: value },
        },
      }
    })
  }, [])

  const setFixtureChildrenText = useCallback((slotKey: string, text: string) => {
    setFixtureOverrides((prev) => {
      const existing = prev[slotKey]
      if (!existing) return prev
      return {
        ...prev,
        [slotKey]: { ...existing, childrenText: text },
      }
    })
  }, [])

  const setWrapperPropValue = useCallback(
    (wrapperName: string, propName: string, value: unknown) => {
      setWrapperPropsMap((prev) => ({
        ...prev,
        [wrapperName]: { ...prev[wrapperName], [propName]: value },
      }))
    },
    [],
  )

  return {
    meta,
    ready: initialized,
    selectedName,
    selectedComponent,
    search,
    filteredComponents,
    propValues,
    childrenText,
    childrenMode,
    childrenFixtureKey,
    resolvedFixtures,
    fixtureOverrides,
    wrapperPropsMap,
    presetMode,
    instanceCount,
    selectComponent,
    setSearch,
    setPropValue,
    setChildrenText,
    setChildrenMode,
    setChildrenFixtureKey: setChildrenFixtureKeyWrapped,
    setFixturePropValue,
    setFixtureChildrenText,
    setWrapperPropValue,
    setPresetMode,
    setInstanceCount,
    resetProps: resetPropsAction,
  }
}
