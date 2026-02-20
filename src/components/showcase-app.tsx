'use client'

import type { ComponentType } from 'react'
import { useShowcaseState } from '../lib/use-showcase-state.js'
import { useThemeDetection } from '../lib/use-theme.js'
import type { JcMeta } from '../types.js'
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
  meta: JcMeta
  registry: Record<string, () => Promise<ComponentType<any>>>
}

export function ShowcaseApp({ meta, registry }: ShowcaseAppProps) {
  const state = useShowcaseState(meta)
  const theme = useThemeDetection()
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
        <span style={{ fontSize: '10px', opacity: 0.3 }}>
          {meta.components.length} components
        </span>
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
                onPropChange={state.setPropValue}
                onChildrenChange={state.setChildrenText}
                onReset={state.resetProps}
              />
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
