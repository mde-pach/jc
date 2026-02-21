import type { ReactNode } from 'react'

/** An alert banner for status messages. */
export interface AlertProps {
  /** Alert content */
  children: ReactNode
  /** Alert title */
  title?: string
  /** Severity level */
  severity?: 'info' | 'success' | 'warning' | 'error'
  /** Whether the alert can be dismissed */
  dismissible?: boolean
}

export function Alert({
  children,
  title,
  severity = 'info',
  dismissible = false,
}: AlertProps) {
  const styles: Record<string, { bg: string; border: string; fg: string }> = {
    info: { bg: '#eff6ff', border: '#bfdbfe', fg: '#1e40af' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', fg: '#166534' },
    warning: { bg: '#fffbeb', border: '#fde68a', fg: '#92400e' },
    error: { bg: '#fef2f2', border: '#fecaca', fg: '#991b1b' },
  }

  const { bg, border, fg } = styles[severity]

  return (
    <div
      role="alert"
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        border: `1px solid ${border}`,
        backgroundColor: bg,
        color: fg,
        fontSize: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '8px',
        maxWidth: '100%',
      }}
    >
      <div>
        {title && (
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{title}</div>
        )}
        <div style={{ opacity: 0.9 }}>{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: fg,
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
            opacity: 0.5,
          }}
        >
          &times;
        </button>
      )}
    </div>
  )
}
