import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  NEXTJS_CONVENTION_FILES,
  NON_COMPONENT_FILENAMES,
  NON_COMPONENT_PATTERNS,
  discoverComponentGlobs,
  isNonComponentFile,
} from './discover.js'
import { findFiles } from './pipeline.js'

// ── NON_COMPONENT_PATTERNS ────────────────────────────────────

describe('NON_COMPONENT_PATTERNS', () => {
  it('matches .test.tsx files', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('button.test.tsx'))).toBe(true)
  })

  it('matches .test.ts files', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('utils.test.ts'))).toBe(true)
  })

  it('matches .spec.ts files', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('component.spec.ts'))).toBe(true)
  })

  it('matches .spec.tsx files', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('card.spec.tsx'))).toBe(true)
  })

  it('matches .stories.tsx files', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('button.stories.tsx'))).toBe(true)
  })

  it('matches .d.ts files', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('types.d.ts'))).toBe(true)
  })

  it('matches paths with /hooks/ segment', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('src/hooks/useAuth.tsx'))).toBe(true)
  })

  it('matches paths with /hook/ segment', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('src/hook/useData.ts'))).toBe(true)
  })

  it('matches paths with /utils/ segment', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('src/utils/helper.tsx'))).toBe(true)
  })

  it('matches paths with /util/ segment', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('src/util/format.ts'))).toBe(true)
  })

  it('matches paths with /lib/ segment', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('src/lib/query.ts'))).toBe(true)
  })

  it('matches paths with /providers/ segment', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('src/providers/theme.tsx'))).toBe(true)
  })

  it('matches paths with /provider/ segment', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('src/provider/auth.tsx'))).toBe(true)
  })

  it('matches paths with /contexts/ segment', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('src/contexts/auth.tsx'))).toBe(true)
  })

  it('matches paths with /context/ segment', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('src/context/modal.tsx'))).toBe(true)
  })

  it('matches paths with /types/ segment', () => {
    expect(NON_COMPONENT_PATTERNS.some((p) => p.test('src/types/api.ts'))).toBe(true)
  })
})

// ── NON_COMPONENT_FILENAMES ───────────────────────────────────

describe('NON_COMPONENT_FILENAMES', () => {
  it('contains index.ts', () => {
    expect(NON_COMPONENT_FILENAMES.has('index.ts')).toBe(true)
  })

  it('contains index.tsx', () => {
    expect(NON_COMPONENT_FILENAMES.has('index.tsx')).toBe(true)
  })

  it('contains types.ts', () => {
    expect(NON_COMPONENT_FILENAMES.has('types.ts')).toBe(true)
  })

  it('contains utils.ts', () => {
    expect(NON_COMPONENT_FILENAMES.has('utils.ts')).toBe(true)
  })

  it('contains helpers.ts', () => {
    expect(NON_COMPONENT_FILENAMES.has('helpers.ts')).toBe(true)
  })

  it('contains constants.ts', () => {
    expect(NON_COMPONENT_FILENAMES.has('constants.ts')).toBe(true)
  })

  it('does not contain button.tsx', () => {
    expect(NON_COMPONENT_FILENAMES.has('button.tsx')).toBe(false)
  })
})

// ── isNonComponentFile ────────────────────────────────────────

describe('isNonComponentFile', () => {
  // Test file patterns
  it('returns true for .test.tsx files', () => {
    expect(isNonComponentFile('src/components/button.test.tsx', 'button.test.tsx')).toBe(true)
  })

  it('returns true for .test.ts files', () => {
    expect(isNonComponentFile('src/utils/helpers.test.ts', 'helpers.test.ts')).toBe(true)
  })

  it('returns true for .spec.ts files', () => {
    expect(isNonComponentFile('src/components/card.spec.ts', 'card.spec.ts')).toBe(true)
  })

  it('returns true for .spec.tsx files', () => {
    expect(isNonComponentFile('src/components/card.spec.tsx', 'card.spec.tsx')).toBe(true)
  })

  it('returns true for .stories.tsx files', () => {
    expect(isNonComponentFile('src/components/button.stories.tsx', 'button.stories.tsx')).toBe(
      true,
    )
  })

  it('returns true for .d.ts files', () => {
    expect(isNonComponentFile('src/types/globals.d.ts', 'globals.d.ts')).toBe(true)
  })

  // Hook directories
  it('returns true for files in hooks/ directory', () => {
    expect(isNonComponentFile('src/hooks/useAuth.tsx', 'useAuth.tsx')).toBe(true)
  })

  it('returns true for files in hook/ directory (singular)', () => {
    expect(isNonComponentFile('src/hook/useData.ts', 'useData.ts')).toBe(true)
  })

  it('returns true for nested hook paths', () => {
    expect(isNonComponentFile('components/hooks/useModal.tsx', 'useModal.tsx')).toBe(true)
  })

  // Util directories
  it('returns true for files in utils/ directory', () => {
    expect(isNonComponentFile('src/utils/helper.tsx', 'helper.tsx')).toBe(true)
  })

  it('returns true for files in util/ directory (singular)', () => {
    expect(isNonComponentFile('src/util/format.ts', 'format.ts')).toBe(true)
  })

  it('returns true for files in lib/ directory', () => {
    expect(isNonComponentFile('src/lib/query.ts', 'query.ts')).toBe(true)
  })

  // Provider/context directories
  it('returns true for files in providers/ directory', () => {
    expect(isNonComponentFile('src/providers/theme.tsx', 'theme.tsx')).toBe(true)
  })

  it('returns true for files in provider/ directory (singular)', () => {
    expect(isNonComponentFile('src/provider/auth.tsx', 'auth.tsx')).toBe(true)
  })

  it('returns true for files in contexts/ directory', () => {
    expect(isNonComponentFile('src/contexts/auth.tsx', 'auth.tsx')).toBe(true)
  })

  it('returns true for files in context/ directory (singular)', () => {
    expect(isNonComponentFile('src/context/modal.tsx', 'modal.tsx')).toBe(true)
  })

  // Filename-based exclusions
  it('returns true for index.ts by filename', () => {
    expect(isNonComponentFile('src/components/index.ts', 'index.ts')).toBe(true)
  })

  it('returns true for index.tsx by filename', () => {
    expect(isNonComponentFile('src/components/ui/index.tsx', 'index.tsx')).toBe(true)
  })

  it('returns true for types.ts by filename', () => {
    expect(isNonComponentFile('src/components/types.ts', 'types.ts')).toBe(true)
  })

  it('returns true for utils.ts by filename', () => {
    expect(isNonComponentFile('src/components/utils.ts', 'utils.ts')).toBe(true)
  })

  it('returns true for helpers.ts by filename', () => {
    expect(isNonComponentFile('src/components/helpers.ts', 'helpers.ts')).toBe(true)
  })

  it('returns true for constants.ts by filename', () => {
    expect(isNonComponentFile('src/components/constants.ts', 'constants.ts')).toBe(true)
  })

  // Component files — should return false
  it('returns false for a plain component file', () => {
    expect(isNonComponentFile('src/components/button.tsx', 'button.tsx')).toBe(false)
  })

  it('returns false for a component in a ui subdirectory', () => {
    expect(isNonComponentFile('src/components/ui/input.tsx', 'input.tsx')).toBe(false)
  })

  it('returns false for card.tsx', () => {
    expect(isNonComponentFile('src/components/card.tsx', 'card.tsx')).toBe(false)
  })

  it('returns false for dialog.tsx', () => {
    expect(isNonComponentFile('src/components/ui/dialog.tsx', 'dialog.tsx')).toBe(false)
  })

  it('returns false for badge.tsx', () => {
    expect(isNonComponentFile('components/badge.tsx', 'badge.tsx')).toBe(false)
  })

  // Framework-aware filtering
  it('returns true for layout.tsx when framework is next', () => {
    expect(isNonComponentFile('app/dashboard/layout.tsx', 'layout.tsx', 'next')).toBe(true)
  })

  it('returns true for page.tsx when framework is next', () => {
    expect(isNonComponentFile('app/dashboard/page.tsx', 'page.tsx', 'next')).toBe(true)
  })

  it('returns true for loading.tsx when framework is next', () => {
    expect(isNonComponentFile('app/loading.tsx', 'loading.tsx', 'next')).toBe(true)
  })

  it('returns true for error.tsx when framework is next', () => {
    expect(isNonComponentFile('app/error.tsx', 'error.tsx', 'next')).toBe(true)
  })

  it('returns true for not-found.tsx when framework is next', () => {
    expect(isNonComponentFile('app/not-found.tsx', 'not-found.tsx', 'next')).toBe(true)
  })

  it('returns true for template.tsx when framework is next', () => {
    expect(isNonComponentFile('app/template.tsx', 'template.tsx', 'next')).toBe(true)
  })

  it('returns false for layout.tsx when framework is react (not next)', () => {
    expect(isNonComponentFile('components/layout.tsx', 'layout.tsx', 'react')).toBe(false)
  })

  it('returns false for page.tsx when no framework specified', () => {
    expect(isNonComponentFile('components/page.tsx', 'page.tsx')).toBe(false)
  })
})

// ── NEXTJS_CONVENTION_FILES ──────────────────────────────────

describe('NEXTJS_CONVENTION_FILES', () => {
  it('contains all Next.js App Router convention files', () => {
    for (const f of ['layout.tsx', 'page.tsx', 'loading.tsx', 'error.tsx', 'not-found.tsx', 'template.tsx', 'default.tsx', 'route.ts', 'global-error.tsx']) {
      expect(NEXTJS_CONVENTION_FILES.has(f)).toBe(true)
    }
  })
})

// ── discoverComponentGlobs ────────────────────────────────────

describe('discoverComponentGlobs', () => {
  let tmpDir: string

  beforeEach(() => {
    // Use a unique temp directory per test
    tmpDir = join('/tmp', `jc-discover-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns fallback pattern when no component directories exist', () => {
    const globs = discoverComponentGlobs(tmpDir)
    expect(globs).toEqual(['src/components/**/*.tsx'])
  })

  it('returns matching pattern when src/components/ui/ exists', () => {
    mkdirSync(join(tmpDir, 'src', 'components', 'ui'), { recursive: true })
    const globs = discoverComponentGlobs(tmpDir)
    expect(globs).toContain('src/components/ui/**/*.tsx')
  })

  it('returns matching pattern when src/components/ exists (without ui/)', () => {
    mkdirSync(join(tmpDir, 'src', 'components'), { recursive: true })
    const globs = discoverComponentGlobs(tmpDir)
    expect(globs).toContain('src/components/**/*.tsx')
  })

  it('returns matching pattern when components/ui/ exists at root', () => {
    mkdirSync(join(tmpDir, 'components', 'ui'), { recursive: true })
    const globs = discoverComponentGlobs(tmpDir)
    expect(globs).toContain('components/ui/**/*.tsx')
  })

  it('returns matching pattern when components/ exists at root', () => {
    mkdirSync(join(tmpDir, 'components'), { recursive: true })
    const globs = discoverComponentGlobs(tmpDir)
    expect(globs).toContain('components/**/*.tsx')
  })

  it('returns matching pattern when src/ui/ exists', () => {
    mkdirSync(join(tmpDir, 'src', 'ui'), { recursive: true })
    const globs = discoverComponentGlobs(tmpDir)
    expect(globs).toContain('src/ui/**/*.tsx')
  })

  it('returns matching pattern when ui/ exists at root', () => {
    mkdirSync(join(tmpDir, 'ui'), { recursive: true })
    const globs = discoverComponentGlobs(tmpDir)
    expect(globs).toContain('ui/**/*.tsx')
  })

  it('returns multiple patterns when multiple directories exist', () => {
    mkdirSync(join(tmpDir, 'src', 'components', 'ui'), { recursive: true })
    mkdirSync(join(tmpDir, 'src', 'components'), { recursive: true })
    const globs = discoverComponentGlobs(tmpDir)
    expect(globs).toContain('src/components/ui/**/*.tsx')
    expect(globs).toContain('src/components/**/*.tsx')
    expect(globs.length).toBeGreaterThanOrEqual(2)
  })

  it('orders more specific patterns before broader ones', () => {
    mkdirSync(join(tmpDir, 'src', 'components', 'ui'), { recursive: true })
    mkdirSync(join(tmpDir, 'src', 'components'), { recursive: true })
    const globs = discoverComponentGlobs(tmpDir)
    const uiIndex = globs.indexOf('src/components/ui/**/*.tsx')
    const allIndex = globs.indexOf('src/components/**/*.tsx')
    expect(uiIndex).toBeLessThan(allIndex)
  })

  it('does not include patterns for non-existent directories', () => {
    mkdirSync(join(tmpDir, 'src', 'components'), { recursive: true })
    const globs = discoverComponentGlobs(tmpDir)
    expect(globs).not.toContain('components/**/*.tsx')
    expect(globs).not.toContain('ui/**/*.tsx')
  })
})

// ── findFiles (glob fallback) ────────────────────────────────

describe('findFiles', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = join('/tmp', `jc-findfiles-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  function touch(relPath: string) {
    const full = join(tmpDir, relPath)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, '')
  }

  it('matches **/*.tsx in nested directories', () => {
    touch('src/components/button.tsx')
    touch('src/components/ui/input.tsx')
    touch('src/utils/helper.ts')

    const results = findFiles('src/components/**/*.tsx', tmpDir)
    expect(results.sort()).toEqual([
      'src/components/button.tsx',
      'src/components/ui/input.tsx',
    ])
  })

  it('matches *.tsx in a flat directory', () => {
    touch('components/card.tsx')
    touch('components/badge.tsx')
    touch('components/styles.css')

    const results = findFiles('components/*.tsx', tmpDir)
    expect(results.sort()).toEqual([
      'components/badge.tsx',
      'components/card.tsx',
    ])
  })

  it('skips node_modules', () => {
    touch('src/components/button.tsx')
    touch('src/node_modules/react/index.tsx')

    const results = findFiles('src/**/*.tsx', tmpDir)
    expect(results).toEqual(['src/components/button.tsx'])
  })

  it('returns empty array for non-existent base directory', () => {
    const results = findFiles('nonexistent/**/*.tsx', tmpDir)
    expect(results).toEqual([])
  })

  it('handles patterns with specific subdirectory prefix', () => {
    touch('src/components/ui/dialog.tsx')
    touch('src/components/shared/modal.tsx')
    touch('src/hooks/useAuth.tsx')

    const results = findFiles('src/components/**/*.tsx', tmpDir)
    expect(results.sort()).toEqual([
      'src/components/shared/modal.tsx',
      'src/components/ui/dialog.tsx',
    ])
  })
})
