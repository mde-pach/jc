'use client'

import { resolveControlType } from '../lib/faker-map.js'
import type { JcComponentMeta } from '../types.js'
import { ShowcaseField } from './showcase-field.js'

interface ShowcaseControlsProps {
  component: JcComponentMeta
  propValues: Record<string, unknown>
  childrenText: string
  onPropChange: (propName: string, value: unknown) => void
  onChildrenChange: (text: string) => void
  onReset: () => void
}

export function ShowcaseControls({
  component,
  propValues,
  childrenText,
  onPropChange,
  onChildrenChange,
  onReset,
}: ShowcaseControlsProps) {
  const propEntries = Object.values(component.props)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--jc-border, #e5e7eb)',
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
            color: '#3b82f6',
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
          <ShowcaseField
            label="children"
            description="Text or content rendered inside the component"
            controlType="text"
            value={childrenText}
            onChange={(v) => onChildrenChange(String(v))}
          />
        )}

        {propEntries.length > 0
          ? propEntries.map((prop) => {
              const controlType = resolveControlType(prop)
              return (
                <ShowcaseField
                  key={prop.name}
                  label={prop.name}
                  description={prop.description || undefined}
                  controlType={controlType}
                  value={propValues[prop.name]}
                  options={prop.values}
                  onChange={(v) => onPropChange(prop.name, v)}
                />
              )
            })
          : !component.acceptsChildren && (
              <p style={{ fontSize: '11px', opacity: 0.4, fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                No editable props
              </p>
            )}
      </div>
    </div>
  )
}
