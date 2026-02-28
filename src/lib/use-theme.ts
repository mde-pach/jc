'use client'

import { useCallback, useEffect, useState } from 'react'
import { getPref, setPref } from './preferences.js'

export type JcTheme = 'light' | 'dark'
export type JcThemeMode = 'auto' | 'light' | 'dark'

/**
 * Theme hook with auto-detection and manual override.
 *
 * Default: 'auto' — follows the host app's theme.
 * User can cycle through: auto → light → dark → auto.
 * Persists the selected mode to localStorage.
 *
 * Always starts with 'light' during SSR to avoid hydration mismatches,
 * then detects the real theme in a client-side effect.
 */
export function useTheme() {
  const [mode, setMode] = useState<JcThemeMode>('auto')
  // Always start 'light' to match SSR — detect real theme in useEffect
  const [detected, setDetected] = useState<JcTheme>('light')

  // Restore persisted mode on mount
  useEffect(() => {
    const saved = getPref('themeMode')
    if (saved) setMode(saved)
  }, [])

  useEffect(() => {
    // Detect on mount
    setDetected(detect())

    const html = document.documentElement
    const observer = new MutationObserver(() => setDetected(detect()))
    observer.observe(html, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-mode', 'style'],
    })

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onMediaChange = () => setDetected(detect())
    mq.addEventListener('change', onMediaChange)

    return () => {
      observer.disconnect()
      mq.removeEventListener('change', onMediaChange)
    }
  }, [])

  const resolved: JcTheme = mode === 'auto' ? detected : mode

  const cycle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'auto' ? 'light' : prev === 'light' ? 'dark' : 'auto'
      setPref('themeMode', next)
      return next
    })
  }, [])

  return { theme: resolved, mode, cycle }
}

export function detect(): JcTheme {
  if (typeof document === 'undefined') return 'light'
  const html = document.documentElement

  if (html.classList.contains('dark')) return 'dark'
  if (html.getAttribute('data-theme') === 'dark') return 'dark'
  if (html.getAttribute('data-mode') === 'dark') return 'dark'

  const cs = html.style.colorScheme
  if (cs === 'dark') return 'dark'

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'

  return 'light'
}
