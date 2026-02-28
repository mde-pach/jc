'use client'

import {
  type ComponentType,
  type ReactNode,
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ChildItem, JcComponentMeta, JcMeta, JcPlugin, JcPropMeta, JcResolvedPluginItem } from '../types.js'
import { generateDefaults, generateFakeChildren, getArrayItemType, resolveControlType } from './faker-map.js'
import { renderComponentFixture } from './fixtures.js'
import { getPluginForProp, resolveItemValue, resolveValueMode } from './plugins.js'
import type { FixtureOverride } from './use-showcase-state.js'

/** Safe placeholder for required component-type props with no matching plugin */
function PlaceholderComponent(_props: Record<string, unknown>) {
  return createElement(
    'span',
    {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1em',
        height: '1em',
        borderRadius: '2px',
        border: '1px dashed currentColor',
        opacity: 0.3,
        fontSize: '0.7em',
      },
      title: 'No plugin configured for this prop type',
    },
    '?',
  )
}

/**
 * Cache + factory for direct-forwarding loader components.
 * Unlike the Eager loader in fixtures.ts (which uses __jcProps for Radix asChild),
 * this creates a component that bakes in fixture defaults and merges with external props.
 * Used for element-kind props where the host does `<Icon size={16} />`.
 *
 * Keyed by `name + JSON(baseProps)` so different fixture override states get separate components.
 */
// biome-ignore lint/suspicious/noExplicitAny: wrapper accepts arbitrary props from host components
const directLoaderCache = new Map<string, ComponentType<any>>()

function getDirectLoader(
  name: string,
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  loader: () => Promise<ComponentType<any>>,
  baseProps: Record<string, unknown>,
  // biome-ignore lint/suspicious/noExplicitAny: wrapper component accepts arbitrary prop shapes
): ComponentType<any> {
  const cacheKey = `${name}:${JSON.stringify(baseProps)}`
  const existing = directLoaderCache.get(cacheKey)
  if (existing) return existing

  // biome-ignore lint/suspicious/noExplicitAny: wrapper forwards arbitrary props to the loaded component
  function DirectLoader(props: any) {
    // biome-ignore lint/suspicious/noExplicitAny: dynamic component with unknown prop shape
    const [Comp, setComp] = useState<ComponentType<any> | null>(null)

    useEffect(() => {
      loader().then((mod) => {
        // biome-ignore lint/suspicious/noExplicitAny: dynamic module default export
        const resolved = 'default' in mod ? (mod as any).default : mod
        setComp(() => resolved)
      })
    }, [])

    if (!Comp) return null
    // Fixture defaults as base, host props override (e.g. size={16} from <Icon size={16} />)
    return createElement(Comp, { ...baseProps, ...props })
  }

  DirectLoader.displayName = `Direct(${name})`
  directLoaderCache.set(cacheKey, DirectLoader)
  return DirectLoader
}

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

      // First pass: handle all props with values
      for (const [key, value] of Object.entries(pv)) {
        if (value === undefined || value === null) continue

        const propMeta = component.props[key]
        const controlType = propMeta ? resolveControlType(propMeta) : null

        if (controlType === 'component' && typeof value === 'string') {
          const matchingPlugin = propMeta ? getPluginForProp(propMeta, plugins) : null
          const passAsConstructor = matchingPlugin ? resolveValueMode(matchingPlugin) === 'constructor' : false

          if (!passAsConstructor && value.startsWith('components/')) {
            const compName = value.slice('components/'.length)
            if (propMeta?.componentKind === 'element' && registry[compName]) {
              // element-kind props are used as constructors (<Icon size={16} />)
              // → pass a direct-forwarding loader with baked-in fixture defaults
              const fixtureMeta = meta.components.find((c) => c.displayName === compName)
              const slotKey = `prop:${key}`
              const overrides = fixtureOverrides[slotKey]
              const baseProps = overrides?.props
                ?? (fixtureMeta ? generateDefaults(fixtureMeta, plugins, resolvedItems) : {})
              const baseChildren = overrides?.childrenText
                ?? (fixtureMeta?.acceptsChildren ? generateFakeChildren(compName) : undefined)
              result[key] = getDirectLoader(compName, registry[compName], {
                ...baseProps,
                ...(baseChildren ? { children: baseChildren } : {}),
              })
            } else {
              // node-kind props are used as rendered elements ({content})
              const slotKey = `prop:${key}`
              result[key] = renderComponentFixture(
                value,
                fixtureOverrides[slotKey],
                meta,
                registry,
                plugins,
                resolvedItems,
              )
            }
            continue
          }

          const resolved = resolveItemValue(value, resolvedItems, passAsConstructor)
          if (resolved !== undefined) {
            result[key] = resolved
          } else if (propMeta?.required) {
            // Required component prop with no matching plugin — safe placeholder.
            // element-kind props are used as constructors (<Icon />), node-kind as rendered elements ({content}).
            const needsConstructor = passAsConstructor || propMeta.componentKind === 'element'
            result[key] = needsConstructor ? PlaceholderComponent : createElement(PlaceholderComponent)
          }
          // If unresolvable and optional, skip — don't pass raw fixture keys as prop values
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
                  const passAsConstructor = fieldPlugin ? resolveValueMode(fieldPlugin) === 'constructor' : false
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

      // Second pass: inject placeholders for required component-type props that have no value.
      // element-kind props are used as constructors (<Icon />), node-kind as rendered elements ({content}).
      for (const [key, propMeta] of Object.entries(component.props)) {
        if (key in result) continue
        if (!propMeta.required || !propMeta.componentKind) continue
        const controlType = resolveControlType(propMeta)
        if (controlType !== 'component') continue
        result[key] = propMeta.componentKind === 'element'
          ? PlaceholderComponent
          : createElement(PlaceholderComponent)
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
      if (item.type === 'element') {
        const innerChildren = item.elementChildren?.map((c, i) => resolveItem(c, i))
        return createElement(item.value, item.elementProps ?? null, ...(innerChildren ?? []))
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
