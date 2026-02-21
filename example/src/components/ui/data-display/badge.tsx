import type { ReactNode } from 'react'

/** A small status indicator badge. */
export interface BadgeProps {
  /** Badge content */
  children: ReactNode
  /** Badge color variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  /** Rounded pill shape */
  pill?: boolean
}

export function Badge({
  children,
  variant = 'default',
  pill = false,
}: BadgeProps) {
  const colors: Record<string, { bg: string; fg: string }> = {
    default: { bg: '#e5e7eb', fg: '#374151' },
    success: { bg: '#d1fae5', fg: '#065f46' },
    warning: { bg: '#fef3c7', fg: '#92400e' },
    error: { bg: '#fee2e2', fg: '#991b1b' },
    info: { bg: '#dbeafe', fg: '#1e40af' },
  }

  const { bg, fg } = colors[variant] ?? colors.default

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: '12px',
        fontWeight: 500,
        borderRadius: pill ? '9999px' : '4px',
        backgroundColor: bg,
        color: fg,
      }}
    >
      {children}
    </span>
  )
}
