import { describe, expect, it } from 'vitest'
import type { JcComponentMeta, JcResolvedFixture } from '../types.js'
import { generateDefaults } from './faker-map.js'

function makeComponent(overrides: Partial<JcComponentMeta> = {}): JcComponentMeta {
  return {
    displayName: 'Card',
    filePath: 'src/components/ui/card.tsx',
    description: '',
    props: {},
    acceptsChildren: false,
    ...overrides,
  }
}

const fixtures: JcResolvedFixture[] = [
  {
    key: 'star',
    label: 'Star',
    category: 'icons',
    pluginName: 'lucide',
    qualifiedKey: 'lucide/star',
    render: () => 'star-node',
    // biome-ignore lint/suspicious/noExplicitAny: test mock — JcFixture.component expects React.ComponentType<any>
    component: (() => null) as any,
  },
  {
    key: 'badge',
    label: 'Badge',
    category: 'elements',
    pluginName: 'custom',
    qualifiedKey: 'custom/badge',
    render: () => 'badge-node',
  },
]

describe('generateDefaults', () => {
  it('returns empty object for component with no props', () => {
    const result = generateDefaults(makeComponent(), [])
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
    const result = generateDefaults(comp, [])
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
    const result = generateDefaults(comp, [])
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
          componentKind: 'icon',
        },
      },
    })
    const result = generateDefaults(comp, fixtures)
    // Should pick the first fixture matching the 'icon' kind (lucide/star has category 'icons')
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
          componentKind: 'icon',
        },
      },
    })
    const result = generateDefaults(comp, fixtures)
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
          componentKind: 'icon',
        },
      },
    })
    const result = generateDefaults(comp, [])
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
    const result = generateDefaults(comp, [])
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
    const result = generateDefaults(comp, [])
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
          componentKind: 'icon',
        },
      },
    })
    const result = generateDefaults(comp, fixtures)
    expect(typeof result.title).toBe('string')
    expect(result.disabled).toBe(false)
    // Optional component-kind props start unselected
    expect(result.icon).toBeUndefined()
  })

  it('falls back to all fixtures when kind has no category match (required prop)', () => {
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
    const result = generateDefaults(comp, fixtures)
    // 'node' kind has no exact category match, falls back to first fixture
    expect(result.content).toBe('lucide/star')
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
    const result = generateDefaults(comp, fixtures)
    expect(result.content).toBeUndefined()
  })
})
