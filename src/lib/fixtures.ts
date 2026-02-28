/**
 * Fixture resolution utilities.
 *
 * Builds on the plugin system to provide component-level fixture generation,
 * eager component loading, and code generation helpers.
 */

import {
  type ComponentType,
  createElement,
  forwardRef,
  type ReactNode,
  useEffect,
  useState,
} from 'react'
import type { JcMeta, JcPlugin, JcPropMeta, JcResolvedPluginItem } from '../types.js'
import { generateDefaults, generateFakeChildren } from './faker-map.js'
import { getPluginForProp, resolveItemValue, resolvePluginItems, resolveValueMode } from './plugins.js'
import {
  COMPONENT_FIXTURE_CATEGORY,
  COMPONENT_FIXTURE_PREFIX,
  EAGER_LOADER_CHILDREN_KEY,
  EAGER_LOADER_PROPS_KEY,
  toPascalCase,
} from './utils.js'

/**
 * Render a component fixture with custom override props.
 * Instead of using the static `render()` from the item, this loads the
 * component lazily and applies the provided overrides for interactive editing.
 */
export function renderComponentFixture(
  qualifiedKey: string,
  overrides: { props: Record<string, unknown>; childrenText: string } | undefined,
  meta: JcMeta,
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>,
  plugins: JcPlugin[],
  resolvedItems: JcResolvedPluginItem[],
): ReactNode {
  // Extract component name from "components/Button" → "Button"
  const compName = qualifiedKey.startsWith(COMPONENT_FIXTURE_PREFIX)
    ? qualifiedKey.slice(COMPONENT_FIXTURE_PREFIX.length)
    : qualifiedKey
  const comp = meta.components.find((c) => c.displayName === compName)
  if (!comp || !registry[compName]) return null

  const Eager = getEagerLoader(compName, registry[compName])

  // Build resolved props from overrides
  const resolvedProps: Record<string, unknown> = {
    ...(overrides?.props ?? generateDefaults(comp, plugins, resolvedItems)),
  }

  // Resolve constructor-type fixture keys to actual constructors
  for (const [propName, prop] of Object.entries(comp.props)) {
    if (typeof resolvedProps[propName] === 'string') {
      const matchingPlugin = getPluginForProp(prop, plugins)
      if (matchingPlugin && resolveValueMode(matchingPlugin) === 'constructor') {
        const resolved = resolveItemValue(resolvedProps[propName] as string, resolvedItems, true)
        if (resolved !== undefined) resolvedProps[propName] = resolved
      }
    }
  }

  const children =
    overrides?.childrenText ?? (comp.acceptsChildren ? generateFakeChildren(compName) : undefined)

  return createElement(Eager, {
    [EAGER_LOADER_PROPS_KEY]: resolvedProps,
    [EAGER_LOADER_CHILDREN_KEY]: children || undefined,
  })
}

/** Convert a qualified key to a readable JSX code string, e.g. 'lucide/star' → '<Star />' */
export function fixtureToCodeString(
  qualifiedKey: string,
  items: JcResolvedPluginItem[],
): string {
  if (!qualifiedKey) return ''
  const item = items.find((i) => i.qualifiedKey === qualifiedKey)
  if (!item) return qualifiedKey

  return `<${toPascalCase(item.label)} />`
}

// ── Eager component loading ───────────────────────────────────
//
// Components are loaded eagerly (not via React.lazy + Suspense) so that
// the rendered element is a plain component — not wrapped in Suspense.
//
// Critical design: The EagerLoader separates "component props" (stored in
// __jcProps/__jcChildren) from "external props" (added by cloneElement when
// used with Radix's asChild/Slot pattern). This allows components that
// don't forward arbitrary props (no ...rest spread) to still work as
// triggers — external props like onClick, aria-*, data-* go to a
// transparent <span style="display:contents"> wrapper, while the real
// component only receives its own declared props.

/** Cache for resolved (loaded) component constructors */
// biome-ignore lint/suspicious/noExplicitAny: dynamic component module shape
const resolvedCompCache = new Map<string, ComponentType<any>>()

/** Cache for forwardRef eager-loader wrapper components */
// biome-ignore lint/suspicious/noExplicitAny: wrapper accepts arbitrary props from host components
const eagerLoaderCache = new Map<string, ComponentType<any>>()

/**
 * Get or create a forwardRef wrapper component that:
 * 1. Eagerly loads the real component via the registry loader
 * 2. Renders the real component directly once loaded (no Suspense)
 * 3. Wraps in a transparent DOM element so cloneElement (Radix asChild)
 *    can attach event handlers even if the component doesn't forward props
 *
 * Elements should be created with `__jcProps` and `__jcChildren` instead
 * of regular props, so external props from cloneElement are kept separate.
 */
function getEagerLoader(
  name: string,
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  loader: () => Promise<ComponentType<any>>,
  // biome-ignore lint/suspicious/noExplicitAny: wrapper component accepts arbitrary prop shapes
): ComponentType<any> {
  const existing = eagerLoaderCache.get(name)
  if (existing) return existing

  // Kick off loading immediately (not just on mount)
  if (!resolvedCompCache.has(name)) {
    loader().then((mod) => {
      // biome-ignore lint/suspicious/noExplicitAny: dynamic module default export
      const resolved = 'default' in mod ? (mod as any).default : mod
      resolvedCompCache.set(name, resolved)
    })
  }

  // biome-ignore lint/suspicious/noExplicitAny: wrapper forwards arbitrary props to the loaded component
  const EagerLoader = forwardRef<unknown, any>((props, ref) => {
    // Separate component-specific props from external props (added by Slot/cloneElement)
    const {
      [EAGER_LOADER_PROPS_KEY]: __jcProps,
      [EAGER_LOADER_CHILDREN_KEY]: __jcChildren,
      ...externalProps
    } = props

    // biome-ignore lint/suspicious/noExplicitAny: dynamic component with unknown prop shape
    const [Comp, setComp] = useState<ComponentType<any> | null>(
      () => resolvedCompCache.get(name) ?? null,
    )

    useEffect(() => {
      if (Comp) return
      loader().then((mod) => {
        // biome-ignore lint/suspicious/noExplicitAny: dynamic module default export
        const resolved = 'default' in mod ? (mod as any).default : mod
        resolvedCompCache.set(name, resolved)
        setComp(() => resolved)
      })
    }, [Comp])

    // External props (onClick, aria-*, data-* from Slot) go on the wrapper span
    // so they reach a real DOM element even if the component doesn't forward them
    if (!Comp) {
      return createElement('span', { ...externalProps, ref }, `Loading ${name}…`)
    }
    return createElement(
      'span',
      { ...externalProps, ref, style: { display: 'contents', ...externalProps.style } },
      createElement(Comp, __jcProps ?? {}, __jcChildren),
    )
  })

  EagerLoader.displayName = `Eager(${name})`
  eagerLoaderCache.set(name, EagerLoader)
  return EagerLoader
}

// ── Auto-generated component fixtures ────────────────────────

/**
 * Build a plugin that exposes every extracted component as a plugin item.
 * Each component is rendered with its smart defaults (via `generateDefaults`)
 * and eagerly loaded (no Suspense wrapper) for compatibility with Radix asChild.
 *
 * This allows ReactNode/element slots in the showcase to offer
 * "pick another component" in fixture mode without manual setup.
 *
 * Returns a JcPlugin with priority -1 so user plugins always win.
 */
export function buildComponentFixturesPlugin(
  meta: JcMeta,
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>,
  basePlugins: JcPlugin[],
  baseItems: JcResolvedPluginItem[],
): JcPlugin {
  const items = meta.components
    .filter((comp) => registry[comp.displayName])
    .map((comp) => {
      const name = comp.displayName
      return {
        key: name,
        label: name,
        value: null, // Component fixtures don't use a static value
      }
    })

  return {
    name: COMPONENT_FIXTURE_CATEGORY,
    match: { kinds: ['element', 'node'] },
    valueMode: 'element' as const,
    priority: -1,
    items,
  }
}

/**
 * Resolve component fixture items with proper render() functions.
 * This is separate from buildComponentFixturesPlugin because the render
 * functions need access to the registry and base fixtures at call time.
 */
export function resolveComponentFixtureItems(
  meta: JcMeta,
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>,
  basePlugins: JcPlugin[],
  baseItems: JcResolvedPluginItem[],
): JcResolvedPluginItem[] {
  return meta.components
    .filter((comp) => registry[comp.displayName])
    .map((comp) => {
      const name = comp.displayName
      const Eager = getEagerLoader(name, registry[name])

      return {
        key: name,
        label: name,
        value: null,
        pluginName: COMPONENT_FIXTURE_CATEGORY,
        qualifiedKey: `${COMPONENT_FIXTURE_CATEGORY}/${name}`,
        keywords: undefined,
        render: (): ReactNode => {
          const defaults = generateDefaults(comp, basePlugins, baseItems)

          // Resolve constructor-type fixture keys to actual constructors
          const resolvedProps: Record<string, unknown> = { ...defaults }
          for (const [propName, prop] of Object.entries(comp.props)) {
            if (typeof resolvedProps[propName] === 'string') {
              const matchingPlugin = getPluginForProp(prop, basePlugins)
              if (matchingPlugin && resolveValueMode(matchingPlugin) === 'constructor') {
                const resolved = resolveItemValue(
                  resolvedProps[propName] as string,
                  baseItems,
                  true,
                )
                if (resolved !== undefined) resolvedProps[propName] = resolved
              }
            }
          }

          // Generate children text if the component accepts children
          const children = comp.acceptsChildren ? generateFakeChildren(name) : undefined

          return createElement(Eager, {
            [EAGER_LOADER_PROPS_KEY]: resolvedProps,
            [EAGER_LOADER_CHILDREN_KEY]: children,
          })
        },
        renderPreview: (): ReactNode => {
          // For component fixtures, renderPreview shows a small text label
          return createElement('span', { style: { fontSize: '9px', opacity: 0.6 } }, name)
        },
        getValue: () => null,
      }
    })
}
