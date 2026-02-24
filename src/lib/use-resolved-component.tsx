'use client'

import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { FixtureOverride } from './use-showcase-state.js'
import type { JcComponentMeta, JcMeta, JcResolvedFixture } from '../types.js'
import { resolveControlType, getArrayItemType } from './faker-map.js'
import { renderComponentFixture, resolveFixtureValue } from './fixtures.js'

interface UseResolvedComponentOptions {
  component: JcComponentMeta
  propValues: Record<string, unknown>
  childrenText: string
  childrenMode: 'text' | 'fixture'
  childrenFixtureKey: string | null
  fixtures: JcResolvedFixture[]
  meta: JcMeta
  fixtureOverrides: Record<string, FixtureOverride>
  wrapperPropsMap: Record<string, Record<string, unknown>>
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>
  wrapper?: ComponentType<{ children: ReactNode }>
}

export function useResolvedComponent(options: UseResolvedComponentOptions) {
  const {
    component,
    propValues,
    childrenText,
    childrenMode,
    childrenFixtureKey,
    fixtures,
    meta,
    fixtureOverrides,
    wrapperPropsMap,
    registry,
    wrapper: Wrapper,
  } = options

  // ── Load main component ──────────────────────────────────────────
  const [loaded, setLoaded] = useState<{
    name: string
    // biome-ignore lint/suspicious/noExplicitAny: loaded component has dynamic props determined at runtime
    Component: ComponentType<any>
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    const name = component.displayName
    const loader = registry[name]
    if (!loader) {
      setLoaded(null)
      setError(`No registry entry for "${name}"`)
      return
    }
    let cancelled = false
    loader()
      .then((Comp) => {
        if (!cancelled) setLoaded({ name, Component: Comp })
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })
    return () => {
      cancelled = true
    }
  }, [component.displayName, registry])

  // ── Load wrapper components ──────────────────────────────────────
  // biome-ignore lint/suspicious/noExplicitAny: wrapper components have dynamic props determined at runtime
  const [compWrappers, setCompWrappers] = useState<Map<string, ComponentType<any>>>(new Map())

  useEffect(() => {
    const wrappers = component.wrapperComponents
    if (!wrappers || wrappers.length === 0) {
      setCompWrappers(new Map())
      return
    }
    let cancelled = false
    const loadAll = async () => {
      const entries = await Promise.all(
        wrappers.map(async (w) => {
          const loader = registry[w.displayName]
          if (!loader) return null
          try {
            const Comp = await loader()
            return [w.displayName, Comp] as const
          } catch {
            return null
          }
        }),
      )
      if (!cancelled) {
        // biome-ignore lint/suspicious/noExplicitAny: wrapper components have dynamic props determined at runtime
        const map = new Map<string, ComponentType<any>>()
        for (const entry of entries) {
          if (entry) map.set(entry[0], entry[1])
        }
        setCompWrappers(map)
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [component.wrapperComponents, registry])

  const LoadedComponent = loaded && loaded.name === component.displayName ? loaded.Component : null

  const wrappersReady =
    !component.wrapperComponents ||
    component.wrapperComponents.length === 0 ||
    component.wrapperComponents.every((w) => compWrappers.has(w.displayName))

  // ── Resolve props ────────────────────────────────────────────────
  const resolveProps = useCallback(
    (pv: Record<string, unknown>) => {
      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(pv)) {
        if (value === undefined || value === null) continue

        const propMeta = component.props[key]
        const controlType = propMeta ? resolveControlType(propMeta) : null

        if (controlType === 'component' && typeof value === 'string') {
          const isIcon = propMeta?.componentKind === 'icon'

          if (!isIcon && value.startsWith('components/')) {
            const slotKey = `prop:${key}`
            result[key] = renderComponentFixture(
              value,
              fixtureOverrides[slotKey],
              meta,
              registry,
              fixtures,
            )
            continue
          }

          const resolved = resolveFixtureValue(value, fixtures, isIcon)
          if (resolved !== undefined) {
            result[key] = resolved
          } else if (!isIcon && value) {
            result[key] = value
          }
          continue
        }

        if (controlType === 'array' && Array.isArray(value) && propMeta) {
          const itemInfo = getArrayItemType(propMeta)
          if (itemInfo?.isComponent) {
            result[key] = value
              .map((item) => {
                if (typeof item !== 'string') return item
                return resolveFixtureValue(item, fixtures, true) ?? item
              })
              .filter(Boolean)
            continue
          }

          if (itemInfo?.structuredFields) {
            result[key] = value.map((item) => {
              if (typeof item !== 'object' || item === null) return item
              const obj = { ...(item as Record<string, unknown>) }
              for (const field of itemInfo.structuredFields!) {
                if (field.isComponent && typeof obj[field.name] === 'string') {
                  const isIcon = field.componentKind === 'icon'
                  const resolved = resolveFixtureValue(obj[field.name] as string, fixtures, isIcon)
                  if (resolved !== undefined) {
                    obj[field.name] = resolved
                  }
                }
              }
              return obj
            })
            continue
          }
        }

        result[key] = value
      }
      return result
    },
    [component.props, fixtures, fixtureOverrides, meta, registry],
  )

  const cleanProps = useMemo(() => resolveProps(propValues), [resolveProps, propValues])

  // ── Resolve children ─────────────────────────────────────────────
  const resolvedChildren = useMemo(() => {
    if (!component.acceptsChildren) return undefined
    if (childrenMode === 'fixture' && childrenFixtureKey) {
      if (childrenFixtureKey.startsWith('components/')) {
        return renderComponentFixture(
          childrenFixtureKey,
          fixtureOverrides.children,
          meta,
          registry,
          fixtures,
        ) as ReactNode
      }
      return resolveFixtureValue(childrenFixtureKey, fixtures) as ReactNode
    }
    return childrenText || undefined
  }, [
    component.acceptsChildren,
    childrenMode,
    childrenFixtureKey,
    childrenText,
    fixtures,
    fixtureOverrides,
    meta,
    registry,
  ])

  // ── Wrap rendered element ────────────────────────────────────────
  const wrapElement = useCallback(
    (element: ReactNode): ReactNode => {
      let rendered = element
      const wrappers = component.wrapperComponents
      if (wrappers) {
        for (let i = wrappers.length - 1; i >= 0; i--) {
          const w = wrappers[i]
          const WrapComp = compWrappers.get(w.displayName)
          if (WrapComp) {
            const props = wrapperPropsMap[w.displayName] ?? {}
            rendered = <WrapComp {...props}>{rendered}</WrapComp>
          }
        }
      }
      return Wrapper ? <Wrapper>{rendered}</Wrapper> : rendered
    },
    [component.wrapperComponents, compWrappers, wrapperPropsMap, Wrapper],
  )

  return {
    LoadedComponent,
    wrappersReady,
    error,
    cleanProps,
    resolvedChildren,
    resolveProps,
    wrapElement,
  }
}
