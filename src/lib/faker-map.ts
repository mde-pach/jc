/**
 * Faker heuristics — maps prop name + type → realistic fake value.
 */

import { faker } from '@faker-js/faker'
import type {
  JcComponentMeta,
  JcControlType,
  JcPlugin,
  JcPropMeta,
  JcResolvedPluginItem,
  JcStructuredField,
} from '../types.js'
import { getDefaultItemKey, getPluginForProp } from './plugins.js'

/** Determine the control type for a prop */
export function resolveControlType(prop: JcPropMeta): JcControlType {
  // Component-type props get a dedicated control
  if (prop.componentKind) return 'component'

  // Props with pre-extracted structured fields — array or object based on type
  if (prop.structuredFields) {
    return prop.type.endsWith('[]') ? 'array' : 'object'
  }

  if (prop.values && prop.values.length > 0) return 'select'
  if (prop.type === 'boolean') return 'boolean'
  if (prop.type === 'number') return 'number'
  // Standalone ReactNode/Element props are component slots, but structured
  // objects containing ReactNode (e.g. `{ label: string; content: ReactNode }[]`)
  // are data — they should use json/array controls, not the component picker.
  if (
    /ReactNode|ReactElement|JSX\.Element|Element/.test(prop.type) &&
    !prop.type.startsWith('{') &&
    !prop.type.startsWith('Array<{') &&
    !/^\{[^}]*\}\[\]$/.test(prop.type)
  )
    return 'component'
  if (prop.type.includes('=>') || prop.type.includes('Function')) return 'readonly'

  // Any T[] type gets the generic array control
  if (prop.type.endsWith('[]')) return 'array'

  if (prop.type.startsWith('{') || prop.type.startsWith('Array') || prop.type.startsWith('Record'))
    return 'json'
  if (prop.type === 'string' || prop.type === 'enum') return 'text'
  return 'text'
}

/**
 * Extract the base item type from an array prop type string.
 * Returns the item type ('string', 'number', etc.) or null if not an array.
 *
 * Also resolves the item "kind" — is each item a primitive, or a component/icon?
 * Prefers pre-extracted `structuredFields` from the AST; falls back to string parsing.
 */
export function getArrayItemType(prop: JcPropMeta): {
  itemType: string
  isComponent: boolean
  structuredFields?: JcStructuredField[]
} | null {
  if (!prop.type.endsWith('[]')) return null
  const itemType = prop.type.slice(0, -2)

  // Check if the item type is a component (icon, element, etc.)
  // Structured object types (e.g. `{ label: string; content: ReactNode }`) are data, not components
  const isStructuredObject = itemType.startsWith('{') || itemType.startsWith('Array<{')
  const isComponent =
    !isStructuredObject &&
    (/ReactNode|ReactElement|JSX\.Element|Element/.test(itemType) ||
      !!(prop.rawType && /Icon|Component|Element/.test(prop.rawType)))

  // Structured fields are pre-extracted at CLI time via the TypeScript type checker
  const structuredFields = prop.structuredFields

  return { itemType, isComponent, structuredFields }
}

/** Generate a smart default value for a prop based on name + type heuristics */
export function generateFakeValue(propName: string, prop: JcPropMeta): unknown {
  const name = propName.toLowerCase()

  // Component-type props are resolved via the fixture system — no default here
  if (prop.componentKind || resolveControlType(prop) === 'component') {
    return undefined
  }

  if (prop.defaultValue !== undefined) {
    if (prop.type === 'boolean') return prop.defaultValue === 'true'
    if (prop.type === 'number') return Number(prop.defaultValue)
    // Array types: try to parse JSON defaultValue, fall through to generation if not valid
    if (prop.type.endsWith('[]')) {
      try {
        const parsed = JSON.parse(prop.defaultValue)
        if (Array.isArray(parsed)) return parsed
      } catch {
        // Not valid JSON — fall through to array generation below
      }
    } else {
      return prop.defaultValue
    }
  }

  // Optional enum props start unselected; required ones pick the first value
  if (prop.values && prop.values.length > 0) {
    return prop.required ? prop.values[0] : undefined
  }
  if (prop.type === 'boolean') return false

  if (prop.type === 'number') {
    if (name.includes('count') || name.includes('total'))
      return faker.number.int({ min: 1, max: 100 })
    if (name.includes('page')) return 1
    if (name.includes('max') || name.includes('total')) return 10
    if (name.includes('percent') || name.includes('progress')) return 65
    if (name.includes('price') || name.includes('amount'))
      return faker.number.float({ min: 1, max: 999, fractionDigits: 2 })
    if (name.includes('rating') || name.includes('score'))
      return faker.number.float({ min: 1, max: 5, fractionDigits: 1 })
    return faker.number.int({ min: 0, max: 100 })
  }

  // Array types — generate defaults based on item type
  if (prop.type.endsWith('[]')) {
    const info = getArrayItemType(prop)
    if (!info) return []

    // Component arrays start empty — user adds via picker
    if (info.isComponent) return []

    // Structured object arrays → generate per-field defaults
    if (info.structuredFields) {
      const makeItem = () => {
        const obj: Record<string, unknown> = {}
        for (const field of info.structuredFields!) {
          if (field.isComponent) {
            obj[field.name] = undefined // resolved via fixture system
          } else {
            // Build a synthetic JcPropMeta for recursive faker resolution
            const synth: JcPropMeta = {
              name: field.name,
              type: field.type,
              required: !field.optional,
              description: '',
              isChildren: false,
              ...(field.values ? { values: field.values } : {}),
              ...(field.fields ? { structuredFields: field.fields } : {}),
            }
            obj[field.name] = generateFakeValue(field.name, synth)
          }
        }
        return obj
      }
      return prop.required ? [makeItem(), makeItem()] : []
    }

    if (info.itemType === 'string') {
      if (name.includes('feature') || name.includes('benefit')) {
        return [faker.lorem.words(3), faker.lorem.words(3), faker.lorem.words(3)]
      }
      if (name.includes('tag') || name.includes('label') || name.includes('categor')) {
        return [faker.lorem.word(), faker.lorem.word(), faker.lorem.word()]
      }
      return [faker.lorem.words(2), faker.lorem.words(2), faker.lorem.words(2)]
    }
    if (info.itemType === 'number') {
      return [
        faker.number.int({ min: 1, max: 100 }),
        faker.number.int({ min: 1, max: 100 }),
        faker.number.int({ min: 1, max: 100 }),
      ]
    }
    if (info.itemType === 'boolean') {
      return [true, false, true]
    }
    return []
  }

  // Non-array structured object props (e.g. `contact: ContactInfo`) — generate per-field defaults
  if (prop.structuredFields) {
    const obj: Record<string, unknown> = {}
    for (const field of prop.structuredFields) {
      if (field.isComponent) {
        obj[field.name] = undefined // resolved via fixture system
      } else {
        // Generate defaults for ALL fields (required + optional) so the editor shows them
        const synth: JcPropMeta = {
          name: field.name,
          type: field.type,
          required: !field.optional,
          description: '',
          isChildren: false,
          ...(field.values ? { values: field.values } : {}),
          ...(field.fields ? { structuredFields: field.fields } : {}),
        }
        obj[field.name] = generateFakeValue(field.name, synth)
      }
    }
    return prop.required ? obj : undefined
  }

  // Object/array types by name heuristic
  if (name === 'stats' || name === 'items' || name === 'data') {
    return undefined // skip — complex array props can't be auto-faked safely
  }
  if (name === 'trend') {
    return undefined // skip — { value: number; label: string } not safe to auto-fake
  }

  if (prop.type === 'string' || prop.type === 'enum') {
    if (name === 'title' || name === 'label') return faker.lorem.words(3)
    if (name === 'name') return faker.person.fullName()
    if (name === 'description' || name === 'subtitle' || name === 'message')
      return faker.lorem.sentence()
    if (name === 'placeholder') return `${faker.lorem.words(2)}...`
    if (name.includes('email')) return faker.internet.email()
    if (name.includes('url') || name.includes('href') || name === 'src') return faker.internet.url()
    if (name.includes('image') || name.includes('avatar')) return faker.image.avatar()
    if (name.includes('color')) return faker.color.rgb()
    if (name.includes('date')) return faker.date.recent().toISOString().split('T')[0]
    if (name.includes('phone')) return faker.phone.number()
    if (name.includes('address')) return faker.location.streetAddress()
    if (name.includes('text') || name.includes('content')) return faker.lorem.paragraph()
    if (name.includes('search') || name.includes('query') || name.includes('filter')) return ''
    return faker.lorem.words(2)
  }

  return undefined
}

/** Generate fake children text for components that accept children */
export function generateFakeChildren(componentName: string): string {
  const name = componentName.toLowerCase()
  if (name.includes('button')) return 'Click me'
  if (name.includes('badge')) return 'New'
  if (name.includes('title')) return faker.lorem.words(3)
  if (name.includes('description')) return faker.lorem.sentence()
  if (name.includes('label')) return faker.lorem.words(2)
  if (name.includes('header')) return faker.lorem.words(4)
  if (name.includes('footer')) return faker.lorem.words(3)
  if (name.includes('tab')) return faker.lorem.word()
  return faker.lorem.words(3)
}

/**
 * Generate multiple varied instances of a component for overflow/truncation testing.
 *
 * - Instance 0 is always the exact user values (identity).
 * - Instance 1+ uses a seeded faker to generate varied text while preserving
 *   non-string edits (booleans, numbers, selects).
 * - The faker seed is restored afterwards.
 */
export function generateVariedInstances(
  comp: JcComponentMeta,
  plugins: JcPlugin[],
  resolvedItems: JcResolvedPluginItem[],
  userProps: Record<string, unknown>,
  userChildren: string,
  count: number,
): Array<{ propValues: Record<string, unknown>; childrenText: string }> {
  if (count <= 1) return [{ propValues: userProps, childrenText: userChildren }]

  const instances: Array<{ propValues: Record<string, unknown>; childrenText: string }> = []
  // Instance 0: exact user values
  instances.push({ propValues: userProps, childrenText: userChildren })

  // Simple stable hash from component name
  const hash = comp.displayName.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 0)

  for (let i = 1; i < count; i++) {
    faker.seed(Math.abs(hash + i * 7919))
    const varied = generateDefaults(comp, plugins, resolvedItems)

    // Overlay: preserve non-string user edits (booleans, numbers, selects, fixtures)
    for (const [key, userVal] of Object.entries(userProps)) {
      if (userVal === undefined) continue
      if (typeof userVal !== 'string') {
        varied[key] = userVal
      }
      // For select props, preserve the user's selection
      const propMeta = comp.props[key]
      if (propMeta?.values && propMeta.values.length > 0) {
        varied[key] = userVal
      }
    }

    const variedChildren = comp.acceptsChildren ? generateFakeChildren(comp.displayName) : ''
    instances.push({ propValues: varied, childrenText: variedChildren })
  }

  // Restore unseeded faker state
  faker.seed()
  return instances
}

/**
 * Generate smart default prop values for a component.
 * Uses faker heuristics for primitive props; for component-type props,
 * picks the first matching fixture key if fixtures are available.
 */
export function generateDefaults(
  comp: JcComponentMeta,
  plugins: JcPlugin[],
  resolvedItems: JcResolvedPluginItem[],
): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const [name, prop] of Object.entries(comp.props)) {
    const base = generateFakeValue(name, prop)
    if (base === undefined && prop.componentKind && resolvedItems.length > 0 && prop.required) {
      // Check if a non-fallback plugin matches this prop — if so, pick its first item as default.
      // Fallback plugins (priority < 0, like component fixtures) don't auto-populate defaults.
      const matchingPlugin = getPluginForProp(prop, plugins)
      if (matchingPlugin && (matchingPlugin.priority ?? 0) >= 0) {
        values[name] = getDefaultItemKey(prop, plugins, resolvedItems)
      } else {
        // No plugin match or fallback plugin → default to text
        values[name] = generateFakeChildren(comp.displayName)
      }
    } else {
      values[name] = base
    }
  }
  return values
}
