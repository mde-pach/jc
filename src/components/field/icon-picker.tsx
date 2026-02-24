'use client'

/**
 * Compact icon picker with popup grid.
 * Shows a single icon button. Clicking opens a popup with the full icon grid.
 * Used by ComponentPicker, ArrayItemInput, and FixturePicker.
 */

import { useEffect, useRef, useState } from 'react'
import type { JcResolvedFixture } from '../../types.js'

export function IconPickerButton({
  value,
  fixtures,
  required,
  onChange,
}: {
  value: string
  fixtures: JcResolvedFixture[]
  required: boolean
  onChange: (key: string) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const selected = fixtures.find((f) => f.qualifiedKey === value)
  const hasSelection = selected != null

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger button — single icon */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={hasSelection ? selected.label : 'Select an icon'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '30px',
          height: '30px',
          borderRadius: '4px',
          border: hasSelection ? '1.5px solid var(--jc-accent)' : '1px solid var(--jc-border)',
          backgroundColor: hasSelection
            ? 'color-mix(in srgb, var(--jc-accent) 10%, transparent)'
            : 'transparent',
          color: hasSelection ? 'var(--jc-accent)' : 'inherit',
          cursor: 'pointer',
          opacity: hasSelection ? 1 : 0.35,
          transition: 'all 0.1s',
          padding: 0,
        }}
      >
        {hasSelection ? (
          (selected.renderIcon?.() ?? selected.render())
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        )}
      </button>

      {/* Popup grid */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '34px',
            left: 0,
            zIndex: 50,
            backgroundColor: 'var(--jc-bg)',
            border: '1px solid var(--jc-border)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '6px',
            maxHeight: '200px',
            overflowY: 'auto',
            width: 'max-content',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '2px',
            }}
          >
            {!required && (
              <button
                type="button"
                title="None"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: '4px',
                  border: !hasSelection
                    ? '1.5px solid var(--jc-accent)'
                    : '1px solid var(--jc-border)',
                  backgroundColor: !hasSelection
                    ? 'color-mix(in srgb, var(--jc-accent) 10%, transparent)'
                    : 'transparent',
                  color: !hasSelection ? 'var(--jc-accent)' : 'inherit',
                  cursor: 'pointer',
                  opacity: !hasSelection ? 1 : 0.35,
                  transition: 'all 0.1s',
                  padding: 0,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            {fixtures.map((f) => {
              const isActive = value === f.qualifiedKey
              return (
                <button
                  key={f.qualifiedKey}
                  type="button"
                  title={f.label}
                  onClick={() => {
                    onChange(f.qualifiedKey)
                    setOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '4px',
                    border: isActive
                      ? '1.5px solid var(--jc-accent)'
                      : '1px solid var(--jc-border)',
                    backgroundColor: isActive
                      ? 'color-mix(in srgb, var(--jc-accent) 10%, transparent)'
                      : 'transparent',
                    color: isActive ? 'var(--jc-accent)' : 'inherit',
                    cursor: 'pointer',
                    opacity: isActive ? 1 : 0.5,
                    transition: 'all 0.1s',
                    padding: 0,
                  }}
                >
                  {f.renderIcon?.() ?? f.render()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
