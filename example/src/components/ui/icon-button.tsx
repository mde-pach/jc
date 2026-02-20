import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** A button with a leading icon and optional trailing icon. */
export interface IconButtonProps {
  /** Button label */
  children: ReactNode
  /** Leading icon displayed before the label */
  icon: LucideIcon
  /** Optional trailing icon displayed after the label */
  trailingIcon?: LucideIcon
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'secondary' | 'outline'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the button is disabled */
  disabled?: boolean
}

export function IconButton({
  children,
  icon: Icon,
  trailingIcon: TrailingIcon,
  variant = 'default',
  size = 'md',
  disabled = false,
}: IconButtonProps) {
  const sizes: Record<string, { h: string; px: string; fs: string; icon: number; gap: string }> = {
    sm: { h: '32px', px: '10px', fs: '12px', icon: 14, gap: '4px' },
    md: { h: '40px', px: '14px', fs: '14px', icon: 16, gap: '6px' },
    lg: { h: '48px', px: '18px', fs: '16px', icon: 18, gap: '8px' },
  }

  const variants: Record<string, React.CSSProperties> = {
    default: { backgroundColor: '#111827', color: '#fff', border: '1px solid transparent' },
    primary: { backgroundColor: '#3b82f6', color: '#fff', border: '1px solid transparent' },
    secondary: { backgroundColor: '#e5e7eb', color: '#111827', border: '1px solid transparent' },
    outline: { backgroundColor: 'transparent', color: '#111827', border: '1px solid #d1d5db' },
  }

  const s = sizes[size]

  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        height: s.h,
        padding: `0 ${s.px}`,
        fontSize: s.fs,
        fontWeight: 500,
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
        ...variants[variant],
      }}
    >
      <Icon size={s.icon} />
      {children}
      {TrailingIcon && <TrailingIcon size={s.icon} />}
    </button>
  )
}
