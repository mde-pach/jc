'use client'

/**
 * Central state hook for the showcase app.
 * Manages component selection, prop values, children mode (text vs fixture),
 * and fixture resolution from host-provided plugins.
 */

import { useCallback, useMemo, useState } from 'react'
import type { JcComponentMeta, JcFixturePlugin, JcMeta, JcResolvedFixture } from '../types.js'
import { generateFakeChildren, generateFakeValue } from './faker-map.js'
import { getDefaultFixtureKey, resolveFixturePlugins } from './fixtures.js'

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

  const [selectedName, setSelectedName] = useState<string | null>(
    meta.components[0]?.displayName ?? null,
  )
  const [search, setSearch] = useState('')
  const [propValues, setPropValues] = useState<Record<string, unknown>>(() => {
    const first = meta.components[0]
    return first ? generateDefaults(first, resolvedFixtures) : {}
  })
  const [childrenText, setChildrenText] = useState(() => {
    const first = meta.components[0]
    return first?.acceptsChildren ? generateFakeChildren(first.displayName) : ''
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

  const selectComponent = useCallback(
    (name: string) => {
      setSelectedName(name)
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
