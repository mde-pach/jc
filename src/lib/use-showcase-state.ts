'use client'

/**
 * Central state hook for the showcase app.
 * Manages component selection, prop values, children mode (text vs fixture),
 * fixture resolution from host-provided plugins, and URL sync.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { JcComponentMeta, JcFixturePlugin, JcMeta, JcResolvedFixture } from '../types.js'
import { generateFakeChildren, generateFakeValue } from './faker-map.js'
import { getDefaultFixtureKey, resolveFixturePlugins } from './fixtures.js'

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

/** Full state shape returned by useShowcaseState */
export interface ShowcaseState {
  meta: JcMeta
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

/**
 * Generate smart default prop values for a component.
 * Uses faker heuristics for primitive props; for component-type props,
 * picks the first matching fixture key if fixtures are available.
 */
function generateDefaults(
  comp: JcComponentMeta,
  fixtures: JcResolvedFixture[],
): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const [name, prop] of Object.entries(comp.props)) {
    const base = generateFakeValue(name, prop)
    if (base === undefined && prop.componentKind && fixtures.length > 0) {
      values[name] = getDefaultFixtureKey(fixtures, prop.componentKind)
    } else {
      values[name] = base
    }
  }
  return values
}

export function useShowcaseState(
  meta: JcMeta,
  fixturePlugins?: JcFixturePlugin[],
): ShowcaseState {
  const resolvedFixtures = useMemo(
    () => resolveFixturePlugins(fixturePlugins),
    [fixturePlugins],
  )

  // Resolve initial component from URL or fall back to first
  const initialComponent = useMemo(() => {
    const fromUrl = getComponentFromUrl()
    if (fromUrl) {
      const match = meta.components.find((c) => c.displayName === fromUrl)
      if (match) return match
    }
    return meta.components[0] ?? null
  }, [meta.components])

  const [selectedName, setSelectedName] = useState<string | null>(
    initialComponent?.displayName ?? null,
  )
  const [search, setSearch] = useState('')
  const [propValues, setPropValues] = useState<Record<string, unknown>>(() => {
    return initialComponent ? generateDefaults(initialComponent, resolvedFixtures) : {}
  })
  const [childrenText, setChildrenText] = useState(() => {
    return initialComponent?.acceptsChildren ? generateFakeChildren(initialComponent.displayName) : ''
  })
  const [childrenMode, setChildrenMode] = useState<'text' | 'fixture'>('text')
  const [childrenFixtureKey, setChildrenFixtureKey] = useState<string | null>(null)

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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectComponent = useCallback(
    (name: string) => {
      setSelectedName(name)
      setComponentInUrl(name)
      const comp = meta.components.find((c) => c.displayName === name)
      if (comp) {
        setPropValues(generateDefaults(comp, resolvedFixtures))
        setChildrenText(comp.acceptsChildren ? generateFakeChildren(name) : '')
        setChildrenMode('text')
        setChildrenFixtureKey(null)
      }
    },
    [meta.components, resolvedFixtures],
  )

  const setPropValue = useCallback((propName: string, value: unknown) => {
    setPropValues((prev) => ({ ...prev, [propName]: value }))
  }, [])

  const resetProps = useCallback(() => {
    if (selectedComponent) {
      setPropValues(generateDefaults(selectedComponent, resolvedFixtures))
      setChildrenText(
        selectedComponent.acceptsChildren
          ? generateFakeChildren(selectedComponent.displayName)
          : '',
      )
      setChildrenMode('text')
      setChildrenFixtureKey(null)
    }
  }, [selectedComponent, resolvedFixtures])

  return {
    meta,
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
    resetProps,
  }
}
