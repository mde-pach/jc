'use client'

import type { ComponentType } from 'react'
import { useShowcaseState } from '../lib/use-showcase-state.js'
import { useTheme, type JcThemeMode } from '../lib/use-theme.js'
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
  },
  dark: {
    '--jc-bg': '#111827',
    '--jc-fg': '#f3f4f6',
    '--jc-muted': '#1f2937',
    '--jc-border': '#374151',
    '--jc-accent': '#60a5fa',
    '--jc-accent-fg': '#111827',
    '--jc-checker': '#1f2937',
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
}

/**
 * Root showcase component. Renders a full-viewport app with:
 * - Left sidebar: component list with search
 * - Center: live component preview with code snippet
 * - Right sidebar: interactive prop controls
 *
 * Accepts optional `fixtures` to provide real components from the host app.
 */
export function ShowcaseApp({ meta, registry, fixtures }: ShowcaseAppProps) {
  const state = useShowcaseState(meta, fixtures)
  const { theme, mode, cycle } = useTheme()
  const vars = THEME[theme]

  return (
    <div
      style={{
        ...vars,
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'var(--jc-fg)',
        backgroundColor: 'var(--jc-bg)',
      } as React.CSSProperties}
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
          <ThemeToggle mode={mode} theme={theme} onCycle={cycle} />
          <span style={{ fontSize: '10px', opacity: 0.3 }}>
            {meta.components.length} components
          </span>
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
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Preview */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {state.selectedComponent ? (
              <ShowcasePreview
                component={state.selectedComponent}
                propValues={state.propValues}
                childrenText={state.childrenText}
                childrenMode={state.childrenMode}
                childrenFixtureKey={state.childrenFixtureKey}
                fixtures={state.resolvedFixtures}
                registry={registry}
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
          {state.selectedComponent && (
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
  const title =
    mode === 'auto' ? `Auto (${theme})` :
    mode === 'light' ? 'Light' : 'Dark'

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
        // Auto: half sun / half moon
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
      ) : theme === 'light' ? (
        // Sun
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
