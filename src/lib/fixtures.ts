/**
 * Fixture resolution utilities.
 *
 * Host apps provide JcFixturePlugin[] → this module flattens them into
 * JcResolvedFixture[] with qualified keys ('pluginName/key') that are
 * stored in prop values and resolved to real ReactNodes at render time.
 */

import {
  type ComponentType,
  createElement,
  forwardRef,
  type ReactNode,
  useEffect,
  useState,
} from 'react'
import type { JcFixturePlugin, JcMeta, JcResolvedFixture } from '../types.js'
import { generateDefaults, generateFakeChildren } from './faker-map.js'
import { toPascalCase } from './utils.js'

/**
 * Flatten an array of fixture plugins into a single resolved list.
 * Each fixture receives a `qualifiedKey` ('pluginName/key') and `pluginName`.
 */
export function resolveFixturePlugins(plugins: JcFixturePlugin[] | undefined): JcResolvedFixture[] {
  if (!plugins || plugins.length === 0) return []

  const resolved: JcResolvedFixture[] = []
  for (const plugin of plugins) {
    for (const fixture of plugin.fixtures) {
      resolved.push({
        ...fixture,
        pluginName: plugin.name,
        qualifiedKey: `${plugin.name}/${fixture.key}`,
      })
    }
  }
  return resolved
}

/**
 * Look up a fixture by its qualified key.
 * If `asConstructor` is true and the fixture has a `component` field,
 * returns the raw component constructor (for icon-kind props like LucideIcon).
 * Otherwise calls render() to return a ReactElement.
 */
export function resolveFixtureValue(
  qualifiedKey: string | null | undefined,
  fixtures: JcResolvedFixture[],
  asConstructor?: boolean,
): unknown {
  if (!qualifiedKey) return undefined
  const fixture = fixtures.find((f) => f.qualifiedKey === qualifiedKey)
  if (!fixture) return undefined
  if (asConstructor && fixture.component) return fixture.component
  return fixture.render()
}

/**
 * Render a component fixture with custom override props.
 * Instead of using the static `render()` from the fixture, this loads the
 * component lazily and applies the provided overrides for interactive editing.
 */
export function renderComponentFixture(
  qualifiedKey: string,
  overrides: { props: Record<string, unknown>; childrenText: string } | undefined,
  meta: JcMeta,
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>,
  baseFixtures: JcResolvedFixture[],
): ReactNode {
  // Extract component name from "components/Button" → "Button"
  const compName = qualifiedKey.startsWith('components/')
    ? qualifiedKey.slice('components/'.length)
    : qualifiedKey
  const comp = meta.components.find((c) => c.displayName === compName)
  if (!comp || !registry[compName]) return null

  const Eager = getEagerLoader(compName, registry[compName])

  // Build resolved props from overrides
  const resolvedProps: Record<string, unknown> = {
    ...(overrides?.props ?? generateDefaults(comp, baseFixtures)),
  }

  // Resolve icon fixture keys to actual constructors
  for (const [propName, prop] of Object.entries(comp.props)) {
    if (prop.componentKind === 'icon' && typeof resolvedProps[propName] === 'string') {
      const resolved = resolveFixtureValue(resolvedProps[propName] as string, baseFixtures, true)
      if (resolved !== undefined) resolvedProps[propName] = resolved
    }
  }

  const children =
    overrides?.childrenText ?? (comp.acceptsChildren ? generateFakeChildren(compName) : undefined)

  return createElement(Eager, { __jcProps: resolvedProps, __jcChildren: children || undefined })
}

/** Convert a qualified key to a readable JSX code string, e.g. 'lucide/star' → '<Star />' */
export function fixtureToCodeString(qualifiedKey: string, fixtures: JcResolvedFixture[]): string {
  if (!qualifiedKey) return ''
  const fixture = fixtures.find((f) => f.qualifiedKey === qualifiedKey)
  if (!fixture) return qualifiedKey

  return `<${toPascalCase(fixture.label)} />`
}

/**
 * Filter fixtures whose `category` matches a `componentKind`.
 * Handles singular/plural mismatches (e.g. kind 'icon' matches category 'icons').
 * If no category-specific matches exist, returns all fixtures as fallback.
 */
export function getFixturesForKind(
  fixtures: JcResolvedFixture[],
  componentKind?: string,
): JcResolvedFixture[] {
  if (!componentKind) return fixtures
  // Match category to kind — if fixture has category 'icons', kind 'icon' matches
  const kindLower = componentKind.toLowerCase()
  const filtered = fixtures.filter((f) => {
    if (!f.category) return true
    const cat = f.category.toLowerCase()
    return cat === kindLower || cat === `${kindLower}s` || kindLower.startsWith(cat)
  })
  return filtered.length > 0 ? filtered : fixtures
}

/**
 * Identity helper for type-safe fixture plugin definition in host apps.
 * @example
 * export const lucide = defineFixtures({ name: 'lucide', fixtures: [...] })
 */
export function defineFixtures(plugin: JcFixturePlugin): JcFixturePlugin {
  return plugin
}

/** Get the first fixture key matching a component kind, or undefined */
export function getDefaultFixtureKey(
  fixtures: JcResolvedFixture[],
  componentKind?: string,
): string | undefined {
  const matching = getFixturesForKind(fixtures, componentKind)
  return matching[0]?.qualifiedKey
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
    const { __jcProps, __jcChildren, ...externalProps } = props

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
 * Build a fixture plugin that exposes every extracted component as a fixture.
 * Each component is rendered with its smart defaults (via `generateDefaults`)
 * and eagerly loaded (no Suspense wrapper) for compatibility with Radix asChild.
 *
 * This allows ReactNode/element slots in the showcase to offer
 * "pick another component" in fixture mode without manual setup.
 */
export function buildComponentFixtures(
  meta: JcMeta,
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>,
  baseFixtures: JcResolvedFixture[],
): JcFixturePlugin {
  const fixtures = meta.components
    .filter((comp) => registry[comp.displayName])
    .map((comp) => {
      const name = comp.displayName
      const Eager = getEagerLoader(name, registry[name])

      return {
        key: name,
        label: name,
        category: 'components',
        render: (): ReactNode => {
          const defaults = generateDefaults(comp, baseFixtures)

          // Resolve icon fixture keys to actual constructors
          const resolvedProps: Record<string, unknown> = { ...defaults }
          for (const [propName, prop] of Object.entries(comp.props)) {
            if (prop.componentKind === 'icon' && typeof resolvedProps[propName] === 'string') {
              const resolved = resolveFixtureValue(
                resolvedProps[propName] as string,
                baseFixtures,
                true,
              )
              if (resolved !== undefined) resolvedProps[propName] = resolved
            }
          }

          // Generate children text if the component accepts children
          const children = comp.acceptsChildren ? generateFakeChildren(name) : undefined

          return createElement(Eager, { __jcProps: resolvedProps, __jcChildren: children })
        },
      }
    })

  return { name: 'components', fixtures }
}
