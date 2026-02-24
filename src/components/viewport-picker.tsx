'use client'

export const VIEWPORTS = [
  { key: 'responsive', label: 'Full', width: undefined },
  { key: 'mobile', label: '375', width: 375 },
  { key: 'tablet', label: '768', width: 768 },
  { key: 'desktop', label: '1280', width: 1280 },
] as const

export type ViewportKey = (typeof VIEWPORTS)[number]['key']

/** Segmented picker for responsive viewport presets */
export function ViewportPicker({
  active,
  onSelect,
}: {
  active: ViewportKey
  onSelect: (key: ViewportKey) => void
}) {
  return (
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
      {VIEWPORTS.map((vp) => (
        <button
          key={vp.key}
          type="button"
          title={vp.width ? `${vp.width}px` : 'Responsive'}
          onClick={() => onSelect(vp.key)}
          style={{
            fontSize: '9px',
            fontFamily: 'monospace',
            padding: '2px 6px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: active === vp.key ? 'var(--jc-accent)' : 'transparent',
            color: active === vp.key ? 'var(--jc-accent-fg)' : 'inherit',
            opacity: active === vp.key ? 1 : 0.4,
            transition: 'all 0.1s',
          }}
        >
          {vp.label}
        </button>
      ))}
    </div>
  )
}
