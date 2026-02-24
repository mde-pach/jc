import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { JcConfig, JcMeta } from '../types.js'
import {
  applyPathAlias,
  cleanValues,
  createPropFilter,
  detectComponentKind,
  extractValues,
  generateRegistry,
  isTypeName,
  simplifyType,
  writeOutput,
} from './extract.js'

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  }
})

// ── simplifyType ──────────────────────────────────────────────

describe('simplifyType', () => {
  it('strips null', () => {
    expect(simplifyType('string | null')).toBe('string')
  })

  it('strips undefined', () => {
    expect(simplifyType('string | undefined')).toBe('string')
  })

  it('strips both null and undefined', () => {
    expect(simplifyType('string | null | undefined')).toBe('string')
  })

  it('deduplicates repeated types', () => {
    expect(simplifyType('string | string')).toBe('string')
  })

  it('preserves union of different types', () => {
    expect(simplifyType('"sm" | "md" | "lg"')).toBe('"sm" | "md" | "lg"')
  })

  it('handles empty string', () => {
    expect(simplifyType('')).toBe('')
  })
})

// ── extractValues ─────────────────────────────────────────────

describe('extractValues', () => {
  it('extracts quoted string literals', () => {
    expect(extractValues('"sm" | "md" | "lg"')).toEqual(['sm', 'md', 'lg'])
  })

  it('returns undefined for single value', () => {
    expect(extractValues('"sm"')).toBeUndefined()
  })

  it('returns undefined for no quoted values', () => {
    expect(extractValues('string')).toBeUndefined()
  })

  it('extracts from mixed type with quoted values', () => {
    expect(extractValues('"primary" | "secondary" | ReactNode')).toEqual(['primary', 'secondary'])
  })
})

// ── isTypeName ────────────────────────────────────────────────

describe('isTypeName', () => {
  it('identifies JS primitives', () => {
    expect(isTypeName('string')).toBe(true)
    expect(isTypeName('number')).toBe(true)
    expect(isTypeName('boolean')).toBe(true)
    expect(isTypeName('object')).toBe(true)
    expect(isTypeName('void')).toBe(true)
    expect(isTypeName('never')).toBe(true)
    expect(isTypeName('any')).toBe(true)
    expect(isTypeName('unknown')).toBe(true)
  })

  it('identifies React types', () => {
    expect(isTypeName('ReactNode')).toBe(true)
    expect(isTypeName('ReactElement')).toBe(true)
    expect(isTypeName('ReactPortal')).toBe(true)
    expect(isTypeName('ComponentType')).toBe(true)
    expect(isTypeName('LucideIcon')).toBe(true)
    expect(isTypeName('Element')).toBe(true)
  })

  it('identifies prefixed React/JSX types', () => {
    expect(isTypeName('React.ReactNode')).toBe(true)
    expect(isTypeName('JSX.Element')).toBe(true)
  })

  it('identifies generic types', () => {
    expect(isTypeName('Promise<void>')).toBe(true)
    expect(isTypeName('Record<string, any>')).toBe(true)
    expect(isTypeName('Array<number>')).toBe(true)
  })

  it('identifies function signatures', () => {
    expect(isTypeName('() => void')).toBe(true)
    expect(isTypeName('(value: string) => void')).toBe(true)
  })

  it('identifies array types', () => {
    expect(isTypeName('string[]')).toBe(true)
  })

  it('identifies object literal types', () => {
    expect(isTypeName('{ name: string }')).toBe(true)
  })

  it('does NOT filter real enum values — including PascalCase ones', () => {
    expect(isTypeName('Primary')).toBe(false)
    expect(isTypeName('Secondary')).toBe(false)
    expect(isTypeName('Success')).toBe(false)
    expect(isTypeName('Danger')).toBe(false)
    expect(isTypeName('Destructive')).toBe(false)
    expect(isTypeName('Warning')).toBe(false)
    expect(isTypeName('Default')).toBe(false)
    expect(isTypeName('Outline')).toBe(false)
  })

  it('does NOT filter lowercase enum values', () => {
    expect(isTypeName('sm')).toBe(false)
    expect(isTypeName('md')).toBe(false)
    expect(isTypeName('lg')).toBe(false)
    expect(isTypeName('default')).toBe(false)
    expect(isTypeName('primary')).toBe(false)
  })
})

// ── cleanValues ───────────────────────────────────────────────

describe('cleanValues', () => {
  it('returns undefined for undefined input', () => {
    expect(cleanValues(undefined)).toBeUndefined()
  })

  it('filters out null and undefined strings', () => {
    expect(cleanValues(['sm', 'undefined', 'null', 'lg'])).toEqual(['sm', 'lg'])
  })

  it('filters out TS type names', () => {
    expect(cleanValues(['primary', 'ReactNode', 'secondary'])).toEqual(['primary', 'secondary'])
  })

  it('preserves real enum values including PascalCase', () => {
    expect(cleanValues(['Primary', 'Secondary', 'Destructive'])).toEqual([
      'Primary',
      'Secondary',
      'Destructive',
    ])
  })

  it('returns undefined when all values are filtered', () => {
    expect(cleanValues(['undefined', 'null'])).toBeUndefined()
  })

  it('returns undefined for empty array', () => {
    expect(cleanValues([])).toBeUndefined()
  })
})

// ── detectComponentKind ───────────────────────────────────────

describe('detectComponentKind', () => {
  it('detects LucideIcon from rawType', () => {
    expect(detectComponentKind('icon', 'LucideIcon')).toBe('icon')
  })

  it('detects IconType from rawType', () => {
    expect(detectComponentKind('myProp', 'IconType')).toBe('icon')
  })

  it('detects ComponentType from rawType', () => {
    expect(detectComponentKind('renderer', 'ComponentType')).toBe('icon')
  })

  it('detects ReactElement from rawType', () => {
    expect(detectComponentKind('content', 'ReactElement')).toBe('element')
  })

  it('detects JSX.Element from rawType', () => {
    expect(detectComponentKind('content', 'JSX.Element')).toBe('element')
  })

  it('detects ReactNode from rawType', () => {
    expect(detectComponentKind('content', 'ReactNode')).toBe('node')
  })

  it('detects icon-named props via source', () => {
    expect(detectComponentKind('icon', 'enum', 'icon?: LucideIcon')).toBe('icon')
    expect(detectComponentKind('icon', 'enum', 'icon?: React.ReactNode')).toBe('element')
  })

  it('defaults icon-named props to icon kind', () => {
    expect(detectComponentKind('icon', 'enum')).toBe('icon')
    expect(detectComponentKind('leftIcon', 'enum')).toBe('icon')
  })

  it('detects confident node names', () => {
    expect(detectComponentKind('badge', 'ReactNode')).toBe('node')
    expect(detectComponentKind('action', 'enum')).toBe('node')
    expect(detectComponentKind('prefix', 'ReactNode')).toBe('node')
  })

  it('only detects less-confident names when type matches', () => {
    expect(detectComponentKind('header', 'string')).toBeUndefined()
    expect(detectComponentKind('header', 'ReactNode')).toBe('node')
    // JSX.Element hits type-based detection first → 'element' (not 'node')
    expect(detectComponentKind('trigger', 'JSX.Element')).toBe('element')
    // With a generic 'enum' type, less-confident names only match Node/Element patterns
    expect(detectComponentKind('trigger', 'enum')).toBeUndefined()
    expect(detectComponentKind('label', 'ReactNode')).toBe('node')
  })

  it('returns undefined for structured object types containing ReactNode', () => {
    expect(detectComponentKind('tabs', '{ label: string; content: ReactNode; }[]')).toBeUndefined()
    expect(detectComponentKind('items', '{ title: string; icon: ReactElement; }[]')).toBeUndefined()
    expect(detectComponentKind('badge', '{ label: string; content: ReactNode; }')).toBeUndefined()
  })

  it('returns undefined for unknown props', () => {
    expect(detectComponentKind('title', 'string')).toBeUndefined()
    expect(detectComponentKind('onClick', '() => void')).toBeUndefined()
  })
})

// ── applyPathAlias ────────────────────────────────────────────

describe('applyPathAlias', () => {
  it('replaces src/ with @/ by default convention', () => {
    expect(applyPathAlias('src/components/ui/button', { '@/': 'src/' })).toBe(
      '@/components/ui/button',
    )
  })

  it('supports tilde alias', () => {
    expect(applyPathAlias('src/components/ui/button', { '~/': 'src/' })).toBe(
      '~/components/ui/button',
    )
  })

  it('supports custom alias', () => {
    expect(
      applyPathAlias('src/components/ui/button', {
        '@components/': 'src/components/',
      }),
    ).toBe('@components/ui/button')
  })

  it('returns path unchanged when no alias matches', () => {
    expect(applyPathAlias('lib/utils', { '@/': 'src/' })).toBe('lib/utils')
  })

  it('applies first matching alias', () => {
    expect(
      applyPathAlias('src/components/ui/button', {
        '@ui/': 'src/components/ui/',
        '@/': 'src/',
      }),
    ).toBe('@ui/button')
  })
})

// ── generateRegistry ─────────────────────────────────────────

describe('generateRegistry', () => {
  const meta: JcMeta = {
    generatedAt: '2026-01-01T00:00:00.000Z',
    componentDir: 'src/components/ui/**/*.tsx',
    components: [
      {
        displayName: 'Button',
        filePath: 'src/components/ui/button.tsx',
        description: 'A button',
        props: {},
        acceptsChildren: true,
      },
      {
        displayName: 'Card',
        filePath: 'src/components/ui/card.tsx',
        description: 'A card',
        props: {},
        acceptsChildren: false,
      },
    ],
  }

  const config = {
    componentGlob: 'src/components/ui/**/*.tsx',
    outputDir: 'src/jc/generated',
    pathAlias: { '@/': 'src/' },
  }

  it('generates valid registry code', () => {
    const code = generateRegistry(meta, config)
    expect(code).toContain("import type { ComponentType } from 'react'")
    expect(code).toContain('export const registry')
    expect(code).toContain("'Button'")
    expect(code).toContain("'Card'")
  })

  it('applies path alias to imports', () => {
    const code = generateRegistry(meta, config)
    expect(code).toContain("import('@/components/ui/button')")
    expect(code).toContain("import('@/components/ui/card')")
    expect(code).not.toContain('src/components')
  })

  it('strips .tsx extension from imports', () => {
    const code = generateRegistry(meta, config)
    expect(code).not.toContain('.tsx')
  })

  it('deduplicates components by displayName', () => {
    const duped: JcMeta = {
      ...meta,
      components: [
        ...meta.components,
        { ...meta.components[0], filePath: 'src/components/ui/button2.tsx' },
      ],
    }
    const code = generateRegistry(duped, config)
    const matches = code.match(/'Button'/g)
    expect(matches).toHaveLength(1)
  })

  it('uses default pathAlias when not provided', () => {
    const code = generateRegistry(meta, { ...config, pathAlias: undefined })
    expect(code).toContain("import('@/components/ui/button')")
  })

  it('uses custom pathAlias', () => {
    const code = generateRegistry(meta, { ...config, pathAlias: { '~/': 'src/' } })
    expect(code).toContain("import('~/components/ui/button')")
  })

  it('generates auto-generated header comment', () => {
    const code = generateRegistry(meta, config)
    expect(code).toContain('Auto-generated by jc extract')
    expect(code).toContain('DO NOT EDIT')
  })

  it('returns empty registry for no components', () => {
    const empty: JcMeta = { ...meta, components: [] }
    const code = generateRegistry(empty, config)
    expect(code).toContain('export const registry')
    expect(code).not.toContain('import(')
  })
})

// ── createPropFilter ─────────────────────────────────────────

describe('createPropFilter', () => {
  it('filters exact prop names', () => {
    const filter = createPropFilter({
      filteredProps: ['ref', 'key'],
    } as JcConfig)
    expect(filter('ref')).toBe(false)
    expect(filter('key')).toBe(false)
    expect(filter('title')).toBe(true)
  })

  it('filters by regex patterns', () => {
    const filter = createPropFilter({
      filteredPropPatterns: ['^on[A-Z]', '^aria-', '^data-'],
    } as JcConfig)
    expect(filter('onClick')).toBe(false)
    expect(filter('aria-label')).toBe(false)
    expect(filter('data-testid')).toBe(false)
    expect(filter('title')).toBe(true)
  })

  it('combines name and pattern filters', () => {
    const filter = createPropFilter({
      filteredProps: ['ref'],
      filteredPropPatterns: ['^on[A-Z]'],
    } as JcConfig)
    expect(filter('ref')).toBe(false)
    expect(filter('onClick')).toBe(false)
    expect(filter('variant')).toBe(true)
  })

  it('allows all props when no filters specified', () => {
    const filter = createPropFilter({} as JcConfig)
    expect(filter('ref')).toBe(true)
    expect(filter('onClick')).toBe(true)
    expect(filter('anything')).toBe(true)
  })

  it('allows Radix-specific event handlers through default patterns', () => {
    const filter = createPropFilter({
      filteredPropPatterns: ['^on(?!OpenChange|CheckedChange|ValueChange|Select)[A-Z]'],
    } as JcConfig)
    expect(filter('onOpenChange')).toBe(true)
    expect(filter('onCheckedChange')).toBe(true)
    expect(filter('onValueChange')).toBe(true)
    expect(filter('onSelect')).toBe(true)
    expect(filter('onClick')).toBe(false)
    expect(filter('onMouseEnter')).toBe(false)
  })
})

// ── writeOutput ──────────────────────────────────────────────

describe('writeOutput', () => {
  afterEach(() => {
    vi.mocked(existsSync).mockReset()
    vi.mocked(mkdirSync).mockReset()
    vi.mocked(writeFileSync).mockReset()
  })

  const meta: JcMeta = {
    generatedAt: '2026-01-01T00:00:00.000Z',
    componentDir: 'src/components/ui/**/*.tsx',
    components: [
      {
        displayName: 'Button',
        filePath: 'src/components/ui/button.tsx',
        description: 'A button',
        props: {
          variant: {
            name: 'variant',
            type: 'string',
            required: false,
            description: '',
            isChildren: false,
          },
        },
        acceptsChildren: true,
      },
    ],
  }

  const config: JcConfig = {
    componentGlob: 'src/components/ui/**/*.tsx',
    outputDir: 'src/jc/generated',
    pathAlias: { '@/': 'src/' },
  }

  it('creates output directory when it does not exist', () => {
    vi.mocked(existsSync).mockReturnValueOnce(false)
    writeOutput('/project', config, meta)
    expect(mkdirSync).toHaveBeenCalledWith(expect.stringContaining('src/jc/generated'), {
      recursive: true,
    })
  })

  it('writes meta.json and registry.ts', () => {
    vi.mocked(existsSync).mockReturnValueOnce(true)
    writeOutput('/project', config, meta)
    expect(writeFileSync).toHaveBeenCalledTimes(2)
    const calls = vi.mocked(writeFileSync).mock.calls
    expect(String(calls[0][0])).toContain('meta.json')
    expect(String(calls[1][0])).toContain('registry.ts')
  })

  it('writes valid JSON for meta.json', () => {
    vi.mocked(existsSync).mockReturnValueOnce(true)
    writeOutput('/project', config, meta)
    const metaContent = vi.mocked(writeFileSync).mock.calls[0][1] as string
    const parsed = JSON.parse(metaContent)
    expect(parsed.components).toHaveLength(1)
    expect(parsed.components[0].displayName).toBe('Button')
  })

  it('does not create directory when it already exists', () => {
    vi.mocked(existsSync).mockReturnValueOnce(true)
    vi.mocked(mkdirSync).mockClear()
    writeOutput('/project', config, meta)
    expect(mkdirSync).not.toHaveBeenCalled()
  })
})
