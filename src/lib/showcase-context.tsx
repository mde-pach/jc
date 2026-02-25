'use client'

/**
 * React Context for the showcase app.
 *
 * Provides state, actions, and shared data (meta, fixtures, registry)
 * to all showcase sub-components. Eliminates prop drilling through
 * intermediate layout components.
 *
 * Used internally by ShowcaseApp's default layout. Also exported for
 * consumers building custom layouts with the render prop API.
 */

import { type ComponentType, type ReactNode, createContext, useContext } from 'react'
import type { JcComponentMeta, JcMeta, JcPlugin, JcResolvedPluginItem } from '../types.js'
import type { ShowcaseState } from './use-showcase-state.js'

/** Full context value for the showcase */
export interface ShowcaseContextValue {
  /** Central state object with data + action callbacks */
  state: ShowcaseState
  /** Component metadata extracted by the CLI */
  meta: JcMeta
  /** All resolved plugin items */
  resolvedItems: JcResolvedPluginItem[]
  /** All active plugins */
  plugins: JcPlugin[]
  /** Wrapper component metas for the selected component */
  wrapperMetas: JcComponentMeta[]
  /** Lazy component loaders keyed by display name */
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>
  /** Optional wrapper for context providers (theme, router, etc.) */
  wrapper?: ComponentType<{ children: ReactNode }>
}

const ShowcaseContext = createContext<ShowcaseContextValue | null>(null)

/** Provider component that makes showcase state available to all children */
export function ShowcaseProvider({
  children,
  value,
}: {
  children: ReactNode
  value: ShowcaseContextValue
}) {
  return <ShowcaseContext.Provider value={value}>{children}</ShowcaseContext.Provider>
}

/**
 * Access the showcase context. Throws if used outside a ShowcaseProvider.
 * Use `useOptionalShowcaseContext` for optional access.
 */
export function useShowcaseContext(): ShowcaseContextValue {
  const ctx = useContext(ShowcaseContext)
  if (!ctx) {
    throw new Error('useShowcaseContext must be used within a ShowcaseProvider')
  }
  return ctx
}

/**
 * Access the showcase context without throwing if outside provider.
 * Returns null when no provider is present — useful for components
 * that work both standalone (with props) and inside a provider.
 */
export function useOptionalShowcaseContext(): ShowcaseContextValue | null {
  return useContext(ShowcaseContext)
}
