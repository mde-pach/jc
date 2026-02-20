'use client'

import type { JcComponentPropKind, JcControlType } from '../types.js'
import { COMPONENT_PLACEHOLDERS } from '../lib/faker-map.js'

interface ShowcaseFieldProps {
  label: string
  description?: string
  controlType: JcControlType
  value: unknown
  options?: string[]
  componentKind?: JcComponentPropKind
  onChange: (value: unknown) => void
}

export function ShowcaseField({
  label,
  description,
  controlType,
  value,
  options,
  componentKind,
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
          value={String(value ?? 'none')}
          kind={componentKind ?? 'node'}
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

// ── Component picker ──────────────────────────────────────────

function ComponentPicker({
  value,
  kind,
  onChange,
}: {
  value: string
  kind: 'icon' | 'element' | 'node'
  onChange: (key: string) => void
}) {
  const placeholders = COMPONENT_PLACEHOLDERS[kind] ?? COMPONENT_PLACEHOLDERS.node

  if (kind === 'icon') {
    // Grid of icon buttons
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '2px',
          }}
        >
          {placeholders.map((p) => {
            const isActive = value === p.key
            return (
              <button
                key={p.key}
                type="button"
                title={p.label}
                onClick={() => onChange(p.key)}
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
                <IconPreview name={p.key.replace('icon:', '')} size={14} />
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
      {placeholders.map((p) => (
        <option key={p.key} value={p.key}>
          {p.label}
        </option>
      ))}
    </select>
  )
}

// ── Mini inline icon previews for the picker ──────────────────

const ICON_PATHS: Record<string, string> = {
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  zap: 'M13 2L3 14h9l-1 10 10-12h-9l1-10z',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  search: 'M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5zM21 21l-4.35-4.35',
  settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
  user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  plus: 'M12 5v14M5 12h14',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
}

function IconPreview({ name, size = 14 }: { name: string; size?: number }) {
  const d = ICON_PATHS[name]
  if (!d) return <span style={{ fontSize: '9px' }}>{name}</span>

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
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
