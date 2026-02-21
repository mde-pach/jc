import type { ReactNode } from 'react'

/** A primary action button with multiple variants and sizes. */
export interface ButtonProps {
  /** The button label */
  children: ReactNode
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the button is disabled */
  disabled?: boolean
  /** Full width button */
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    border: '1px solid transparent',
    transition: 'all 0.15s',
    width: fullWidth ? '100%' : 'auto',
  }

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '4px 12px', fontSize: '12px', height: '32px' },
    md: { padding: '8px 16px', fontSize: '14px', height: '40px' },
    lg: { padding: '12px 24px', fontSize: '16px', height: '48px' },
  }

  const variants: Record<string, React.CSSProperties> = {
    default: { backgroundColor: '#111827', color: '#fff' },
    primary: { backgroundColor: '#3b82f6', color: '#fff' },
    secondary: { backgroundColor: '#e5e7eb', color: '#111827' },
    destructive: { backgroundColor: '#ef4444', color: '#fff' },
    outline: { backgroundColor: 'transparent', color: '#111827', borderColor: '#d1d5db' },
    ghost: { backgroundColor: 'transparent', color: '#111827' },
  }

  return (
    <button
      type="button"
      disabled={disabled}
      style={{ ...baseStyle, ...sizes[size], ...variants[variant] }}
    >
      {children}
    </button>
  )
}
