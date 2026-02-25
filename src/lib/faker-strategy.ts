/**
 * FakerStrategy — extensible interface for generating smart default values.
 *
 * Built-in heuristics in faker-map.ts serve as the default fallback.
 * Consumers register custom strategies via config to handle domain-specific
 * prop names (e.g. IBAN, VAT number, SIRET) without forking the library.
 *
 * @example
 * import { defineFakerStrategy } from 'jc'
 * import { faker } from '@faker-js/faker'
 *
 * const financeStrategy = defineFakerStrategy({
 *   name: 'finance',
 *   priority: 10,
 *   match: (name) => /iban|bic|swift/i.test(name),
 *   generate: (name) => {
 *     if (name.toLowerCase().includes('iban')) return faker.finance.iban()
 *     if (name.toLowerCase().includes('bic')) return faker.finance.bic()
 *     return faker.finance.accountNumber()
 *   },
 * })
 */

import type { JcPropMeta } from '../types.js'

/** A strategy for generating fake prop values */
export interface FakerStrategy {
  /** Strategy name for debugging */
  name: string
  /** Higher priority runs first (default: 0) */
  priority?: number
  /** Return true if this strategy can handle the given prop */
  match(propName: string, prop: JcPropMeta): boolean
  /** Generate a value. Return undefined to skip to the next strategy. */
  generate(propName: string, prop: JcPropMeta): unknown
}

/**
 * Create a resolver that runs strategies in priority order.
 * The first strategy that matches AND returns a non-undefined value wins.
 * Falls back to the built-in generator when no custom strategy matches.
 */
export function createFakerResolver(
  customStrategies?: FakerStrategy[],
  builtinGenerator?: (propName: string, prop: JcPropMeta) => unknown,
): (propName: string, prop: JcPropMeta) => unknown {
  if (!customStrategies || customStrategies.length === 0) {
    return builtinGenerator ?? (() => undefined)
  }

  // Sort by priority descending (higher = runs first)
  const sorted = [...customStrategies].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  return (propName: string, prop: JcPropMeta): unknown => {
    for (const strategy of sorted) {
      if (strategy.match(propName, prop)) {
        const value = strategy.generate(propName, prop)
        if (value !== undefined) return value
      }
    }
    // Fall back to built-in generator
    return builtinGenerator?.(propName, prop)
  }
}

/** Helper to define a faker strategy with type safety */
export function defineFakerStrategy(strategy: FakerStrategy): FakerStrategy {
  return strategy
}
