import { describe, expect, it } from 'vitest'
import {
  componentFixtureToCodeTokens,
  formatArrayTokens,
  generateCodeTokens,
} from '../lib/code-tokens.js'
import type { JcComponentMeta, JcMeta, JcResolvedFixture } from '../types.js'

// ── Helpers ──────────────────────────────────────────────────

function makeComponent(overrides: Partial<JcComponentMeta> = {}): JcComponentMeta {
  return {
    displayName: 'Button',
    filePath: 'src/components/ui/button.tsx',
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
    label: 'Status Badge',
    category: 'elements',
    pluginName: 'custom',
    qualifiedKey: 'custom/badge',
    render: () => 'badge-node',
  },
]

/** Join token texts into a single string for easy assertion */
function tokenText(tokens: { text: string }[]): string {
  return tokens.map((t) => t.text).join('')
}

/** Find all tokens with a specific color */
function tokensWithColor(tokens: { text: string; color: string }[], color: string): string[] {
  return tokens.filter((t) => t.color === color).map((t) => t.text)
}

// ── generateCodeTokens ──────────────────────────────────────

describe('generateCodeTokens', () => {
  it('renders self-closing tag for no props no children', () => {
    const tokens = generateCodeTokens(makeComponent(), {}, '', 'text', null, [])
    const text = tokenText(tokens)
    expect(text).toBe('<Button />')
  })

  it('renders single string prop inline', () => {
    const comp = makeComponent({
      props: {
        variant: {
          name: 'variant',
          type: '"primary" | "secondary"',
          values: ['primary', 'secondary'],
          required: false,
          description: '',
          isChildren: false,
        },
      },
    })
    const tokens = generateCodeTokens(comp, { variant: 'primary' }, '', 'text', null, [])
    const text = tokenText(tokens)
    expect(text).toBe('<Button variant="primary" />')
  })

  it('renders boolean prop as bare name when true', () => {
    const comp = makeComponent({
      props: {
        disabled: {
          name: 'disabled',
          type: 'boolean',
          required: false,
          description: '',
          isChildren: false,
        },
      },
    })
    const tokens = generateCodeTokens(comp, { disabled: true }, '', 'text', null, [])
    const text = tokenText(tokens)
    expect(text).toBe('<Button disabled />')
  })

  it('omits false boolean props', () => {
    const comp = makeComponent({
      props: {
        disabled: {
          name: 'disabled',
          type: 'boolean',
          required: false,
          description: '',
          isChildren: false,
        },
      },
    })
    const tokens = generateCodeTokens(comp, { disabled: false }, '', 'text', null, [])
    const text = tokenText(tokens)
    expect(text).toBe('<Button />')
  })

  it('renders number prop with curly braces', () => {
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
    const tokens = generateCodeTokens(comp, { count: 42 }, '', 'text', null, [])
    const text = tokenText(tokens)
    expect(text).toBe('<Button count={42} />')
  })

  it('renders component prop as JSX fixture reference', () => {
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
    const tokens = generateCodeTokens(comp, { icon: 'lucide/star' }, '', 'text', null, fixtures)
    const text = tokenText(tokens)
    expect(text).toBe('<Button icon={<Star />} />')
  })

  it('renders children in text mode', () => {
    const comp = makeComponent({ acceptsChildren: true })
    const tokens = generateCodeTokens(comp, {}, 'Click me', 'text', null, [])
    const text = tokenText(tokens)
    expect(text).toBe('<Button>Click me</Button>')
  })

  it('renders children in fixture mode', () => {
    const comp = makeComponent({ acceptsChildren: true })
    const tokens = generateCodeTokens(comp, {}, '', 'fixture', 'custom/badge', fixtures)
    const text = tokenText(tokens)
    expect(text).toBe('<Button><StatusBadge /></Button>')
    // Fixture children should use component color
    const greens = tokensWithColor(tokens, '#34d399')
    expect(greens).toContain('<StatusBadge />')
  })

  it('uses multiline layout when >1 prop', () => {
    const comp = makeComponent({
      props: {
        variant: {
          name: 'variant',
          type: 'string',
          required: false,
          description: '',
          isChildren: false,
        },
        size: {
          name: 'size',
          type: 'string',
          required: false,
          description: '',
          isChildren: false,
        },
      },
    })
    const tokens = generateCodeTokens(
      comp,
      { variant: 'primary', size: 'md' },
      '',
      'text',
      null,
      [],
    )
    const text = tokenText(tokens)
    expect(text).toContain('\n')
    expect(text).toContain('  variant="primary"')
    expect(text).toContain('  size="md"')
  })

  it('uses multiline layout when 1 prop + children', () => {
    const comp = makeComponent({
      acceptsChildren: true,
      props: {
        variant: {
          name: 'variant',
          type: 'string',
          required: false,
          description: '',
          isChildren: false,
        },
      },
    })
    const tokens = generateCodeTokens(comp, { variant: 'primary' }, 'Click me', 'text', null, [])
    const text = tokenText(tokens)
    expect(text).toContain('\n')
    expect(text).toContain('  variant="primary"')
    expect(text).toContain('  Click me')
    expect(text).toContain('</Button>')
  })

  it('renders multiline self-closing when >1 prop and no children', () => {
    const comp = makeComponent({
      props: {
        a: { name: 'a', type: 'string', required: false, description: '', isChildren: false },
        b: { name: 'b', type: 'string', required: false, description: '', isChildren: false },
      },
    })
    const tokens = generateCodeTokens(comp, { a: 'x', b: 'y' }, '', 'text', null, [])
    const text = tokenText(tokens)
    expect(text).toContain('/>')
    expect(text).not.toContain('</Button>')
  })

  it('skips undefined, null, and empty string props', () => {
    const comp = makeComponent({
      props: {
        a: { name: 'a', type: 'string', required: false, description: '', isChildren: false },
        b: { name: 'b', type: 'string', required: false, description: '', isChildren: false },
        c: { name: 'c', type: 'string', required: false, description: '', isChildren: false },
      },
    })
    const tokens = generateCodeTokens(comp, { a: undefined, b: null, c: '' }, '', 'text', null, [])
    const text = tokenText(tokens)
    expect(text).toBe('<Button />')
  })

  it('skips empty arrays', () => {
    const comp = makeComponent({
      props: {
        items: {
          name: 'items',
          type: 'string[]',
          required: false,
          description: '',
          isChildren: false,
        },
      },
    })
    const tokens = generateCodeTokens(comp, { items: [] }, '', 'text', null, [])
    const text = tokenText(tokens)
    expect(text).toBe('<Button />')
  })

  it('renders array prop with formatted values', () => {
    const comp = makeComponent({
      props: {
        tags: {
          name: 'tags',
          type: 'string[]',
          required: false,
          description: '',
          isChildren: false,
        },
      },
    })
    const tokens = generateCodeTokens(comp, { tags: ['a', 'b'] }, '', 'text', null, [])
    const text = tokenText(tokens)
    expect(text).toContain('tags={["a", "b"]}')
  })

  it('renders object/json prop with JSON.stringify', () => {
    const comp = makeComponent({
      props: {
        data: {
          name: 'data',
          type: '{ x: number }',
          required: false,
          description: '',
          isChildren: false,
        },
      },
    })
    const tokens = generateCodeTokens(comp, { data: { x: 1 } }, '', 'text', null, [])
    const text = tokenText(tokens)
    expect(text).toContain('data={{"x":1}}')
  })
})

// ── formatArrayTokens ────────────────────────────────────────

describe('formatArrayTokens', () => {
  it('formats string values with quotes', () => {
    const tokens = formatArrayTokens(['hello', 'world'], [])
    const text = tokenText(tokens)
    expect(text).toBe('["hello", "world"]')
  })

  it('formats number values without quotes', () => {
    const tokens = formatArrayTokens([1, 2, 3], [])
    const text = tokenText(tokens)
    expect(text).toBe('[1, 2, 3]')
  })

  it('formats boolean values', () => {
    const tokens = formatArrayTokens([true, false], [])
    const text = tokenText(tokens)
    expect(text).toBe('[true, false]')
  })

  it('formats fixture qualified keys as PascalCase component names', () => {
    const tokens = formatArrayTokens(['lucide/star', 'custom/badge'], fixtures)
    const text = tokenText(tokens)
    expect(text).toBe('[Star, StatusBadge]')
    // Fixture references should use component color
    const greens = tokensWithColor(tokens, '#34d399')
    expect(greens).toContain('Star')
    expect(greens).toContain('StatusBadge')
  })

  it('formats non-fixture strings as quoted strings', () => {
    const tokens = formatArrayTokens(['hello', 'lucide/star'], fixtures)
    const text = tokenText(tokens)
    expect(text).toBe('["hello", Star]')
  })

  it('formats objects with per-field tokens', () => {
    const tokens = formatArrayTokens([{ a: 1 }], [])
    const text = tokenText(tokens)
    expect(text).toBe('[{ a: 1 }]')
  })

  it('returns empty brackets for empty array', () => {
    const tokens = formatArrayTokens([], [])
    const text = tokenText(tokens)
    expect(text).toBe('[]')
  })
})

// ── componentFixtureToCodeTokens ────────────────────────────

describe('componentFixtureToCodeTokens', () => {
  const meta: JcMeta = {
    generatedAt: '2026-01-01',
    componentDir: 'src/components',
    components: [
      {
        displayName: 'Button',
        filePath: 'src/components/ui/button.tsx',
        description: '',
        acceptsChildren: true,
        props: {
          variant: {
            name: 'variant',
            type: '"primary" | "secondary"',
            values: ['primary', 'secondary'],
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
        },
      },
    ],
  }

  it('generates full JSX with overridden props and children', () => {
    const override = {
      props: { variant: 'secondary', disabled: false },
      childrenText: 'Click me',
    }
    const tokens = componentFixtureToCodeTokens('components/Button', override, meta, fixtures)
    const text = tokenText(tokens)
    expect(text).toBe('<Button variant="secondary">Click me</Button>')
  })

  it('generates self-closing JSX when no children text', () => {
    const override = {
      props: { variant: 'primary' },
      childrenText: '',
    }
    const tokens = componentFixtureToCodeTokens('components/Button', override, meta, fixtures)
    const text = tokenText(tokens)
    expect(text).toBe('<Button variant="primary" />')
  })

  it('omits false booleans and empty values', () => {
    const override = {
      props: { variant: '', disabled: false },
      childrenText: '',
    }
    const tokens = componentFixtureToCodeTokens('components/Button', override, meta, fixtures)
    const text = tokenText(tokens)
    expect(text).toBe('<Button />')
  })

  it('falls back to simple tag for unknown component', () => {
    const override = { props: {}, childrenText: '' }
    const tokens = componentFixtureToCodeTokens('components/Unknown', override, meta, fixtures)
    const text = tokenText(tokens)
    expect(text).toBe('<Unknown />')
  })
})

// ── generateCodeTokens with fixture overrides ───────────────

describe('generateCodeTokens with fixture overrides', () => {
  const meta: JcMeta = {
    generatedAt: '2026-01-01',
    componentDir: 'src/components',
    components: [
      {
        displayName: 'Button',
        filePath: 'src/components/ui/button.tsx',
        description: '',
        acceptsChildren: true,
        props: {
          label: {
            name: 'label',
            type: 'string',
            required: true,
            description: '',
            isChildren: false,
          },
        },
      },
    ],
  }

  const componentFixtures: JcResolvedFixture[] = [
    ...fixtures,
    {
      key: 'Button',
      label: 'Button',
      category: 'components',
      pluginName: 'components',
      qualifiedKey: 'components/Button',
      render: () => 'button-node',
    },
  ]

  it('renders component fixture prop with overrides as full JSX', () => {
    const comp = makeComponent({
      props: {
        trigger: {
          name: 'trigger',
          type: 'ReactNode',
          required: false,
          description: '',
          isChildren: false,
          componentKind: 'node',
        },
      },
    })
    const overrides = {
      'prop:trigger': { props: { label: 'Go' }, childrenText: 'Click' },
    }
    const tokens = generateCodeTokens(
      comp,
      { trigger: 'components/Button' },
      '',
      'text',
      null,
      componentFixtures,
      undefined,
      overrides,
      meta,
    )
    const text = tokenText(tokens)
    expect(text).toContain('trigger={<Button label="Go">Click</Button>}')
  })

  it('renders children component fixture with overrides as full JSX', () => {
    const comp = makeComponent({ acceptsChildren: true })
    const overrides = {
      children: { props: { label: 'Submit' }, childrenText: 'OK' },
    }
    const tokens = generateCodeTokens(
      comp,
      {},
      '',
      'fixture',
      'components/Button',
      componentFixtures,
      undefined,
      overrides,
      meta,
    )
    const text = tokenText(tokens)
    expect(text).toContain('<Button label="Submit">OK</Button>')
  })
})
