import type { ReactNode } from 'react'

/** A section heading with an optional subtitle and trailing element. */
export interface SectionHeaderProps {
  /** The section title */
  title: string
  /** Optional subtitle displayed below the title */
  subtitle?: string
  /** Optional trailing element (e.g. a Badge) */
  badge?: ReactNode
  /** Text alignment */
  align?: 'left' | 'center'
}

export function SectionHeader({
  title,
  subtitle,
  badge,
  align = 'center',
}: SectionHeaderProps) {
  return (
    <div style={{ textAlign: align, marginBottom: '40px' }}>
      {badge && <div style={{ marginBottom: '12px' }}>{badge}</div>}
      <h2
        style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: '#0f172a',
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            margin: '8px 0 0',
            fontSize: '16px',
            color: '#64748b',
            lineHeight: 1.6,
            maxWidth: align === 'center' ? '540px' : undefined,
            marginLeft: align === 'center' ? 'auto' : undefined,
            marginRight: align === 'center' ? 'auto' : undefined,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
