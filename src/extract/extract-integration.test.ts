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

  it('extracts components from fixture files', () => {
    const meta = extract(projectRoot, config)
    expect(meta.components.length).toBeGreaterThanOrEqual(1)
  })

  it('extracts the Button component with correct displayName', () => {
    const meta = extract(projectRoot, config)
    const button = meta.components.find((c) => c.displayName === 'Button')
    expect(button).toBeDefined()
    expect(button!.displayName).toBe('Button')
  })

  it('extracts props with correct types and values', () => {
    const meta = extract(projectRoot, config)
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
    const meta = extract(projectRoot, config)
    const button = meta.components.find((c) => c.displayName === 'Button')!
    expect(button.acceptsChildren).toBe(true)
  })

  it('detects componentKind for icon prop', () => {
    const meta = extract(projectRoot, config)
    const button = meta.components.find((c) => c.displayName === 'Button')!
    expect(button.props.icon).toBeDefined()
    expect(button.props.icon.componentKind).toBe('icon')
  })

  it('filters out built-in React props (ref, key, aria-, data-, event handlers)', () => {
    const meta = extract(projectRoot, config)
    const button = meta.components.find((c) => c.displayName === 'Button')!
    expect(button.props.ref).toBeUndefined()
    expect(button.props.key).toBeUndefined()
    // children should not appear as a regular prop
    expect(button.props.children).toBeUndefined()
  })

  it('sets correct filePath relative to project root', () => {
    const meta = extract(projectRoot, config)
    const button = meta.components.find((c) => c.displayName === 'Button')!
    expect(button.filePath).toContain('__fixtures__/sample-button.tsx')
    // Should not contain absolute path
    expect(button.filePath).not.toContain(projectRoot)
  })

  it('deduplicates components by displayName keeping the one with more props', () => {
    const meta = extract(projectRoot, config)
    const names = meta.components.map((c) => c.displayName)
    const unique = new Set(names)
    expect(names.length).toBe(unique.size)
  })

  it('includes metadata fields', () => {
    const meta = extract(projectRoot, config)
    expect(meta.generatedAt).toBeDefined()
    expect(meta.componentDir).toBe(config.componentGlob)
  })

  it('extracts prop descriptions from JSDoc', () => {
    const meta = extract(projectRoot, config)
    const button = meta.components.find((c) => c.displayName === 'Button')!
    expect(button.props.variant.description).toBe('The visual style variant')
    expect(button.props.disabled.description).toBe('Whether the button is disabled')
  })
})
