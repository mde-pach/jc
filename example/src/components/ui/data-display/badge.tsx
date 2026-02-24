import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * A compact status indicator badge with color variants.
 *
 * @example <Badge variant="success" icon={CheckCircle}>Active</Badge>
 * @example <Badge variant="error" pill>Expired</Badge>
 * @example <Badge variant="warning" icon={AlertTriangle}>Pending</Badge>
 * @example <Badge variant="outline">Draft</Badge>
 */
export interface BadgeProps {
  /** Badge content */
  children: ReactNode
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'
  /** Rounded pill shape */
  pill?: boolean
  /** Optional leading icon */
  icon?: LucideIcon
}

const variantClasses: Record<string, string> = {
  default: 'bg-surface-overlay text-fg-muted',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  info: 'bg-accent/15 text-accent',
  outline: 'bg-transparent text-fg-muted border border-border',
}

/** A compact status indicator badge with color variants. */
export function Badge({ children, variant = 'default', pill = false, icon: Icon }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium ${pill ? 'rounded-full' : 'rounded'} ${variantClasses[variant] ?? variantClasses.default}`}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  )
}
