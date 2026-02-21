'use client'

import { type ComponentType, type ReactNode, useState } from 'react'
import { useShowcaseState } from '../lib/use-showcase-state.js'
import { type JcThemeMode, useTheme } from '../lib/use-theme.js'
import type { JcFixturePlugin, JcMeta } from '../types.js'
import { ShowcaseControls } from './showcase-controls.js'
import { ShowcasePreview } from './showcase-preview.js'
import { ShowcaseSidebar } from './showcase-sidebar.js'

const THEME = {
  light: {
    '--jc-bg': '#ffffff',
    '--jc-fg': '#1f2937',
    '--jc-muted': '#f9fafb',
    '--jc-border': '#e5e7eb',
    '--jc-accent': '#3b82f6',
    '--jc-accent-fg': '#ffffff',
    '--jc-checker': '#f3f4f6',
    '--jc-code-bg': '#f8fafc',
    '--jc-code-border': '#e2e8f0',
    '--jc-code-header': '#64748b',
  },
  dark: {
    '--jc-bg': '#111827',
    '--jc-fg': '#f3f4f6',
    '--jc-muted': '#1f2937',
    '--jc-border': '#374151',
    '--jc-accent': '#60a5fa',
    '--jc-accent-fg': '#111827',
    '--jc-checker': '#1f2937',
    '--jc-code-bg': '#0f172a',
    '--jc-code-border': '#1e293b',
    '--jc-code-header': '#94a3b8',
  },
} as const

interface ShowcaseAppProps {
  /** Component metadata extracted by the jc CLI */
  meta: JcMeta
  /** Lazy component loaders keyed by display name */
  registry: Record<string, () => Promise<ComponentType<any>>>
  /**
   * Optional fixture plugins providing real components (icons, badges, etc.)
   * for the showcase to use in prop values and children.
   * Without fixtures, component-type props fall back to a text input.
   */
  fixtures?: JcFixturePlugin[]
  /**
   * Optional wrapper component applied around each previewed component.
   * Use this to inject context providers (theme, router, i18n, etc.)
   * that your components need to render correctly.
   *
   * @example
   * wrapper={({ children }) => <ThemeProvider>{children}</ThemeProvider>}
   */
  wrapper?: ComponentType<{ children: ReactNode }>
}

/**
 * Root showcase component. Renders a full-viewport app with:
 * - Left sidebar: component list with search
 * - Center: live component preview with code snippet
 * - Right sidebar: interactive prop controls
 *
 * Accepts optional `fixtures` to provide real components from the host app.
 */
const VIEWPORTS = [
  { key: 'responsive', label: 'Full', width: undefined },
  { key: 'mobile', label: '375', width: 375 },
  { key: 'tablet', label: '768', width: 768 },
  { key: 'desktop', label: '1280', width: 1280 },
] as const

type ViewportKey = (typeof VIEWPORTS)[number]['key']

export function ShowcaseApp({ meta, registry, fixtures, wrapper }: ShowcaseAppProps) {
  const state = useShowcaseState(meta, fixtures)
  const { theme, mode, cycle } = useTheme()
  const vars = THEME[theme]
  const [viewport, setViewport] = useState<ViewportKey>('responsive')
  const activeViewport = VIEWPORTS.find((v) => v.key === viewport)!

  return (
    <>
      <style>{`
        .jc-showcase *::-webkit-scrollbar { display: none; }
        .jc-showcase * { scrollbar-width: none; }
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
                  registry={registry}
                  wrapper={wrapper}
                  viewportWidth={activeViewport.width}
                  theme={theme}
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
                  onPropChange={state.setPropValue}
                  onChildrenChange={state.setChildrenText}
                  onChildrenModeChange={state.setChildrenMode}
                  onChildrenFixtureKeyChange={state.setChildrenFixtureKey}
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

// ── Theme toggle ──────────────────────────────────────────────

function ThemeToggle({
  mode,
  theme,
  onCycle,
}: {
  mode: JcThemeMode
  theme: 'light' | 'dark'
  onCycle: () => void
}) {
  const title = mode === 'auto' ? `Auto (${theme})` : mode === 'light' ? 'Light' : 'Dark'

  return (
    <button
      type="button"
      onClick={onCycle}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        opacity: mode === 'auto' ? 0.25 : 0.5,
        transition: 'opacity 0.15s',
      }}
    >
      {mode === 'auto' ? (
        // Auto: half-and-half circle (left sun, right moon)
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          {/* Fill the right half to indicate moon/dark */}
          <path d="M12 7 A5 5 0 0 1 12 17 Z" fill="currentColor" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : theme === 'light' ? (
        // Sun
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // Moon
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

// ── Viewport picker ──────────────────────────────────────────

function ViewportPicker({
  active,
  onSelect,
}: {
  active: ViewportKey
  onSelect: (key: ViewportKey) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        borderRadius: '6px',
        border: '1px solid var(--jc-border)',
        padding: '2px',
      }}
    >
      {VIEWPORTS.map((vp) => (
        <button
          key={vp.key}
          type="button"
          title={vp.width ? `${vp.width}px` : 'Responsive'}
          onClick={() => onSelect(vp.key)}
          style={{
            fontSize: '9px',
            fontFamily: 'monospace',
            padding: '2px 6px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: active === vp.key ? 'var(--jc-accent)' : 'transparent',
            color: active === vp.key ? 'var(--jc-accent-fg)' : 'inherit',
            opacity: active === vp.key ? 1 : 0.4,
            transition: 'all 0.1s',
          }}
        >
          {vp.label}
        </button>
      ))}
    </div>
  )
}
