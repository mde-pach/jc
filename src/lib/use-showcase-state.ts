'use client'

import { useCallback, useMemo, useState } from 'react'
import type { JcComponentMeta, JcMeta } from '../types.js'
import { generateFakeChildren, generateFakeValue } from './faker-map.js'

export interface ShowcaseState {
  meta: JcMeta
  selectedName: string | null
  selectedComponent: JcComponentMeta | null
  search: string
  filteredComponents: JcComponentMeta[]
  propValues: Record<string, unknown>
  childrenText: string
  selectComponent: (name: string) => void
  setSearch: (search: string) => void
  setPropValue: (propName: string, value: unknown) => void
  setChildrenText: (text: string) => void
  resetProps: () => void
}

function generateDefaults(comp: JcComponentMeta): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const [name, prop] of Object.entries(comp.props)) {
    values[name] = generateFakeValue(name, prop)
  }
  return values
}

export function useShowcaseState(meta: JcMeta): ShowcaseState {
  const [selectedName, setSelectedName] = useState<string | null>(
    meta.components[0]?.displayName ?? null,
  )
  const [search, setSearch] = useState('')
  const [propValues, setPropValues] = useState<Record<string, unknown>>(() => {
    const first = meta.components[0]
    return first ? generateDefaults(first) : {}
  })
  const [childrenText, setChildrenText] = useState(() => {
    const first = meta.components[0]
    return first?.acceptsChildren ? generateFakeChildren(first.displayName) : ''
  })

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
        setPropValues(generateDefaults(comp))
        setChildrenText(comp.acceptsChildren ? generateFakeChildren(name) : '')
      }
    },
    [meta.components],
  )

  const setPropValue = useCallback((propName: string, value: unknown) => {
    setPropValues((prev) => ({ ...prev, [propName]: value }))
  }, [])

  const resetProps = useCallback(() => {
    if (selectedComponent) {
      setPropValues(generateDefaults(selectedComponent))
      setChildrenText(
        selectedComponent.acceptsChildren
          ? generateFakeChildren(selectedComponent.displayName)
          : '',
      )
    }
  }, [selectedComponent])

  return {
    meta,
    selectedName,
    selectedComponent,
    search,
    filteredComponents,
    propValues,
    childrenText,
    selectComponent,
    setSearch,
    setPropValue,
    setChildrenText,
    resetProps,
  }
}
