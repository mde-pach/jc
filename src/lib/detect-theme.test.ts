// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { detect } from './use-theme.js'

describe('detect (theme detection)', () => {
  let matchesDark: boolean

  beforeEach(() => {
    matchesDark = false
    // jsdom doesn't implement matchMedia — stub it
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? matchesDark : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    const html = document.documentElement
    html.className = ''
    html.removeAttribute('data-theme')
    html.removeAttribute('data-mode')
    html.style.colorScheme = ''
  })

  it('returns light by default', () => {
    expect(detect()).toBe('light')
  })

  it('detects dark from html class', () => {
    document.documentElement.classList.add('dark')
    expect(detect()).toBe('dark')
  })

  it('detects dark from data-theme attribute', () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    expect(detect()).toBe('dark')
  })

  it('detects dark from data-mode attribute', () => {
    document.documentElement.setAttribute('data-mode', 'dark')
    expect(detect()).toBe('dark')
  })

  it('detects dark from style.colorScheme', () => {
    document.documentElement.style.colorScheme = 'dark'
    expect(detect()).toBe('dark')
  })

  it('returns light when html has light class', () => {
    document.documentElement.classList.add('light')
    expect(detect()).toBe('light')
  })

  it('returns light when data-theme is light', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    expect(detect()).toBe('light')
  })

  it('returns light when colorScheme is light', () => {
    document.documentElement.style.colorScheme = 'light'
    expect(detect()).toBe('light')
  })

  it('prioritizes class over data-theme', () => {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'light')
    expect(detect()).toBe('dark')
  })

  it('prioritizes data-theme over data-mode', () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.setAttribute('data-mode', 'light')
    expect(detect()).toBe('dark')
  })

  it('detects dark from prefers-color-scheme media query', () => {
    matchesDark = true
    expect(detect()).toBe('dark')
  })

  it('returns light when prefers-color-scheme is light', () => {
    matchesDark = false
    expect(detect()).toBe('light')
  })
})
