'use client'

import { useEffect, useState } from 'react'

export type JcTheme = 'light' | 'dark'

/**
 * Auto-detect the host app's theme.
 *
 * Detection order:
 * 1. `.dark` class on <html> (next-themes, shadcn convention)
 * 2. `data-theme="dark"` attribute on <html>
 * 3. `prefers-color-scheme: dark` media query
 *
 * Watches for changes via MutationObserver + matchMedia listener.
 */
export function useThemeDetection(): JcTheme {
  const [theme, setTheme] = useState<JcTheme>(() => detect())

  useEffect(() => {
    // Watch <html> class/attribute changes (next-themes, etc.)
    const html = document.documentElement
    const observer = new MutationObserver(() => setTheme(detect()))
    observer.observe(html, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-mode', 'style'],
    })

    // Watch OS preference
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onMediaChange = () => setTheme(detect())
    mq.addEventListener('change', onMediaChange)

    return () => {
      observer.disconnect()
      mq.removeEventListener('change', onMediaChange)
    }
  }, [])

  return theme
}

function detect(): JcTheme {
  if (typeof document === 'undefined') return 'light'
  const html = document.documentElement

  // Class-based (next-themes default, shadcn)
  if (html.classList.contains('dark')) return 'dark'

  // Attribute-based
  if (html.getAttribute('data-theme') === 'dark') return 'dark'
  if (html.getAttribute('data-mode') === 'dark') return 'dark'

  // Style-based (color-scheme property)
  const cs = html.style.colorScheme
  if (cs === 'dark') return 'dark'

  // OS preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'

  return 'light'
}
