/**
 * Fixture resolution utilities.
 *
 * Host apps provide JcFixturePlugin[] → this module flattens them into
 * JcResolvedFixture[] with qualified keys ('pluginName/key') that are
 * stored in prop values and resolved to real ReactNodes at render time.
 */

import type { JcFixturePlugin, JcResolvedFixture } from '../types.js'
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
