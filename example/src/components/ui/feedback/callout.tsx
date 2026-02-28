'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

/**
 * An informational callout banner with intent variants.
 *
 * @example <Callout intent="info" title="Heads up">This feature is in beta.</Callout>
 * @example <Callout intent="success" title="Saved">Your changes have been applied.</Callout>
 * @example <Callout intent="warning" dismissible>Storage is almost full.</Callout>
 * @example <Callout intent="error" icon={ShieldAlert}>Access denied. Contact your admin.</Callout>
 */
export interface CalloutProps {
  /** Callout body content */
  children: ReactNode
  /** Optional title */
  title?: string
  /** Visual intent */
  intent?: 'info' | 'success' | 'warning' | 'error'
  /** Show a dismiss button */
  dismissible?: boolean
  /** Override the default icon */
  icon?: LucideIcon
}

const intentStyles: Record<string, { border: string; icon: string; defaultIcon: LucideIcon }> = {
  info: { border: 'border-accent/30', icon: 'text-accent', defaultIcon: Info },
  success: { border: 'border-success/30', icon: 'text-success', defaultIcon: CheckCircle },
  warning: { border: 'border-warning/30', icon: 'text-warning', defaultIcon: AlertTriangle },
  error: { border: 'border-error/30', icon: 'text-error', defaultIcon: XCircle },
}

/** An informational callout banner with intent variants. */
export function Callout({
  children,
  title,
  intent = 'info',
  dismissible = false,
  icon,
}: CalloutProps) {
  const style = intentStyles[intent] ?? intentStyles.info
  const IconComponent = icon ?? style.defaultIcon

  return (
    <div className={`flex gap-3 rounded-lg border ${style.border} bg-surface-raised p-4`}>
      <div className={`shrink-0 mt-0.5 ${style.icon}`}>
        <IconComponent size={18} />
      </div>
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-semibold text-fg m-0 mb-1">{title}</p>}
        <div className="text-sm text-fg-muted leading-relaxed">{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          className="shrink-0 text-fg-subtle hover:text-fg transition-colors mb-auto"
          aria-label="Dismiss"
        >
          <XCircle size={16} />
        </button>
      )}
    </div>
  )
}
