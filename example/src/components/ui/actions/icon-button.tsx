import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** A button that renders a leading Lucide icon alongside its label. */
export interface IconButtonProps {
  /** The button label */
  children: ReactNode
  /** Lucide icon component rendered before the label */
  icon: LucideIcon
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the button is disabled */
  disabled?: boolean
}

export function IconButton({
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
}: IconButtonProps) {
  const sizes: Record<string, { padding: string; fontSize: string; height: string; iconSize: number; gap: string }> = {
    sm: { padding: '4px 12px', fontSize: '13px', height: '32px', iconSize: 14, gap: '5px' },
    md: { padding: '8px 16px', fontSize: '14px', height: '40px', iconSize: 16, gap: '6px' },
    lg: { padding: '12px 24px', fontSize: '15px', height: '48px', iconSize: 18, gap: '8px' },
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: '#3b82f6', color: '#fff', border: '1px solid #3b82f6' },
    secondary: { backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0' },
    outline: { backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db' },
    ghost: { backgroundColor: 'transparent', color: '#374151', border: '1px solid transparent' },
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
        borderRadius: '8px',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
        padding: s.padding,
        fontSize: s.fontSize,
        height: s.height,
        ...variants[variant],
      }}
    >
      <Icon size={s.iconSize} />
      {children}
    </button>
  )
}
