import { describe, expect, it, vi } from 'vitest'
import { makeProp } from '../__test-utils__/factories.js'
import { createFakerResolver, defineFakerStrategy } from './faker-strategy.js'

// ── defineFakerStrategy ─────────────────────────────────────

describe('defineFakerStrategy', () => {
  it('returns the strategy as-is (identity)', () => {
    const strategy = {
      name: 'test',
      match: () => true,
      generate: () => 'value',
    }
    expect(defineFakerStrategy(strategy)).toBe(strategy)
  })
})

// ── createFakerResolver ─────────────────────────────────────

describe('createFakerResolver', () => {
  it('returns builtin generator when no custom strategies', () => {
    const builtin = vi.fn(() => 'builtin')
    const resolver = createFakerResolver(undefined, builtin)
    const result = resolver('email', makeProp())
    expect(result).toBe('builtin')
    expect(builtin).toHaveBeenCalledWith('email', expect.any(Object))
  })

  it('returns builtin generator when empty strategies array', () => {
    const builtin = vi.fn(() => 'builtin')
    const resolver = createFakerResolver([], builtin)
    const result = resolver('email', makeProp())
    expect(result).toBe('builtin')
  })

  it('returns () => undefined when no strategies and no builtin', () => {
    const resolver = createFakerResolver(undefined)
    expect(resolver('test', makeProp())).toBeUndefined()
  })

  it('uses matching strategy over builtin', () => {
    const strategy = defineFakerStrategy({
      name: 'email',
      match: (name) => name === 'email',
      generate: () => 'custom@test.com',
    })
    const builtin = vi.fn(() => 'builtin')
    const resolver = createFakerResolver([strategy], builtin)

    expect(resolver('email', makeProp())).toBe('custom@test.com')
    expect(builtin).not.toHaveBeenCalled()
  })

  it('falls back to builtin when strategy does not match', () => {
    const strategy = defineFakerStrategy({
      name: 'email',
      match: (name) => name === 'email',
      generate: () => 'custom@test.com',
    })
    const builtin = vi.fn(() => 'builtin')
    const resolver = createFakerResolver([strategy], builtin)

    expect(resolver('name', makeProp())).toBe('builtin')
    expect(builtin).toHaveBeenCalledWith('name', expect.any(Object))
  })

  it('falls back to builtin when strategy returns undefined', () => {
    const strategy = defineFakerStrategy({
      name: 'maybe',
      match: () => true,
      generate: () => undefined,
    })
    const builtin = vi.fn(() => 'fallback')
    const resolver = createFakerResolver([strategy], builtin)

    expect(resolver('test', makeProp())).toBe('fallback')
  })

  it('respects priority ordering (higher runs first)', () => {
    const low = defineFakerStrategy({
      name: 'low',
      priority: 1,
      match: () => true,
      generate: () => 'low-value',
    })
    const high = defineFakerStrategy({
      name: 'high',
      priority: 10,
      match: () => true,
      generate: () => 'high-value',
    })
    // Pass in wrong order — should still sort by priority
    const resolver = createFakerResolver([low, high])

    expect(resolver('test', makeProp())).toBe('high-value')
  })

  it('tries next strategy when higher-priority returns undefined', () => {
    const high = defineFakerStrategy({
      name: 'high',
      priority: 10,
      match: () => true,
      generate: () => undefined,
    })
    const low = defineFakerStrategy({
      name: 'low',
      priority: 1,
      match: () => true,
      generate: () => 'low-value',
    })
    const resolver = createFakerResolver([high, low])

    expect(resolver('test', makeProp())).toBe('low-value')
  })

  it('falls back to builtin when all strategies return undefined', () => {
    const s1 = defineFakerStrategy({
      name: 's1',
      match: () => true,
      generate: () => undefined,
    })
    const s2 = defineFakerStrategy({
      name: 's2',
      match: () => true,
      generate: () => undefined,
    })
    const builtin = vi.fn(() => 'final')
    const resolver = createFakerResolver([s1, s2], builtin)

    expect(resolver('test', makeProp())).toBe('final')
  })

  it('returns undefined when no strategies match and no builtin', () => {
    const strategy = defineFakerStrategy({
      name: 'nope',
      match: () => false,
      generate: () => 'never',
    })
    const resolver = createFakerResolver([strategy])

    expect(resolver('test', makeProp())).toBeUndefined()
  })

  it('uses default priority 0 when not specified', () => {
    const withPriority = defineFakerStrategy({
      name: 'with',
      priority: 1,
      match: () => true,
      generate: () => 'priority',
    })
    const withoutPriority = defineFakerStrategy({
      name: 'without',
      match: () => true,
      generate: () => 'default',
    })
    const resolver = createFakerResolver([withoutPriority, withPriority])

    expect(resolver('test', makeProp())).toBe('priority')
  })
})
