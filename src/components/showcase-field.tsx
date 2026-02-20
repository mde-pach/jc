'use client'

/**
 * Individual prop control field for the showcase controls panel.
 * Renders the appropriate input (text, number, boolean switch, select,
 * component picker, array editor, etc.) based on the resolved control type.
 * Component-type props use the fixture system for their picker UI.
 */

import type { JcComponentPropKind, JcControlType, JcPropMeta, JcResolvedFixture } from '../types.js'
import { getArrayItemType } from '../lib/faker-map.js'

interface ShowcaseFieldProps {
  label: string
  description?: string
  controlType: JcControlType
  value: unknown
  options?: string[]
  componentKind?: JcComponentPropKind
  fixtures?: JcResolvedFixture[]
  /** Full prop metadata — needed for array controls to infer item type */
  propMeta?: JcPropMeta
  onChange: (value: unknown) => void
}

export function ShowcaseField({
  label,
  description,
  controlType,
  value,
  options,
  componentKind,
  fixtures,
  propMeta,
  onChange,
}: ShowcaseFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.7 }}>{label}</span>
          {controlType === 'component' && (
            <span
              style={{
                fontSize: '8px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '1px 4px',
                borderRadius: '3px',
                backgroundColor: 'color-mix(in srgb, var(--jc-accent) 15%, transparent)',
                color: 'var(--jc-accent)',
              }}
            >
              {componentKind === 'icon' ? 'icon' : 'node'}
            </span>
          )}
          {controlType === 'array' && propMeta && (
            <span
              style={{
                fontSize: '8px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '1px 4px',
                borderRadius: '3px',
                backgroundColor: 'color-mix(in srgb, var(--jc-accent) 15%, transparent)',
                color: 'var(--jc-accent)',
              }}
            >
              {propMeta.type}
            </span>
          )}
        </div>
        {controlType === 'boolean' && (
          <button
            type="button"
            role="switch"
            aria-checked={!!value}
            onClick={() => onChange(!value)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              height: '20px',
              width: '36px',
              flexShrink: 0,
              cursor: 'pointer',
              alignItems: 'center',
              borderRadius: '9999px',
              border: 'none',
              transition: 'background-color 0.15s',
              backgroundColor: value ? '#3b82f6' : '#d1d5db',
            }}
          >
            <span
              style={{
                pointerEvents: 'none',
                display: 'block',
                height: '14px',
                width: '14px',
                borderRadius: '9999px',
                backgroundColor: '#fff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s',
                transform: value ? 'translateX(16px)' : 'translateX(2px)',
              }}
            />
          </button>
        )}
      </div>

      {description && (
        <p style={{ fontSize: '10px', opacity: 0.4, margin: 0 }}>{description}</p>
      )}

      {controlType === 'text' && (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      )}

      {controlType === 'number' && (
        <input
          type="number"
          value={Number(value ?? 0)}
          onChange={(e) => onChange(Number(e.target.value))}
          style={inputStyle}
        />
      )}

      {controlType === 'select' && options && (
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {controlType === 'component' && (
        <ComponentPicker
          value={String(value ?? '')}
          kind={componentKind ?? 'node'}
          fixtures={fixtures ?? []}
          onChange={(v) => onChange(v)}
        />
      )}

      {controlType === 'multiline' && (
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          style={{ ...inputStyle, minHeight: '40px', resize: 'vertical' as const }}
        />
      )}

      {controlType === 'json' && (
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value))
            } catch {
              onChange(e.target.value)
            }
          }}
          rows={3}
          style={{
            ...inputStyle,
            minHeight: '60px',
            resize: 'vertical' as const,
            fontFamily: 'monospace',
          }}
        />
      )}

      {controlType === 'array' && propMeta && (
        <ArrayEditor
          value={Array.isArray(value) ? value : []}
          propMeta={propMeta}
          fixtures={fixtures ?? []}
          onChange={onChange}
        />
      )}

      {controlType === 'readonly' && (
        <span style={{ fontSize: '11px', opacity: 0.4, fontStyle: 'italic' }}>
          Function — not editable
        </span>
      )}
    </div>
  )
}

// ── Generic array editor ─────────────────────────────────────
//
// Renders a list of items with per-item inputs inferred from the
// array's item type. Supports string, number, boolean, and
// component/icon items (via fixture picker).

function ArrayEditor({
  value,
  propMeta,
  fixtures,
  onChange,
}: {
  value: unknown[]
  propMeta: JcPropMeta
  fixtures: JcResolvedFixture[]
  onChange: (value: unknown) => void
}) {
  const itemInfo = getArrayItemType(propMeta)
  const itemType = itemInfo?.itemType ?? 'string'
  const isComponent = itemInfo?.isComponent ?? false

  const updateItem = (index: number, newVal: unknown) => {
    const next = [...value]
    next[index] = newVal
    onChange(next)
  }

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const addItem = () => {
    if (isComponent) {
      // Add first fixture key or empty string
      onChange([...value, fixtures[0]?.qualifiedKey ?? ''])
    } else if (itemType === 'number') {
      onChange([...value, 0])
    } else if (itemType === 'boolean') {
      onChange([...value, false])
    } else {
      onChange([...value, ''])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {value.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '9px',
              opacity: 0.3,
              fontFamily: 'monospace',
              width: '14px',
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            {i}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ArrayItemInput
              value={item}
              itemType={itemType}
              isComponent={isComponent}
              fixtures={fixtures}
              onChange={(v) => updateItem(i, v)}
            />
          </div>
          <button
            type="button"
            onClick={() => removeItem(i)}
            title="Remove item"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '3px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'inherit',
              opacity: 0.3,
              fontSize: '12px',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          height: '26px',
          borderRadius: '4px',
          border: '1px dashed var(--jc-border)',
          backgroundColor: 'transparent',
          color: 'inherit',
          fontSize: '10px',
          opacity: 0.5,
          cursor: 'pointer',
          transition: 'opacity 0.1s',
        }}
      >
        + Add item
      </button>
    </div>
  )
}

/** Per-item input — renders the right control based on the array's item type */
function ArrayItemInput({
  value,
  itemType,
  isComponent,
  fixtures,
  onChange,
}: {
  value: unknown
  itemType: string
  isComponent: boolean
  fixtures: JcResolvedFixture[]
  onChange: (value: unknown) => void
}) {
  // Component/icon items — use fixture picker
  if (isComponent && fixtures.length > 0) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
        {fixtures.map((f) => {
          const isActive = value === f.qualifiedKey
          return (
            <button
              key={f.qualifiedKey}
              type="button"
              title={f.label}
              onClick={() => onChange(f.qualifiedKey)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '3px',
                border: isActive ? '1.5px solid var(--jc-accent)' : '1px solid var(--jc-border)',
                backgroundColor: isActive
                  ? 'color-mix(in srgb, var(--jc-accent) 10%, transparent)'
                  : 'transparent',
                color: isActive ? 'var(--jc-accent)' : 'inherit',
                cursor: 'pointer',
                fontSize: '10px',
                opacity: isActive ? 1 : 0.4,
                transition: 'all 0.1s',
                padding: 0,
              }}
            >
              {f.renderIcon?.() ?? f.render()}
            </button>
          )
        })}
      </div>
    )
  }

  // Number items
  if (itemType === 'number') {
    return (
      <input
        type="number"
        value={Number(value ?? 0)}
        onChange={(e) => onChange(Number(e.target.value))}
        style={inputStyle}
      />
    )
  }

  // Boolean items
  if (itemType === 'boolean') {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          textAlign: 'left',
          color: value ? 'var(--jc-accent)' : 'inherit',
          opacity: value ? 1 : 0.5,
        }}
      >
        {value ? 'true' : 'false'}
      </button>
    )
  }

  // Default — string input
  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  )
}

// ── Component picker (fixture-aware) ─────────────────────────
//
// For 'icon' kind: renders a grid of clickable fixture icons.
// For 'element'/'node' kind: renders a dropdown select.
// Falls back to a plain text input when no fixtures are provided.

function ComponentPicker({
  value,
  kind,
  fixtures,
  onChange,
}: {
  value: string
  kind: 'icon' | 'element' | 'node'
  fixtures: JcResolvedFixture[]
  onChange: (key: string) => void
}) {
  // No fixtures available → text input fallback
  if (fixtures.length === 0) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="No fixtures available"
        style={inputStyle}
      />
    )
  }

  if (kind === 'icon') {
    // Grid of icon buttons using fixture renderIcon/render
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '2px',
          }}
        >
          {fixtures.map((f) => {
            const isActive = value === f.qualifiedKey
            return (
              <button
                key={f.qualifiedKey}
                type="button"
                title={f.label}
                onClick={() => onChange(f.qualifiedKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '30px',
                  borderRadius: '4px',
                  border: isActive ? '1.5px solid var(--jc-accent)' : '1px solid var(--jc-border)',
                  backgroundColor: isActive
                    ? 'color-mix(in srgb, var(--jc-accent) 10%, transparent)'
                    : 'transparent',
                  color: isActive ? 'var(--jc-accent)' : 'inherit',
                  cursor: 'pointer',
                  fontSize: '10px',
                  opacity: isActive ? 1 : 0.5,
                  transition: 'all 0.1s',
                }}
              >
                {f.renderIcon?.() ?? f.render()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Dropdown for element/node types
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    >
      <option value="">None</option>
      {fixtures.map((f) => (
        <option key={f.qualifiedKey} value={f.qualifiedKey}>
          {f.label}
        </option>
      ))}
    </select>
  )
}

// ── Fixture picker for children mode ─────────────────────────
//
// Dropdown selector used when children mode is 'fixture'.
// Lets the user pick any available fixture to render as children.

/** Dropdown fixture selector for the children control in fixture mode */
export function FixturePicker({
  value,
  fixtures,
  onChange,
}: {
  value: string | null
  fixtures: JcResolvedFixture[]
  onChange: (key: string | null) => void
}) {
  if (fixtures.length === 0) return null

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      style={inputStyle}
    >
      <option value="">Select a fixture...</option>
      {fixtures.map((f) => (
        <option key={f.qualifiedKey} value={f.qualifiedKey}>
          {f.label}
        </option>
      ))}
    </select>
  )
}

// ── Styles ────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  height: '28px',
  width: '100%',
  borderRadius: '4px',
  border: '1px solid var(--jc-border)',
  backgroundColor: 'transparent',
  padding: '0 8px',
  fontSize: '11px',
  outline: 'none',
  color: 'inherit',
}
