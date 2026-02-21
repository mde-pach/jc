'use client'

/**
 * Central state hook for the showcase app.
 * Manages component selection, prop values, children mode (text vs fixture),
 * fixture resolution from host-provided plugins, and URL sync.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { JcComponentMeta, JcFixturePlugin, JcMeta, JcResolvedFixture } from '../types.js'
import { generateDefaults, generateFakeChildren } from './faker-map.js'
import { resolveFixturePlugins } from './fixtures.js'

/** Read the ?component= param from the current URL */
function getComponentFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('component')
}

/** Update ?component= in the URL without navigation */
function setComponentInUrl(name: string): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('component', name)
  window.history.replaceState({}, '', url.toString())
}

/** Reset prop values, children text, and children mode to defaults for a component */
function resetToDefaults(
  comp: JcComponentMeta,
  fixtures: JcResolvedFixture[],
): {
  propValues: Record<string, unknown>
  childrenText: string
  childrenMode: 'text' | 'fixture'
  childrenFixtureKey: string | null
} {
  return {
    propValues: generateDefaults(comp, fixtures),
    childrenText: comp.acceptsChildren ? generateFakeChildren(comp.displayName) : '',
    childrenMode: 'text',
    childrenFixtureKey: null,
  }
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
  selectComponent: (name: string) => void
  setSearch: (search: string) => void
  setPropValue: (propName: string, value: unknown) => void
  setChildrenText: (text: string) => void
  setChildrenMode: (mode: 'text' | 'fixture') => void
  setChildrenFixtureKey: (key: string | null) => void
  resetProps: () => void
}

export function useShowcaseState(meta: JcMeta, fixturePlugins?: JcFixturePlugin[]): ShowcaseState {
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
  const [initialized, setInitialized] = useState(false)

  // Client-side only: read URL param and generate faker defaults
  useEffect(() => {
    if (initialized) return
    const fromUrl = getComponentFromUrl()
    const target = fromUrl
      ? (meta.components.find((c) => c.displayName === fromUrl) ?? firstComponent)
      : firstComponent
    if (target) {
      if (target.displayName !== firstComponent?.displayName) {
        setSelectedName(target.displayName)
      }
      const defaults = resetToDefaults(target, resolvedFixtures)
      setPropValues(defaults.propValues)
      setChildrenText(defaults.childrenText)
    }
    setInitialized(true)
  }, [initialized, meta.components, firstComponent, resolvedFixtures])

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
    if (selectedName) setComponentInUrl(selectedName)
  }, [selectedName]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectComponent = useCallback(
    (name: string) => {
      setSelectedName(name)
      setComponentInUrl(name)
      const comp = meta.components.find((c) => c.displayName === name)
      if (comp) {
        const defaults = resetToDefaults(comp, resolvedFixtures)
        setPropValues(defaults.propValues)
        setChildrenText(defaults.childrenText)
        setChildrenMode(defaults.childrenMode)
        setChildrenFixtureKey(defaults.childrenFixtureKey)
      }
    },
    [meta.components, resolvedFixtures],
  )

  const setPropValue = useCallback((propName: string, value: unknown) => {
    setPropValues((prev) => ({ ...prev, [propName]: value }))
  }, [])

  const resetPropsAction = useCallback(() => {
    if (selectedComponent) {
      const defaults = resetToDefaults(selectedComponent, resolvedFixtures)
      setPropValues(defaults.propValues)
      setChildrenText(defaults.childrenText)
      setChildrenMode(defaults.childrenMode)
      setChildrenFixtureKey(defaults.childrenFixtureKey)
    }
  }, [selectedComponent, resolvedFixtures])

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
    selectComponent,
    setSearch,
    setPropValue,
    setChildrenText,
    setChildrenMode,
    setChildrenFixtureKey,
    resetProps: resetPropsAction,
  }
}
