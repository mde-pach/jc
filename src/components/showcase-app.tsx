'use client'

import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { buildComponentFixtures, resolveFixturePlugins } from '../lib/fixtures.js'
import { THEME } from '../lib/theme-vars.js'
import { getViewportFromUrl, setViewportInUrl } from '../lib/url-sync.js'
import { useShowcaseState } from '../lib/use-showcase-state.js'
import { useTheme } from '../lib/use-theme.js'
import type { JcComponentMeta, JcFixturePlugin, JcMeta } from '../types.js'
import { ShowcaseControls } from './showcase-controls.js'
import { ShowcasePreview } from './showcase-preview.js'
import { ShowcaseSidebar } from './showcase-sidebar.js'
import { ThemeToggle } from './theme-toggle.js'
import { VIEWPORTS, type ViewportKey, ViewportPicker } from './viewport-picker.js'

/** State and derived data passed to the children render prop */
export interface ShowcaseRenderContext {
  state: ReturnType<typeof useShowcaseState>
  wrapperMetas: JcComponentMeta[]
  theme: 'light' | 'dark'
  vars: Record<string, string>
}

interface ShowcaseAppProps {
  /** Component metadata extracted by the jc CLI */
  meta: JcMeta
  /** Lazy component loaders keyed by display name */
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>
  /**
   * Optional fixture plugins providing real components (icons, badges, etc.)
   * for the showcase to use in prop values and children.
   */
  fixtures?: JcFixturePlugin[]
  /**
   * Optional wrapper component applied around each previewed component.
   * Use this to inject context providers (theme, router, i18n, etc.)
   */
  wrapper?: ComponentType<{ children: ReactNode }>
  /** Select a specific component on mount instead of the first one */
  initialComponent?: string
  /** When false, disables URL read/write (default true) */
  syncUrl?: boolean
  /**
   * Optional render prop for custom layouts. Receives the showcase state
   * and derived data. When absent, uses the default full-app layout.
   */
  children?: (ctx: ShowcaseRenderContext) => ReactNode
}

/**
 * Root showcase component. Renders a full-viewport app with:
 * - Left sidebar: component list with search
 * - Center: live component preview with code snippet
 * - Right sidebar: interactive prop controls
 *
 * Accepts optional `children` render prop for custom layouts.
 */
export function ShowcaseApp({
  meta,
  registry,
  fixtures,
  wrapper,
  initialComponent,
  syncUrl = true,
  children,
}: ShowcaseAppProps) {
  const resolvedBaseFixtures = useMemo(() => resolveFixturePlugins(fixtures), [fixtures])
  const componentFixturePlugin = useMemo(
    () => buildComponentFixtures(meta, registry, resolvedBaseFixtures),
    [meta, registry, resolvedBaseFixtures],
  )
  const allFixturePlugins = useMemo(
    () => [...(fixtures ?? []), componentFixturePlugin],
    [fixtures, componentFixturePlugin],
  )
  const state = useShowcaseState(meta, allFixturePlugins, { syncUrl, initialComponent })
  const { theme, mode, cycle } = useTheme()
  const vars = THEME[theme]
  const wrapperMetas = useMemo(() => {
    const wrappers = state.selectedComponent?.wrapperComponents
    if (!wrappers || wrappers.length === 0) return []
    return wrappers
      .map((w) => meta.components.find((c) => c.displayName === w.displayName))
      .filter((c): c is (typeof meta.components)[number] => c !== undefined)
  }, [state.selectedComponent?.wrapperComponents, meta.components])
  const [viewport, setViewportState] = useState<ViewportKey>('responsive')
  const activeViewport = VIEWPORTS.find((v) => v.key === viewport)!

  // Read viewport from URL on mount (only when syncUrl is enabled)
  useEffect(() => {
    if (!syncUrl) return
    const fromUrl = getViewportFromUrl()
    if (fromUrl && VIEWPORTS.some((v) => v.key === fromUrl)) {
      setViewportState(fromUrl as ViewportKey)
    }
  }, [syncUrl])

  const setViewport = useCallback(
    (key: ViewportKey) => {
      setViewportState(key)
      if (syncUrl) setViewportInUrl(key)
    },
    [syncUrl],
  )

  // Custom layout via render prop
  if (children) {
    return (
      <div
        className="jc-showcase"
        style={{ ...vars, color: 'var(--jc-fg)' } as React.CSSProperties}
      >
        {children({ state, wrapperMetas, theme, vars })}
      </div>
    )
  }

  // Default full-app layout
  return (
    <>
      <style>{`
        .jc-showcase *::-webkit-scrollbar { display: none; }
        .jc-showcase * { scrollbar-width: none; }
        @keyframes jc-fade-out {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      <div
        className="jc-showcase"
        style={
          {
            ...vars,
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: 'var(--jc-fg)',
            backgroundColor: 'var(--jc-bg)',
          } as React.CSSProperties
        }
      >
        {/* Top bar */}
        <header
          style={{
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: '1px solid var(--jc-border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.02em' }}>jc</span>
            <span style={{ fontSize: '10px', opacity: 0.3, fontFamily: 'monospace' }}>
              just-components
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ViewportPicker active={viewport} onSelect={setViewport} />
            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--jc-border)' }} />
            <ThemeToggle mode={mode} theme={theme} onCycle={cycle} />
          </div>
        </header>

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Sidebar */}
          <aside
            style={{
              width: '224px',
              borderRight: '1px solid var(--jc-border)',
              flexShrink: 0,
              backgroundColor: 'var(--jc-muted)',
            }}
          >
            <ShowcaseSidebar
              components={state.filteredComponents}
              selectedName={state.selectedName}
              search={state.search}
              onSearch={state.setSearch}
              onSelect={state.selectComponent}
            />
          </aside>

          {/* Preview + Controls split */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
            {/* Preview */}
            <main
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minWidth: 0,
              }}
            >
              {state.ready && state.selectedComponent ? (
                <ShowcasePreview
                  component={state.selectedComponent}
                  propValues={state.propValues}
                  childrenText={state.childrenText}
                  childrenMode={state.childrenMode}
                  childrenFixtureKey={state.childrenFixtureKey}
                  fixtures={state.resolvedFixtures}
                  meta={meta}
                  fixtureOverrides={state.fixtureOverrides}
                  wrapperPropsMap={state.wrapperPropsMap}
                  registry={registry}
                  wrapper={wrapper}
                  viewportWidth={activeViewport.width}
                  theme={theme}
                  instanceCount={state.instanceCount}
                  onInstanceCountChange={state.setInstanceCount}
                  presetMode={state.presetMode}
                />
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.3,
                    fontSize: '13px',
                  }}
                >
                  Select a component
                </div>
              )}
            </main>

            {/* Controls panel */}
            {state.ready && state.selectedComponent && (
              <aside
                style={{
                  width: '256px',
                  borderLeft: '1px solid var(--jc-border)',
                  flexShrink: 0,
                  backgroundColor: 'var(--jc-muted)',
                }}
              >
                <ShowcaseControls
                  component={state.selectedComponent}
                  propValues={state.propValues}
                  childrenText={state.childrenText}
                  childrenMode={state.childrenMode}
                  childrenFixtureKey={state.childrenFixtureKey}
                  fixtures={state.resolvedFixtures}
                  meta={meta}
                  fixtureOverrides={state.fixtureOverrides}
                  onPropChange={state.setPropValue}
                  onChildrenChange={state.setChildrenText}
                  onChildrenModeChange={state.setChildrenMode}
                  onChildrenFixtureKeyChange={state.setChildrenFixtureKey}
                  onFixturePropChange={state.setFixturePropValue}
                  onFixtureChildrenChange={state.setFixtureChildrenText}
                  wrapperMetas={wrapperMetas}
                  wrapperPropsMap={state.wrapperPropsMap}
                  onWrapperPropChange={state.setWrapperPropValue}
                  presetMode={state.presetMode}
                  examples={state.selectedComponent.examples ?? []}
                  onPresetModeChange={state.setPresetMode}
                  onReset={state.resetProps}
                />
              </aside>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
