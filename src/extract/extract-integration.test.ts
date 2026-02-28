import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveConfig } from '../config.js'
import { extract } from './extract.js'

/**
 * Integration test — runs the full extraction pipeline on a real .tsx fixture.
 * Covers: findFiles, createParser, createPropFilter, discoverFiles, extract loop.
 */
describe('extract (integration)', () => {
  const config = resolveConfig({
    componentGlob: 'src/extract/__fixtures__/**/*.tsx',
    outputDir: 'dist/test-output',
  })
  // Project root is 2 levels up from src/extract/
  const projectRoot = resolve(__dirname, '../..')

  /** Helper: run extraction and return the meta (unwrapping ExtractionResult) */
  function extractMeta() {
    return extract(projectRoot, config).meta
  }

  it('extracts components from fixture files', () => {
    const meta = extractMeta()
    expect(meta.components.length).toBeGreaterThanOrEqual(1)
  })

  it('extracts the Button component with correct displayName', () => {
    const meta = extractMeta()
    const button = meta.components.find((c) => c.displayName === 'Button')
    expect(button).toBeDefined()
    expect(button!.displayName).toBe('Button')
  })

  it('extracts props with correct types and values', () => {
    const meta = extractMeta()
    const button = meta.components.find((c) => c.displayName === 'Button')!

    // variant should be a select with enum values
    expect(button.props.variant).toBeDefined()
    expect(button.props.variant.values).toContain('primary')
    expect(button.props.variant.values).toContain('secondary')
    expect(button.props.variant.values).toContain('destructive')

    // size should be a select
    expect(button.props.size).toBeDefined()
    expect(button.props.size.values).toContain('sm')
    expect(button.props.size.values).toContain('md')
    expect(button.props.size.values).toContain('lg')

    // disabled should be boolean
    expect(button.props.disabled).toBeDefined()
    expect(button.props.disabled.type).toBe('boolean')
  })

  it('detects acceptsChildren from children prop', () => {
    const meta = extractMeta()
    const button = meta.components.find((c) => c.displayName === 'Button')!
    expect(button.acceptsChildren).toBe(true)
  })

  it('detects componentKind for icon prop', () => {
    const meta = extractMeta()
    const button = meta.components.find((c) => c.displayName === 'Button')!
    expect(button.props.icon).toBeDefined()
    expect(button.props.icon.componentKind).toBe('element')
  })

  it('filters out built-in React props (ref, key, aria-, data-, event handlers)', () => {
    const meta = extractMeta()
    const button = meta.components.find((c) => c.displayName === 'Button')!
    expect(button.props.ref).toBeUndefined()
    expect(button.props.key).toBeUndefined()
    // children should not appear as a regular prop
    expect(button.props.children).toBeUndefined()
  })

  it('sets correct filePath relative to project root', () => {
    const meta = extractMeta()
    const button = meta.components.find((c) => c.displayName === 'Button')!
    expect(button.filePath).toContain('__fixtures__/sample-button.tsx')
    // Should not contain absolute path
    expect(button.filePath).not.toContain(projectRoot)
  })

  it('deduplicates components by displayName keeping the one with more props', () => {
    const meta = extractMeta()
    const names = meta.components.map((c) => c.displayName)
    const unique = new Set(names)
    expect(names.length).toBe(unique.size)
  })

  it('includes metadata fields', () => {
    const meta = extractMeta()
    expect(meta.generatedAt).toBeDefined()
    expect(meta.componentDir).toBe(config.componentGlob)
  })

  it('extracts prop descriptions from JSDoc', () => {
    const meta = extractMeta()
    const button = meta.components.find((c) => c.displayName === 'Button')!
    expect(button.props.variant.description).toBe('The visual style variant')
    expect(button.props.disabled.description).toBe('Whether the button is disabled')
  })

  it('extracts JSDoc @example tags from component function', () => {
    const meta = extractMeta()
    const item = meta.components.find((c) => c.displayName === 'AccordionItem')
    expect(item).toBeDefined()
    expect(item!.tags).toBeDefined()
    expect(item!.tags!.example).toHaveLength(2)
    expect(item!.tags!.example[0]).toContain('Accordion')
  })

  it('detects wrapperComponents from consistent @example blocks', () => {
    const meta = extractMeta()
    const item = meta.components.find((c) => c.displayName === 'AccordionItem')
    expect(item).toBeDefined()
    expect(item!.wrapperComponents).toBeDefined()
    expect(item!.wrapperComponents).toHaveLength(1)
    expect(item!.wrapperComponents![0].displayName).toBe('Accordion')
    expect(item!.wrapperComponents![0].defaultProps).toHaveProperty('type', 'single')
    expect(item!.wrapperComponents![0].defaultProps).toHaveProperty('collapsible', 'true')
  })

  it('does not set wrapperComponents for standalone components', () => {
    const meta = extractMeta()
    const btn = meta.components.find((c) => c.displayName === 'StandaloneButton')
    expect(btn).toBeDefined()
    expect(btn!.tags?.example).toHaveLength(1)
    expect(btn!.wrapperComponents).toBeUndefined()
  })

  // ── Complex type detection ───────────────────────────────────

  describe('complex type detection (arrays, objects, records)', () => {
    it('extracts string[] as array type, not enum', () => {
      const meta = extractMeta()
      const card = meta.components.find((c) => c.displayName === 'StatCard')!
      expect(card).toBeDefined()
      expect(card.props.tags).toBeDefined()
      expect(card.props.tags.type).toBe('string[]')
    })

    it('extracts number[] as array type', () => {
      const meta = extractMeta()
      const card = meta.components.find((c) => c.displayName === 'StatCard')!
      expect(card.props.scores).toBeDefined()
      expect(card.props.scores.type).toBe('number[]')
    })

    it('extracts object type for inline object props', () => {
      const meta = extractMeta()
      const panel = meta.components.find((c) => c.displayName === 'ConfigPanel')!
      expect(panel).toBeDefined()
      expect(panel.props.config).toBeDefined()
      // Should contain object structure, not "enum"
      expect(panel.props.config.type).toMatch(/\{/)
      expect(panel.props.config.type).not.toBe('enum')
    })

    it('extracts structured array type for object array props', () => {
      const meta = extractMeta()
      const panel = meta.components.find((c) => c.displayName === 'ConfigPanel')!
      expect(panel.props.menuItems).toBeDefined()
      // Should end with [] and contain structure
      expect(panel.props.menuItems.type).toMatch(/\[\]$/)
      expect(panel.props.menuItems.type).toMatch(/label/)
    })

    it('extracts Record type for mapped props', () => {
      const meta = extractMeta()
      const panel = meta.components.find((c) => c.displayName === 'ConfigPanel')!
      expect(panel.props.labels).toBeDefined()
      expect(panel.props.labels.type).toMatch(/Record/)
    })

    it('preserves simple types correctly alongside complex ones', () => {
      const meta = extractMeta()
      const card = meta.components.find((c) => c.displayName === 'StatCard')!
      expect(card.props.label.type).toBe('string')
      expect(card.props.value.type).toBe('number')
      expect(card.props.highlighted.type).toBe('boolean')
    })

    it('preserves union type values for enum-like props', () => {
      const meta = extractMeta()
      const card = meta.components.find((c) => c.displayName === 'StatCard')!
      expect(card.props.trend).toBeDefined()
      expect(card.props.trend.values).toContain('up')
      expect(card.props.trend.values).toContain('down')
      expect(card.props.trend.values).toContain('neutral')
    })
  })

  // ── Named interface / complex prop extraction ──────────────

  describe('named interface props (ProfileCard fixture)', () => {
    function getProfileCard() {
      const meta = extractMeta()
      const pc = meta.components.find((c) => c.displayName === 'ProfileCard')
      expect(pc).toBeDefined()
      return pc!
    }

    it('extracts the ProfileCard component', () => {
      const pc = getProfileCard()
      expect(pc.displayName).toBe('ProfileCard')
    })

    it('extracts simple props correctly alongside complex ones', () => {
      const pc = getProfileCard()
      expect(pc.props.name.type).toBe('string')
      expect(pc.props.name.required).toBe(true)
      expect(pc.props.role.values).toEqual(['admin', 'member', 'owner', 'guest'])
      expect(pc.props.online.type).toBe('boolean')
    })

    it('extracts named interface prop (contact: ContactInfo) as expanded object type', () => {
      const pc = getProfileCard()
      expect(pc.props.contact).toBeDefined()
      // Currently returns the interface name — should expand to inline object literal
      // e.g. "{ email: string; phone?: string; address?: { street: string; ... } }"
      expect(pc.props.contact.type).toMatch(/\{/)
      expect(pc.props.contact.type).toMatch(/email/)
      expect(pc.props.contact.type).toMatch(/string/)
      expect(pc.props.contact.required).toBe(true)
    })

    it('extracts named interface with booleans and enum (notifications: NotificationPrefs)', () => {
      const pc = getProfileCard()
      expect(pc.props.notifications).toBeDefined()
      // Should be an expanded object type, not treated as an enum value
      expect(pc.props.notifications.type).toMatch(/\{/)
      expect(pc.props.notifications.type).toMatch(/email/)
      expect(pc.props.notifications.type).toMatch(/boolean/)
      expect(pc.props.notifications.values).toBeUndefined() // not an enum
    })

    it('extracts named interface array (socialLinks: SocialLink[]) with expanded fields', () => {
      const pc = getProfileCard()
      expect(pc.props.socialLinks).toBeDefined()
      expect(pc.props.socialLinks.type).toMatch(/\[\]$/)
      // Should contain the expanded field structure
      expect(pc.props.socialLinks.type).toMatch(/platform/)
      expect(pc.props.socialLinks.type).toMatch(/url/)
    })

    it('extracts named interface array (metrics: Metric[]) with expanded fields', () => {
      const pc = getProfileCard()
      expect(pc.props.metrics).toBeDefined()
      expect(pc.props.metrics.type).toMatch(/\[\]$/)
      expect(pc.props.metrics.type).toMatch(/label/)
      expect(pc.props.metrics.type).toMatch(/value/)
    })

    it('preserves Record<string, string> type', () => {
      const pc = getProfileCard()
      expect(pc.props.metadata).toBeDefined()
      expect(pc.props.metadata.type).toMatch(/Record/)
    })

    it('detects ReactNode props as component kind', () => {
      const pc = getProfileCard()
      expect(pc.props.badge).toBeDefined()
      expect(pc.props.badge.componentKind).toBe('node')
      expect(pc.props.footer).toBeDefined()
      expect(pc.props.footer.componentKind).toBe('node')
    })
  })
})
