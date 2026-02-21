import type { ReactNode } from 'react'

interface ButtonProps {
  /** The visual style variant */
  variant?: 'primary' | 'secondary' | 'destructive'
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the button is disabled */
  disabled?: boolean
  /** Icon component rendered before label */
  icon?: React.ComponentType<{ size?: number }>
  /** Content rendered inside the button */
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  icon,
  children,
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      data-icon={!!icon}
    >
      {children}
    </button>
  )
}
