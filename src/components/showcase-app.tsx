'use client'

import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { buildComponentFixturesPlugin, resolveComponentFixtureItems } from '../lib/fixtures.js'
import { loadMeta } from '../lib/load-meta.js'
import { normalizePlugin, resolvePluginItems } from '../lib/plugins.js'
import {
  ShowcaseProvider,
  type ShowcaseContextValue,
  useShowcaseContext,
} from '../lib/showcase-context.js'
import { THEME } from '../lib/theme-vars.js'
import { getViewportFromUrl, setViewportInUrl } from '../lib/url-sync.js'
import { useShowcaseState } from '../lib/use-showcase-state.js'
import { useTheme } from '../lib/use-theme.js'
import type { JcComponentMeta, JcMeta, JcPlugin } from '../types.js'
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
  /** Component metadata extracted by the jc CLI — accepts raw JSON import (no cast needed) */
  meta: JcMeta | unknown
  /** Lazy component loaders keyed by display name */
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>
  /**
   * Plugins providing real components (icons, badges, etc.)
   * for the showcase to use in prop values and children.
   * Each plugin declares what prop types it handles via `match`.
   */
  plugins?: Array<JcPlugin | (() => JcPlugin)>
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
  meta: rawMeta,
  registry,
  plugins: rawPlugins,
  wrapper,
  initialComponent,
  syncUrl = true,
  children,
}: ShowcaseAppProps) {
  const meta = useMemo(() => loadMeta(rawMeta) as JcMeta, [rawMeta])
  // Normalize plugin factories → JcPlugin[], then build auto-generated component fixtures plugin
  const userPlugins = useMemo(
    () => (rawPlugins ?? []).map(normalizePlugin),
    [rawPlugins],
  )
  const baseItems = useMemo(() => resolvePluginItems(userPlugins), [userPlugins])
  const componentFixturesPlugin = useMemo(
    () => buildComponentFixturesPlugin(meta, registry, userPlugins, baseItems),
    [meta, registry, userPlugins, baseItems],
  )
  const allPlugins = useMemo(
    () => [...userPlugins, componentFixturesPlugin],
    [userPlugins, componentFixturesPlugin],
  )
  // Resolve component fixture items separately (they need render functions with registry access)
  const componentFixtureItems = useMemo(
    () => resolveComponentFixtureItems(meta, registry, userPlugins, baseItems),
    [meta, registry, userPlugins, baseItems],
  )
  // Merge base plugin items + component fixture items into the plugins' resolved items
  const allResolvedItems = useMemo(
    () => [...baseItems, ...componentFixtureItems],
    [baseItems, componentFixtureItems],
  )
  // Pass allPlugins to useShowcaseState — it will resolvePluginItems internally,
  // but the component fixture items have custom render functions that need the
  // merged list. So we override by passing allPlugins + pre-resolved items.
  const state = useShowcaseState(meta, allPlugins, { syncUrl, initialComponent })
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

  // Build context value for the provider
  const ctxValue = useMemo<ShowcaseContextValue>(
    () => ({
      state,
      meta,
      resolvedItems: allResolvedItems,
      plugins: allPlugins,
      wrapperMetas,
      registry,
      wrapper,
    }),
    [state, meta, allResolvedItems, allPlugins, wrapperMetas, registry, wrapper],
  )

  // Custom layout via render prop — still wrapped in provider for context access
  if (children) {
    return (
      <ShowcaseProvider value={ctxValue}>
        <div
          className="jc-showcase"
          style={{ ...vars, color: 'var(--jc-fg)' } as React.CSSProperties}
        >
          {children({ state, wrapperMetas, theme, vars })}
        </div>
      </ShowcaseProvider>
    )
  }

  // Default full-app layout
  return (
    <ShowcaseProvider value={ctxValue}>
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

        {/* Main area — reads from context, no prop drilling */}
        <ResizableLayout activeViewport={activeViewport} theme={theme} />
      </div>
    </ShowcaseProvider>
  )
}

// ── Resize handle ──────────────────────────────────────────

const SIDEBAR_MIN = 224
const CONTROLS_MIN = 256

function ResizeHandle({
  side,
  onDrag,
}: {
  side: 'left' | 'right'
  onDrag: (delta: number) => void
}) {
  const dragging = useRef(false)
  const lastX = useRef(0)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      dragging.current = true
      lastX.current = e.clientX
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      const delta = e.clientX - lastX.current
      lastX.current = e.clientX
      onDrag(delta)
    },
    [onDrag],
  )

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        width: '5px',
        cursor: 'col-resize',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2,
        ...(side === 'left'
          ? { borderRight: '1px solid var(--jc-border)', marginRight: '-1px' }
          : { borderLeft: '1px solid var(--jc-border)', marginLeft: '-1px' }),
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-2px -3px',
        }}
      />
    </div>
  )
}

// ── Resizable three-column layout ──────────────────────────
//
// Reads all data from ShowcaseContext — no prop drilling from ShowcaseApp.

function ResizableLayout({
  activeViewport,
  theme,
}: {
  activeViewport: (typeof VIEWPORTS)[number]
  theme: 'light' | 'dark'
}) {
  // Read everything from context instead of props
  const { state, meta, resolvedItems, plugins, wrapperMetas, registry, wrapper } = useShowcaseContext()

  const [sidebarW, setSidebarW] = useState(SIDEBAR_MIN)
  const [controlsW, setControlsW] = useState(CONTROLS_MIN)

  const handleSidebarDrag = useCallback((delta: number) => {
    setSidebarW((w) => Math.max(SIDEBAR_MIN, w + delta))
  }, [])

  const handleControlsDrag = useCallback((delta: number) => {
    setControlsW((w) => Math.max(CONTROLS_MIN, w - delta))
  }, [])

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: `${sidebarW}px`,
          flexShrink: 0,
          backgroundColor: 'var(--jc-muted)',
          overflow: 'hidden',
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

      <ResizeHandle side="left" onDrag={handleSidebarDrag} />

      {/* Preview + Controls */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
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
              childrenItems={state.childrenItems}
              resolvedItems={resolvedItems}
              plugins={plugins}
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
          <>
            <ResizeHandle side="right" onDrag={handleControlsDrag} />
            <aside
              style={{
                width: `${controlsW}px`,
                flexShrink: 0,
                backgroundColor: 'var(--jc-muted)',
                overflow: 'hidden',
              }}
            >
              <ShowcaseControls
                component={state.selectedComponent}
                propValues={state.propValues}
                childrenItems={state.childrenItems}
                resolvedItems={resolvedItems}
                plugins={plugins}
                meta={meta}
                fixtureOverrides={state.fixtureOverrides}
                onPropChange={state.setPropValue}
                onAddChildItem={state.addChildItem}
                onRemoveChildItem={state.removeChildItem}
                onUpdateChildItem={state.updateChildItem}
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
          </>
        )}
      </div>
    </div>
  )
}

