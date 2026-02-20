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

  it('uses user-provided arrays when specified', () => {
    const config = resolveConfig({
      excludeFiles: ['custom.tsx'],
    })
    expect(config.excludeFiles).toEqual(['custom.tsx'])
  })

  it('falls back to default arrays when not provided', () => {
    const config = resolveConfig({})
    expect(config.excludeFiles).toEqual(defaultConfig.excludeFiles)
    expect(config.excludeComponents).toEqual(defaultConfig.excludeComponents)
    expect(config.filteredProps).toEqual(defaultConfig.filteredProps)
    expect(config.filteredPropPatterns).toEqual(defaultConfig.filteredPropPatterns)
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
