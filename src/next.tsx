'use client'

/**
 * jc/next — Next.js App Router adapter
 *
 * Provides `createShowcasePage()` to wire up a showcase route with minimal boilerplate.
 *
 * @example
 * // src/app/jc/page.tsx
 * import { createShowcasePage } from 'jc/next'
 * import meta from '@/jc/generated/meta.json'
 * import { registry } from '@/jc/generated/registry'
 *
 * export default createShowcasePage({ meta, registry })
 *
 * @example With fixtures and wrapper
 * import { createShowcasePage } from 'jc/next'
 * import meta from '@/jc/generated/meta.json'
 * import { registry } from '@/jc/generated/registry'
 * import { lucideFixtures } from './fixtures'
 * import { ThemeProvider } from '@/components/theme-provider'
 *
 * export default createShowcasePage({
 *   meta,
 *   registry,
 *   fixtures: [lucideFixtures],
 *   wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
 * })
 */

import type { ComponentType, ReactNode } from 'react'
import { ShowcaseApp } from './components/showcase-app.js'
import type { JcFixturePlugin, JcMeta } from './types.js'

interface CreateShowcasePageOptions {
  /** Component metadata from meta.json (cast as JcMeta) */
  meta: JcMeta
  /** Lazy component loaders from registry.ts */
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>
  /** Optional fixture plugins */
  fixtures?: JcFixturePlugin[]
  /** Optional wrapper for context providers */
  wrapper?: ComponentType<{ children: ReactNode }>
  /** Select a specific component on mount */
  initialComponent?: string
  /** When false, disables URL sync (default true) */
  syncUrl?: boolean
}

/**
 * Creates a Next.js page component that renders the jc showcase.
 * Returns a client component suitable for `export default` in a page.tsx.
 *
 * @example
 * // src/app/jc/page.tsx
 * import { createShowcasePage } from 'jc/next'
 * import meta from '@/jc/generated/meta.json'
 * import { registry } from '@/jc/generated/registry'
 * export default createShowcasePage({ meta, registry })
 */
export function createShowcasePage(options: CreateShowcasePageOptions) {
  const { meta, registry, fixtures, wrapper, initialComponent, syncUrl } = options

  function JcShowcasePage() {
    return (
      <ShowcaseApp
        meta={meta}
        registry={registry}
        fixtures={fixtures}
        wrapper={wrapper}
        initialComponent={initialComponent}
        syncUrl={syncUrl}
      />
    )
  }
  JcShowcasePage.displayName = 'JcShowcasePage'

  return JcShowcasePage
}
