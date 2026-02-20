'use client'

/**
 * Individual prop control field for the showcase controls panel.
 * Renders the appropriate input (text, number, boolean switch, select,
 * component picker, etc.) based on the resolved control type.
 * Component-type props use the fixture system for their picker UI.
 */

import type { JcComponentPropKind, JcControlType, JcResolvedFixture } from '../types.js'

interface ShowcaseFieldProps {
  label: string
  description?: string
  controlType: JcControlType
  value: unknown
  options?: string[]
  componentKind?: JcComponentPropKind
  fixtures?: JcResolvedFixture[]
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

      {controlType === 'readonly' && (
        <span style={{ fontSize: '11px', opacity: 0.4, fontStyle: 'italic' }}>
          Function — not editable
        </span>
      )}
    </div>
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
