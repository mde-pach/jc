'use client'

import type { JcControlType } from '../types.js'

interface ShowcaseFieldProps {
  label: string
  description?: string
  controlType: JcControlType
  value: unknown
  options?: string[]
  onChange: (value: unknown) => void
}

export function ShowcaseField({
  label,
  description,
  controlType,
  value,
  options,
  onChange,
}: ShowcaseFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.7 }}>{label}</span>
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
