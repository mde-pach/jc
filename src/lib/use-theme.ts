'use client'

import { useCallback, useEffect, useState } from 'react'

export type JcTheme = 'light' | 'dark'
export type JcThemeMode = 'auto' | 'light' | 'dark'

/**
 * Theme hook with auto-detection and manual override.
 *
 * Default: 'auto' — follows the host app's theme.
 * User can cycle through: auto → light → dark → auto.
 */
export function useTheme() {
  const [mode, setMode] = useState<JcThemeMode>('auto')
  const [detected, setDetected] = useState<JcTheme>(() => detect())

  useEffect(() => {
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
      if (prev === 'auto') return 'light'
      if (prev === 'light') return 'dark'
      return 'auto'
    })
  }, [])

  return { theme: resolved, mode, cycle }
}

// Keep backwards compat
export function useThemeDetection(): JcTheme {
  const { theme } = useTheme()
  return theme
}

function detect(): JcTheme {
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
