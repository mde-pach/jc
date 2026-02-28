'use client'

/**
 * Lightweight localStorage persistence for showcase preferences.
 * All preferences are stored under a single `jc-prefs` key as JSON.
 * Reads/writes are synchronous and safe (no-op when localStorage is unavailable).
 */

const STORAGE_KEY = 'jc-prefs'

export interface JcPreferences {
  themeMode?: 'auto' | 'light' | 'dark'
  sidebarWidth?: number
  controlsWidth?: number
  codeMode?: 'jsx' | 'full'
}

function read(): JcPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as JcPreferences
  } catch {
    return {}
  }
}

function write(prefs: JcPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // localStorage unavailable (SSR, private browsing quota) — ignore
  }
}

/** Read a single preference */
export function getPref<K extends keyof JcPreferences>(key: K): JcPreferences[K] {
  return read()[key]
}

/** Write a single preference (merges with existing) */
export function setPref<K extends keyof JcPreferences>(key: K, value: JcPreferences[K]): void {
  write({ ...read(), [key]: value })
}
