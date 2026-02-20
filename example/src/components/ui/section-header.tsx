import type { ReactNode } from 'react'

/** A section heading with optional badge, title, and subtitle — used for page sections. */
export interface SectionHeaderProps {
  /** Section title */
  title: string
  /** Optional subtitle text displayed below the title */
  subtitle?: string
  /** Optional badge content displayed above the title */
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
    <div style={{ textAlign: align, marginBottom: '56px' }}>
      {badge && <div style={{ marginBottom: '12px' }}>{badge}</div>}
      <h2
        style={{
          fontSize: '36px',
          fontWeight: 800,
          margin: 0,
          letterSpacing: '-0.03em',
          color: '#0f172a',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: '16px',
            color: '#64748b',
            margin: '8px auto 0',
            maxWidth: '480px',
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
