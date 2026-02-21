'use client'

/**
 * Controls panel (right sidebar) for the showcase app.
 * Renders a scrollable list of prop editors plus a children control.
 * The children control supports two modes when fixtures are available:
 *   - 'text': plain text input (default)
 *   - 'fixture': dropdown to pick a fixture as children content
 */

import { resolveControlType } from '../lib/faker-map.js'
import { getFixturesForKind } from '../lib/fixtures.js'
import type { JcComponentMeta, JcResolvedFixture } from '../types.js'
import { FixturePicker, ShowcaseField } from './showcase-field.js'

interface ShowcaseControlsProps {
  component: JcComponentMeta
  propValues: Record<string, unknown>
  childrenText: string
  childrenMode: 'text' | 'fixture'
  childrenFixtureKey: string | null
  fixtures: JcResolvedFixture[]
  onPropChange: (propName: string, value: unknown) => void
  onChildrenChange: (text: string) => void
  onChildrenModeChange: (mode: 'text' | 'fixture') => void
  onChildrenFixtureKeyChange: (key: string | null) => void
  onReset: () => void
}

export function ShowcaseControls({
  component,
  propValues,
  childrenText,
  childrenMode,
  childrenFixtureKey,
  fixtures,
  onPropChange,
  onChildrenChange,
  onChildrenModeChange,
  onChildrenFixtureKeyChange,
  onReset,
}: ShowcaseControlsProps) {
  const propEntries = Object.values(component.props)
  const hasFixtures = fixtures.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: '42px',
          flexShrink: 0,
          borderBottom: '1px solid var(--jc-border)',
        }}
      >
        <h3
          style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            opacity: 0.6,
            margin: 0,
          }}
        >
          Controls
        </h3>
        <button
          type="button"
          onClick={onReset}
          style={{
            fontSize: '10px',
            fontWeight: 500,
            color: 'var(--jc-accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {component.acceptsChildren && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.7 }}>children</span>
              {hasFixtures && (
                <div style={{ display: 'flex', gap: '2px' }}>
                  <ModeButton
                    label="Text"
                    active={childrenMode === 'text'}
                    onClick={() => onChildrenModeChange('text')}
                  />
                  <ModeButton
                    label="Fixture"
                    active={childrenMode === 'fixture'}
                    onClick={() => onChildrenModeChange('fixture')}
                  />
                </div>
              )}
            </div>
            <p style={{ fontSize: '10px', opacity: 0.4, margin: 0 }}>
              {childrenMode === 'text'
                ? 'Text or content rendered inside the component'
                : 'Pick a fixture as children'}
            </p>
            {childrenMode === 'text' ? (
              <input
                type="text"
                value={childrenText}
                onChange={(e) => onChildrenChange(e.target.value)}
                style={{
                  height: '28px',
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '4px',
                  border: '1px solid var(--jc-border)',
                  backgroundColor: 'transparent',
                  padding: '0 8px',
                  fontSize: '11px',
                  outline: 'none',
                  color: 'inherit',
                }}
              />
            ) : (
              <FixturePicker
                value={childrenFixtureKey}
                fixtures={fixtures}
                onChange={onChildrenFixtureKeyChange}
              />
            )}
          </div>
        )}

        {propEntries.length > 0
          ? propEntries.map((prop) => {
              const controlType = resolveControlType(prop)
              const kindFixtures =
                controlType === 'component'
                  ? getFixturesForKind(fixtures, prop.componentKind)
                  : controlType === 'array'
                    ? fixtures
                    : undefined
              return (
                <ShowcaseField
                  key={prop.name}
                  label={prop.name}
                  description={prop.description || undefined}
                  controlType={controlType}
                  value={propValues[prop.name]}
                  options={prop.values}
                  componentKind={prop.componentKind}
                  fixtures={kindFixtures}
                  propMeta={prop}
                  onChange={(v) => onPropChange(prop.name, v)}
                />
              )
            })
          : !component.acceptsChildren && (
              <p
                style={{
                  fontSize: '11px',
                  opacity: 0.4,
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '16px 0',
                }}
              >
                No editable props
              </p>
            )}
      </div>
    </div>
  )
}

/** Small toggle button used to switch between children text/fixture modes */
function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: '9px',
        fontWeight: 500,
        padding: '2px 6px',
        borderRadius: '3px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: active
          ? 'color-mix(in srgb, var(--jc-accent) 15%, transparent)'
          : 'transparent',
        color: active ? 'var(--jc-accent)' : 'inherit',
        opacity: active ? 1 : 0.5,
        transition: 'all 0.1s',
      }}
    >
      {label}
    </button>
  )
}
