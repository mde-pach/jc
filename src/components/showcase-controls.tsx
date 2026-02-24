'use client'

/**
 * Controls panel (right sidebar) for the showcase app.
 * Renders a scrollable list of prop editors plus a children control.
 * The children control supports two modes when fixtures are available:
 *   - 'text': plain text input (default)
 *   - 'fixture': dropdown to pick a fixture as children content
 *
 * When wrappers exist, a tab bar replaces the header to switch between
 * the component's controls and each wrapper's controls.
 */

import { useState } from 'react'
import { resolveControlType } from '../lib/faker-map.js'
import { getFixturesForKind } from '../lib/fixtures.js'
import type { FixtureOverride } from '../lib/use-showcase-state.js'
import type { JcComponentMeta, JcExamplePreset, JcMeta, JcResolvedFixture } from '../types.js'
import { ComponentFixtureEditor, FixturePicker, ShowcaseField } from './field/index.js'

interface ShowcaseControlsProps {
  component: JcComponentMeta
  propValues: Record<string, unknown>
  childrenText: string
  childrenMode: 'text' | 'fixture'
  childrenFixtureKey: string | null
  fixtures: JcResolvedFixture[]
  meta: JcMeta
  fixtureOverrides: Record<string, FixtureOverride>
  onPropChange: (propName: string, value: unknown) => void
  onChildrenChange: (text: string) => void
  onChildrenModeChange: (mode: 'text' | 'fixture') => void
  onChildrenFixtureKeyChange: (key: string | null) => void
  onFixturePropChange: (slotKey: string, propName: string, value: unknown) => void
  onFixtureChildrenChange: (slotKey: string, text: string) => void
  wrapperMetas: JcComponentMeta[]
  wrapperPropsMap: Record<string, Record<string, unknown>>
  onWrapperPropChange: (wrapperName: string, propName: string, value: unknown) => void
  presetMode: 'generated' | number
  examples: JcExamplePreset[]
  onPresetModeChange: (mode: 'generated' | number) => void
  onReset: () => void
}

export function ShowcaseControls({
  component,
  propValues,
  childrenText,
  childrenMode,
  childrenFixtureKey,
  fixtures,
  meta,
  fixtureOverrides,
  onPropChange,
  onChildrenChange,
  onChildrenModeChange,
  onChildrenFixtureKeyChange,
  onFixturePropChange,
  onFixtureChildrenChange,
  wrapperMetas,
  wrapperPropsMap,
  onWrapperPropChange,
  presetMode,
  examples,
  onPresetModeChange,
  onReset,
}: ShowcaseControlsProps) {
  const propEntries = Object.values(component.props)
  const hasFixtures = fixtures.length > 0
  const hasWrappers = wrapperMetas.length > 0

  // Active tab: component name or a wrapper name
  const [activeTab, setActiveTab] = useState(component.displayName)

  // Reset active tab when component changes
  const [prevComponent, setPrevComponent] = useState(component.displayName)
  if (prevComponent !== component.displayName) {
    setPrevComponent(component.displayName)
    setActiveTab(component.displayName)
  }

  const isComponentTab = activeTab === component.displayName
  const activeWrapperMeta = !isComponentTab
    ? wrapperMetas.find((w) => w.displayName === activeTab)
    : undefined

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
        {hasWrappers ? (
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
            <TabButton
              label={component.displayName}
              active={isComponentTab}
              onClick={() => setActiveTab(component.displayName)}
            />
            {wrapperMetas.map((w) => (
              <TabButton
                key={w.displayName}
                label={w.displayName}
                active={activeTab === w.displayName}
                onClick={() => setActiveTab(w.displayName)}
              />
            ))}
          </div>
        ) : (
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
        )}
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

      {/* Preset toggle — only shown when examples exist */}
      {examples.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '6px 16px',
            borderBottom: '1px solid var(--jc-border)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              borderRadius: '6px',
              border: '1px solid var(--jc-border)',
              padding: '2px',
              flexWrap: 'wrap',
            }}
          >
            <TabButton
              label="Generated"
              active={presetMode === 'generated'}
              onClick={() => onPresetModeChange('generated')}
            />
            {examples.map((ex) => (
              <TabButton
                key={ex.index}
                label={`Ex ${ex.index + 1}`}
                active={presetMode === ex.index}
                onClick={() => onPresetModeChange(ex.index)}
              />
            ))}
          </div>
        </div>
      )}

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
        {isComponentTab ? (
          <>
            {component.acceptsChildren && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
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
                  <>
                    <FixturePicker
                      value={childrenFixtureKey}
                      fixtures={fixtures}
                      onChange={onChildrenFixtureKeyChange}
                    />
                    {childrenFixtureKey?.startsWith('components/') && (
                      <ComponentFixtureEditor
                        slotKey="children"
                        qualifiedKey={childrenFixtureKey}
                        meta={meta}
                        fixtures={fixtures}
                        fixtureOverrides={fixtureOverrides}
                        onFixturePropChange={onFixturePropChange}
                        onFixtureChildrenChange={onFixtureChildrenChange}
                      />
                    )}
                  </>
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
                      meta={meta}
                      fixtureOverrides={fixtureOverrides}
                      onFixturePropChange={onFixturePropChange}
                      onFixtureChildrenChange={onFixtureChildrenChange}
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
          </>
        ) : activeWrapperMeta ? (
          Object.values(activeWrapperMeta.props).length > 0 ? (
            Object.values(activeWrapperMeta.props).map((prop) => {
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
                  value={wrapperPropsMap[activeTab]?.[prop.name]}
                  options={prop.values}
                  componentKind={prop.componentKind}
                  fixtures={kindFixtures}
                  propMeta={prop}
                  meta={meta}
                  fixtureOverrides={fixtureOverrides}
                  onFixturePropChange={onFixturePropChange}
                  onFixtureChildrenChange={onFixtureChildrenChange}
                  onChange={(v) => onWrapperPropChange(activeTab, prop.name, v)}
                />
              )
            })
          ) : (
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
          )
        ) : null}
      </div>
    </div>
  )
}

/** Tab button for switching between component and wrapper controls */
function TabButton({
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
        fontFamily: 'monospace',
        fontWeight: 500,
        padding: '2px 6px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: active ? 'var(--jc-accent)' : 'transparent',
        color: active ? 'var(--jc-accent-fg)' : 'inherit',
        opacity: active ? 1 : 0.4,
        transition: 'all 0.1s',
      }}
    >
      {label}
    </button>
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
