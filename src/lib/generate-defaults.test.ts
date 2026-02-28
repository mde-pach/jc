import { describe, expect, it } from 'vitest'
import { makeComponent } from '../__test-utils__/factories.js'
import type { JcPlugin, JcPropMeta, JcResolvedPluginItem } from '../types.js'
import { generateDefaults } from './faker-map.js'
import { suggestPluginForProp } from './plugins.js'

const plugins: JcPlugin[] = [
  {
    name: 'lucide',
    match: { types: ['LucideIcon'] },
    items: [
      { key: 'star', label: 'Star', value: () => null },
    ],
  },
  {
    name: 'custom',
    match: { kinds: ['element', 'node'] },
    items: [
      { key: 'badge', label: 'Badge', value: () => null },
    ],
    priority: -1,
  },
]

const resolvedItems: JcResolvedPluginItem[] = [
  {
    key: 'star',
    label: 'Star',
    value: () => null,
    pluginName: 'lucide',
    qualifiedKey: 'lucide/star',
    render: () => 'star-node',
    renderPreview: () => 'star-icon',
    getValue: () => () => null,
  },
  {
    key: 'badge',
    label: 'Badge',
    value: () => null,
    pluginName: 'custom',
    qualifiedKey: 'custom/badge',
    render: () => 'badge-node',
    renderPreview: () => 'badge-icon',
    getValue: () => () => null,
  },
]

describe('generateDefaults', () => {
  it('returns empty object for component with no props', () => {
    const result = generateDefaults(makeComponent(), [], [])
    expect(result).toEqual({})
  })

  it('generates faker values for string props', () => {
    const comp = makeComponent({
      props: {
        title: {
          name: 'title',
          type: 'string',
          required: false,
          description: '',
          isChildren: false,
        },
      },
    })
    const result = generateDefaults(comp, [], [])
    expect(typeof result.title).toBe('string')
    expect((result.title as string).length).toBeGreaterThan(0)
  })

  it('generates faker values for number props', () => {
    const comp = makeComponent({
      props: {
        count: {
          name: 'count',
          type: 'number',
          required: false,
          description: '',
          isChildren: false,
        },
      },
    })
    const result = generateDefaults(comp, [], [])
    expect(typeof result.count).toBe('number')
  })

  it('uses first fixture key for required component-kind props', () => {
    const comp = makeComponent({
      props: {
        icon: {
          name: 'icon',
          type: 'LucideIcon',
          required: true,
          description: '',
          isChildren: false,
          componentKind: 'element',
        },
      },
    })
    const result = generateDefaults(comp, plugins, resolvedItems)
    // Should pick the first fixture matching the 'element' kind (lucide/star via type match)
    expect(result.icon).toBe('lucide/star')
  })

  it('leaves optional component-kind props unselected even with fixtures', () => {
    const comp = makeComponent({
      props: {
        icon: {
          name: 'icon',
          type: 'LucideIcon',
          required: false,
          description: '',
          isChildren: false,
          componentKind: 'element',
        },
      },
    })
    const result = generateDefaults(comp, plugins, resolvedItems)
    expect(result.icon).toBeUndefined()
  })

  it('returns undefined for component-kind props when no fixtures available', () => {
    const comp = makeComponent({
      props: {
        icon: {
          name: 'icon',
          type: 'LucideIcon',
          required: false,
          description: '',
          isChildren: false,
          componentKind: 'element',
        },
      },
    })
    const result = generateDefaults(comp, [], [])
    expect(result.icon).toBeUndefined()
  })

  it('uses first enum value for required select props', () => {
    const comp = makeComponent({
      props: {
        variant: {
          name: 'variant',
          type: 'string',
          values: ['primary', 'secondary'],
          required: true,
          description: '',
          isChildren: false,
        },
      },
    })
    const result = generateDefaults(comp, [], [])
    expect(result.variant).toBe('primary')
  })

  it('leaves optional select props unselected', () => {
    const comp = makeComponent({
      props: {
        variant: {
          name: 'variant',
          type: 'string',
          values: ['primary', 'secondary'],
          required: false,
          description: '',
          isChildren: false,
        },
      },
    })
    const result = generateDefaults(comp, [], [])
    expect(result.variant).toBeUndefined()
  })

  it('generates defaults for multiple props', () => {
    const comp = makeComponent({
      props: {
        title: {
          name: 'title',
          type: 'string',
          required: false,
          description: '',
          isChildren: false,
        },
        disabled: {
          name: 'disabled',
          type: 'boolean',
          required: false,
          description: '',
          isChildren: false,
        },
        icon: {
          name: 'icon',
          type: 'LucideIcon',
          required: false,
          description: '',
          isChildren: false,
          componentKind: 'element',
        },
      },
    })
    const result = generateDefaults(comp, plugins, resolvedItems)
    expect(typeof result.title).toBe('string')
    expect(result.disabled).toBe(false)
    // Optional component-kind props start unselected
    expect(result.icon).toBeUndefined()
  })

  it('defaults required node-kind props to text, not fixture', () => {
    const comp = makeComponent({
      props: {
        content: {
          name: 'content',
          type: 'ReactNode',
          required: true,
          description: '',
          isChildren: false,
          componentKind: 'node',
        },
      },
    })
    const result = generateDefaults(comp, plugins, resolvedItems)
    // Node-kind props default to generated text, not a fixture key
    expect(typeof result.content).toBe('string')
    expect((result.content as string).length).toBeGreaterThan(0)
    // Must NOT be a fixture key
    expect(resolvedItems.some((f) => f.qualifiedKey === result.content)).toBe(false)
  })

  it('leaves optional component-kind props unselected even with fixtures', () => {
    const comp = makeComponent({
      props: {
        content: {
          name: 'content',
          type: 'ReactNode',
          required: false,
          description: '',
          isChildren: false,
          componentKind: 'node',
        },
      },
    })
    const result = generateDefaults(comp, plugins, resolvedItems)
    expect(result.content).toBeUndefined()
  })

  it('leaves required element-kind props undefined when no plugin matches (not text)', () => {
    const comp = makeComponent({
      props: {
        icon: {
          name: 'icon',
          type: 'LucideIcon',
          required: true,
          description: '',
          isChildren: false,
          componentKind: 'element',
        },
      },
    })
    // No plugins loaded — element-kind should NOT default to text
    const result = generateDefaults(comp, [], [])
    expect(result.icon).toBeUndefined()
  })
})

describe('suggestPluginForProp', () => {
  it('suggests lucide plugin for LucideIcon type when not loaded', () => {
    const prop: JcPropMeta = {
      name: 'icon',
      type: 'LucideIcon',
      required: true,
      description: '',
      isChildren: false,
      componentKind: 'element',
    }
    const result = suggestPluginForProp(prop, [])
    expect(result).toEqual({
      name: 'lucide',
      importPath: 'jc/plugins/lucide',
      importName: 'lucidePlugin',
    })
  })

  it('returns null when lucide plugin is already loaded', () => {
    const prop: JcPropMeta = {
      name: 'icon',
      type: 'LucideIcon',
      required: true,
      description: '',
      isChildren: false,
      componentKind: 'element',
    }
    const result = suggestPluginForProp(prop, plugins)
    expect(result).toBeNull()
  })

  it('returns null for unknown types', () => {
    const prop: JcPropMeta = {
      name: 'icon',
      type: 'SomeCustomIcon',
      required: true,
      description: '',
      isChildren: false,
      componentKind: 'element',
    }
    const result = suggestPluginForProp(prop, [])
    expect(result).toBeNull()
  })

  it('matches via rawType when type does not match directly', () => {
    const prop: JcPropMeta = {
      name: 'icon',
      type: 'ForwardRefExoticComponent<LucideProps>',
      rawType: 'ForwardRefExoticComponent<LucideProps>',
      required: true,
      description: '',
      isChildren: false,
      componentKind: 'element',
    }
    const result = suggestPluginForProp(prop, [])
    expect(result).not.toBeNull()
    expect(result?.name).toBe('lucide')
  })
})
