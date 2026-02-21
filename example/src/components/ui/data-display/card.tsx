import type { ReactNode } from 'react'

/** A container card with optional header and footer. */
export interface CardProps {
  /** Card body content */
  children: ReactNode
  /** Card title displayed in the header */
  title?: string
  /** Optional description below the title */
  description?: string
  /** Whether to add a shadow */
  elevated?: boolean
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  title,
  description,
  elevated = false,
  padding = 'md',
}: CardProps) {
  const paddings: Record<string, string> = {
    none: '0',
    sm: '12px',
    md: '20px',
    lg: '32px',
  }

  return (
    <div
      style={{
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        boxShadow: elevated ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
        overflow: 'hidden',
      }}
    >
      {(title || description) && (
        <div style={{ padding: paddings[padding], borderBottom: '1px solid #e5e7eb' }}>
          {title && (
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              {title}
            </h3>
          )}
          {description && (
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              {description}
            </p>
          )}
        </div>
      )}
      <div style={{ padding: paddings[padding] }}>{children}</div>
    </div>
  )
}
