/**
 * Faker heuristics — maps prop name + type → realistic fake value.
 */

import { faker } from '@faker-js/faker'
import type { JcControlType, JcPropMeta } from '../types.js'

/** Determine the control type for a prop */
export function resolveControlType(prop: JcPropMeta): JcControlType {
  // Component-type props get a dedicated control
  if (prop.componentKind) return 'component'

  if (prop.values && prop.values.length > 0) return 'select'
  if (prop.type === 'boolean') return 'boolean'
  if (prop.type === 'number') return 'number'
  if (/ReactNode|ReactElement|JSX\.Element|Element/.test(prop.type)) return 'component'
  if (prop.type.includes('=>') || prop.type.includes('Function')) return 'readonly'
  if (prop.type.startsWith('{') || prop.type.startsWith('Array') || prop.type.startsWith('Record'))
    return 'json'
  if (prop.type === 'string' || prop.type === 'enum') return 'text'
  return 'text'
}

/**
 * Available placeholder components for component-type props.
 * Each entry has a label and a key used to resolve the actual React element at render time.
 */
export const COMPONENT_PLACEHOLDERS = {
  icon: [
    { key: 'icon:star', label: 'Star' },
    { key: 'icon:heart', label: 'Heart' },
    { key: 'icon:zap', label: 'Zap' },
    { key: 'icon:bell', label: 'Bell' },
    { key: 'icon:check', label: 'Check' },
    { key: 'icon:x', label: 'X' },
    { key: 'icon:search', label: 'Search' },
    { key: 'icon:settings', label: 'Settings' },
    { key: 'icon:user', label: 'User' },
    { key: 'icon:home', label: 'Home' },
    { key: 'icon:plus', label: 'Plus' },
    { key: 'icon:arrow-right', label: 'Arrow Right' },
    { key: 'icon:calendar', label: 'Calendar' },
    { key: 'icon:mail', label: 'Mail' },
    { key: 'icon:tag', label: 'Tag' },
  ],
  element: [
    { key: 'none', label: 'None' },
    { key: 'icon:star', label: 'Star icon' },
    { key: 'icon:zap', label: 'Zap icon' },
    { key: 'text:badge', label: 'Badge text' },
    { key: 'text:label', label: 'Label text' },
    { key: 'text:paragraph', label: 'Paragraph' },
  ],
  node: [
    { key: 'none', label: 'None' },
    { key: 'icon:star', label: 'Star icon' },
    { key: 'icon:zap', label: 'Zap icon' },
    { key: 'text:badge', label: 'Badge text' },
    { key: 'text:label', label: 'Label text' },
    { key: 'text:paragraph', label: 'Paragraph' },
  ],
} as const

/** Get the default placeholder key for a component prop */
export function getDefaultComponentKey(propName: string, prop: JcPropMeta): string {
  const kind = prop.componentKind ?? 'node'
  const name = propName.toLowerCase()

  if (kind === 'icon' || name === 'icon' || name.endsWith('icon')) {
    return 'icon:star'
  }

  // For other node/element props, default based on name
  if (name === 'badge') return 'text:badge'
  if (name === 'action' || name === 'actions') return 'text:label'
  if (name === 'separator') return 'none'
  if (name === 'breadcrumbs') return 'text:label'

  return 'none'
}

/** Generate a smart default value for a prop based on name + type heuristics */
export function generateFakeValue(propName: string, prop: JcPropMeta): unknown {
  const name = propName.toLowerCase()

  // Component-type props get a placeholder key string
  if (prop.componentKind || resolveControlType(prop) === 'component') {
    return getDefaultComponentKey(propName, prop)
  }

  if (prop.defaultValue !== undefined) {
    if (prop.type === 'boolean') return prop.defaultValue === 'true'
    if (prop.type === 'number') return Number(prop.defaultValue)
    return prop.defaultValue
  }

  if (prop.values && prop.values.length > 0) return prop.values[0]
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
    if (name.includes('url') || name.includes('href') || name === 'src')
      return faker.internet.url()
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
