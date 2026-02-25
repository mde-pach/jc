'use client'

import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ChildItem, JcComponentMeta, JcMeta, JcPlugin, JcPropMeta, JcResolvedPluginItem } from '../types.js'
import { getArrayItemType, resolveControlType } from './faker-map.js'
import { renderComponentFixture } from './fixtures.js'
import { getPluginForProp, resolveItemValue } from './plugins.js'
import type { FixtureOverride } from './use-showcase-state.js'

interface UseResolvedComponentOptions {
  component: JcComponentMeta
  propValues: Record<string, unknown>
  childrenItems: ChildItem[]
  resolvedItems: JcResolvedPluginItem[]
  plugins: JcPlugin[]
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
    childrenItems,
    resolvedItems,
    plugins,
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
          const matchingPlugin = propMeta ? getPluginForProp(propMeta, plugins) : null
          const passAsConstructor = matchingPlugin?.asConstructor ?? false

          if (!passAsConstructor && value.startsWith('components/')) {
            const slotKey = `prop:${key}`
            result[key] = renderComponentFixture(
              value,
              fixtureOverrides[slotKey],
              meta,
              registry,
              plugins,
              resolvedItems,
            )
            continue
          }

          const resolved = resolveItemValue(value, resolvedItems, passAsConstructor)
          if (resolved !== undefined) {
            result[key] = resolved
          } else if (!passAsConstructor && value) {
            result[key] = value
          }
          continue
        }

        // Defensive guard: ensure array props always receive arrays
        if (controlType === 'array' && propMeta) {
          if (!Array.isArray(value)) {
            // Try to parse string representations of arrays (e.g. from defaultValue)
            if (typeof value === 'string') {
              try {
                const parsed = JSON.parse(value)
                if (Array.isArray(parsed)) {
                  result[key] = parsed
                  continue
                }
              } catch {
                // Not valid JSON — skip this prop
              }
            }
            continue // Skip non-array values for array props
          }
        }

        if (controlType === 'array' && Array.isArray(value) && propMeta) {
          const itemInfo = getArrayItemType(propMeta)
          if (itemInfo?.isComponent) {
            result[key] = value
              .map((item) => {
                if (typeof item !== 'string') return item
                return resolveItemValue(item, resolvedItems, true) ?? item
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
                  // Synthesize a minimal prop to find the matching plugin
                  const synthProp = { name: field.name, type: field.type, componentKind: field.componentKind } as JcPropMeta
                  const fieldPlugin = getPluginForProp(synthProp, plugins)
                  const passAsConstructor = fieldPlugin?.asConstructor ?? false
                  const resolved = resolveItemValue(obj[field.name] as string, resolvedItems, passAsConstructor)
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
    [component.props, resolvedItems, plugins, fixtureOverrides, meta, registry],
  )

  const cleanProps = useMemo(() => resolveProps(propValues), [resolveProps, propValues])

  // ── Resolve children ─────────────────────────────────────────────
  const resolvedChildren = useMemo(() => {
    if (!component.acceptsChildren || childrenItems.length === 0) return undefined

    const resolveItem = (item: ChildItem, index: number): ReactNode => {
      if (item.type === 'fixture' && item.value) {
        if (item.value.startsWith('components/')) {
          const slotKey = `children:${index}`
          return renderComponentFixture(
            item.value,
            fixtureOverrides[slotKey],
            meta,
            registry,
            plugins,
            resolvedItems,
          ) as ReactNode
        }
        return resolveItemValue(item.value, resolvedItems) as ReactNode
      }
      return item.value || undefined
    }

    if (childrenItems.length === 1) {
      return resolveItem(childrenItems[0], 0)
    }

    // Multiple children: resolve each and return as fragment array
    const resolved = childrenItems.map((item, i) => resolveItem(item, i)).filter(Boolean)
    return resolved.length > 0 ? resolved : undefined
  }, [component.acceptsChildren, childrenItems, resolvedItems, plugins, fixtureOverrides, meta, registry])

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
