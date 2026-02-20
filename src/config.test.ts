import { describe, expect, it } from 'vitest'
import { defaultConfig, resolveConfig } from './config.js'

describe('defaultConfig', () => {
  it('has sensible defaults for shadcn/ui', () => {
    expect(defaultConfig.componentGlob).toBe('src/components/ui/**/*.tsx')
    expect(defaultConfig.outputDir).toBe('src/jc/generated')
    expect(defaultConfig.pathAlias).toEqual({ '@/': 'src/' })
  })

  it('excludes common non-component files', () => {
    expect(defaultConfig.excludeFiles).toContain('index.ts')
    expect(defaultConfig.excludeFiles).toContain('toaster.tsx')
    expect(defaultConfig.excludeFiles).toContain('form.tsx')
  })

  it('filters internal React props', () => {
    expect(defaultConfig.filteredProps).toContain('ref')
    expect(defaultConfig.filteredProps).toContain('key')
    expect(defaultConfig.filteredProps).toContain('dangerouslySetInnerHTML')
  })
})

describe('resolveConfig', () => {
  it('returns defaults when given empty object', () => {
    const config = resolveConfig({})
    expect(config).toEqual(defaultConfig)
  })

  it('overrides scalar values', () => {
    const config = resolveConfig({
      componentGlob: 'lib/components/**/*.tsx',
      outputDir: 'generated',
    })
    expect(config.componentGlob).toBe('lib/components/**/*.tsx')
    expect(config.outputDir).toBe('generated')
  })

  it('merges user arrays with defaults (union)', () => {
    const config = resolveConfig({
      excludeFiles: ['custom.tsx'],
    })
    // Should contain both defaults and user values
    expect(config.excludeFiles).toContain('custom.tsx')
    expect(config.excludeFiles).toContain('index.ts')
    expect(config.excludeFiles).toContain('toaster.tsx')
  })

  it('deduplicates when user repeats a default value', () => {
    const config = resolveConfig({
      excludeFiles: ['index.ts', 'custom.tsx'],
    })
    const count = config.excludeFiles!.filter((f) => f === 'index.ts').length
    expect(count).toBe(1)
  })

  it('falls back to default arrays when not provided', () => {
    const config = resolveConfig({})
    expect(config.excludeFiles).toEqual(defaultConfig.excludeFiles)
    expect(config.excludeComponents).toEqual(defaultConfig.excludeComponents)
    expect(config.filteredProps).toEqual(defaultConfig.filteredProps)
    expect(config.filteredPropPatterns).toEqual(defaultConfig.filteredPropPatterns)
  })

  it('merges all array config fields', () => {
    const config = resolveConfig({
      excludeComponents: ['MyCustomComponent'],
      filteredProps: ['customProp'],
      filteredPropPatterns: ['^custom-'],
    })
    expect(config.excludeComponents).toContain('MyCustomComponent')
    expect(config.excludeComponents).toContain('DialogPortal')
    expect(config.filteredProps).toContain('customProp')
    expect(config.filteredProps).toContain('ref')
    expect(config.filteredPropPatterns).toContain('^custom-')
    expect(config.filteredPropPatterns).toContain('^aria-')
  })

  it('respects custom pathAlias', () => {
    const config = resolveConfig({ pathAlias: { '~/': 'src/' } })
    expect(config.pathAlias).toEqual({ '~/': 'src/' })
  })

  it('falls back to default pathAlias', () => {
    const config = resolveConfig({})
    expect(config.pathAlias).toEqual({ '@/': 'src/' })
  })
})
