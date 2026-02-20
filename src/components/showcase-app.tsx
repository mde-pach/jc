'use client'

import type { ComponentType } from 'react'
import { useShowcaseState } from '../lib/use-showcase-state.js'
import type { JcMeta } from '../types.js'
import { ShowcaseControls } from './showcase-controls.js'
import { ShowcasePreview } from './showcase-preview.js'
import { ShowcaseSidebar } from './showcase-sidebar.js'

interface ShowcaseAppProps {
  meta: JcMeta
  registry: Record<string, () => Promise<ComponentType<any>>>
}

export function ShowcaseApp({ meta, registry }: ShowcaseAppProps) {
  const state = useShowcaseState(meta)

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'var(--jc-fg, #1f2937)',
        backgroundColor: 'var(--jc-bg, #fff)',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--jc-border, #e5e7eb)',
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
            borderRight: '1px solid var(--jc-border, #e5e7eb)',
            flexShrink: 0,
            backgroundColor: 'var(--jc-muted, #f9fafb)',
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
                borderLeft: '1px solid var(--jc-border, #e5e7eb)',
                flexShrink: 0,
                backgroundColor: 'var(--jc-muted, #f9fafb)',
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
