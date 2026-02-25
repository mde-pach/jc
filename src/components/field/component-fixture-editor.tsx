'use client'

/**
 * Expandable nested prop editor for component fixtures.
 * When a component fixture (components/*) is selected for a node slot,
 * this renders editable controls for the fixture component's own props.
 *
 * Recursive: fixture props that are themselves component fixtures get their
 * own nested ComponentFixtureEditor, allowing arbitrary depth.
 */

import { useState } from 'react'
import { resolveControlType } from '../../lib/faker-map.js'
import { getItemsForProp } from '../../lib/plugins.js'
import type { FixtureOverride } from '../../lib/use-showcase-state.js'
import type { JcMeta, JcPlugin, JcResolvedPluginItem } from '../../types.js'
import { ShowcaseField } from './showcase-field.js'
import { inputStyle } from './styles.js'

export function ComponentFixtureEditor({
  slotKey,
  qualifiedKey,
  meta,
  resolvedItems,
  plugins,
  fixtureOverrides,
  onFixturePropChange,
  onFixtureChildrenChange,
}: {
  slotKey: string
  qualifiedKey: string
  meta: JcMeta
  resolvedItems: JcResolvedPluginItem[]
  plugins: JcPlugin[]
  fixtureOverrides: Record<string, FixtureOverride>
  onFixturePropChange: (slotKey: string, propName: string, value: unknown) => void
  onFixtureChildrenChange: (slotKey: string, text: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const compName = qualifiedKey.slice('components/'.length)
  const comp = meta.components.find((c) => c.displayName === compName)
  const override = fixtureOverrides[slotKey]

  if (!comp || !override) return null

  const editableProps = Object.values(comp.props)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '4px',
        border: '1px solid var(--jc-border)',
        backgroundColor: 'color-mix(in srgb, var(--jc-bg) 50%, transparent)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            opacity: 0.5,
          }}
        >
          {compName} props
        </span>
        <span
          style={{
            fontSize: '10px',
            opacity: 0.4,
            transition: 'transform 0.15s',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          {'\u25b6'}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '0 8px 8px',
          }}
        >
          {comp.acceptsChildren && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.6 }}>children</span>
              <input
                type="text"
                value={override.childrenText}
                onChange={(e) => onFixtureChildrenChange(slotKey, e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          {editableProps.map((prop) => {
            const ct = resolveControlType(prop)
            const kindFixtures =
              ct === 'component' || ct === 'array'
                ? getItemsForProp(prop, plugins, resolvedItems)
                : undefined
            return (
              <ShowcaseField
                key={prop.name}
                label={prop.name}
                description={prop.description || undefined}
                controlType={ct}
                value={override.props[prop.name]}
                options={prop.values}
                componentKind={prop.componentKind}
                resolvedItems={kindFixtures}
                propMeta={prop}
                meta={meta}
                fixtureOverrides={fixtureOverrides}
                onFixturePropChange={onFixturePropChange}
                onFixtureChildrenChange={onFixtureChildrenChange}
                onChange={(v) => onFixturePropChange(slotKey, prop.name, v)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
