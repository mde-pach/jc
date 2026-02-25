'use client'

/**
 * Compact grid picker with popup and search.
 * Shows a single item button. Clicking opens a popup with search bar and item grid.
 * Generic primitive for plugin authors — works for icons, avatars, badges, etc.
 */

import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { JcResolvedPluginItem } from '../../types.js'

/** Catches render errors from individual items to prevent the entire picker from crashing. */
class ItemErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Silently swallow — item simply won't render
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export function GridPicker({
  value,
  items,
  required,
  onChange,
}: {
  value: string
  items: JcResolvedPluginItem[]
  required: boolean
  onChange: (key: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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

  // Focus search when opening
  useEffect(() => {
    if (open) {
      // Small delay to let the popup render
      requestAnimationFrame(() => searchRef.current?.focus())
    } else {
      setSearch('')
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.key.includes(q) ||
        f.keywords?.some((kw) => kw.toLowerCase().includes(q)),
    )
  }, [items, search])

  const selected = items.find((f) => f.qualifiedKey === value)
  const hasSelection = selected != null

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger button — single item preview */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={hasSelection ? selected.label : 'Select an item'}
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
          <ItemErrorBoundary>{selected.renderPreview?.() ?? selected.render()}</ItemErrorBoundary>
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

      {/* Popup with search + grid */}
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
            width: '200px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search bar */}
          <div style={{ padding: '6px 6px 0' }}>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                width: '100%',
                fontSize: '11px',
                padding: '4px 6px',
                borderRadius: '4px',
                border: '1px solid var(--jc-border)',
                backgroundColor: 'transparent',
                color: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Grid */}
          <div
            style={{
              padding: '6px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '2px',
              }}
            >
              {!required && !search && (
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
              {filtered.map((f) => {
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
                    <ItemErrorBoundary>{f.renderPreview?.() ?? f.render()}</ItemErrorBoundary>
                  </button>
                )
              })}
            </div>
            {search && filtered.length === 0 && (
              <p
                style={{
                  fontSize: '10px',
                  opacity: 0.4,
                  textAlign: 'center',
                  margin: '8px 0',
                }}
              >
                No results
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
