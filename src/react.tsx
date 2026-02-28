/**
 * jc/react — Plain React adapter (Vite, CRA, custom setups)
 *
 * Provides `createShowcase()` to mount the showcase in any React router.
 *
 * @example React Router
 * import { createShowcase } from 'jc/react'
 * import meta from './jc/generated/meta.json'
 * import { registry } from './jc/generated/registry'
 *
 * const Showcase = createShowcase({ meta, registry })
 *
 * // In your router:
 * <Route path="/showcase" element={<Showcase />} />
 *
 * @example With plugins and wrapper
 * import { createShowcase } from 'jc/react'
 * import { lucidePlugin } from 'jc/plugins/lucide'
 * import meta from './jc/generated/meta.json'
 * import { registry } from './jc/generated/registry'
 * import { ThemeProvider } from './components/theme-provider'
 *
 * const Showcase = createShowcase({
 *   meta,
 *   registry,
 *   plugins: [lucidePlugin],
 *   wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
 * })
 */

import type { ComponentType, ReactNode } from 'react'
import { ShowcaseApp } from './components/showcase-app.js'
import type { JcMeta, JcPlugin } from './types.js'

export interface CreateShowcaseOptions {
  /** Component metadata from meta.json — accepts raw JSON import (no cast needed) */
  meta: JcMeta | unknown
  /** Lazy component loaders from registry.ts */
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>
  /** Optional plugins (factories or plain objects) */
  plugins?: Array<JcPlugin | (() => JcPlugin)>
  /** Optional wrapper for context providers (e.g. ThemeProvider) */
  wrapper?: ComponentType<{ children: ReactNode }>
  /** Select a specific component on mount */
  initialComponent?: string
  /** When false, disables URL sync (default true) */
  syncUrl?: boolean
}

/**
 * Creates a React component that renders the jc showcase.
 * Works with any React router or can be rendered directly.
 *
 * @example
 * const Showcase = createShowcase({ meta, registry })
 * // Render anywhere: <Showcase />
 */
export function createShowcase(options: CreateShowcaseOptions) {
  const { meta, registry, plugins, wrapper, initialComponent, syncUrl } = options

  function JcShowcase() {
    return (
      <ShowcaseApp
        meta={meta}
        registry={registry}
        plugins={plugins}
        wrapper={wrapper}
        initialComponent={initialComponent}
        syncUrl={syncUrl}
      />
    )
  }
  JcShowcase.displayName = 'JcShowcase'

  return JcShowcase
}
