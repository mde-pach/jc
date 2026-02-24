import type { ReactNode } from 'react'

/**
 * A container card with optional header and action slot.
 *
 * @example <Card title="Overview" description="A quick summary of your project">Card body content goes here.</Card>
 * @example <Card title="Settings" elevated padding="lg">Elevated card with large padding.</Card>
 * @example <Card padding="none">Borderless content area.</Card>
 */
export interface CardProps {
  /** Card body content */
  children: ReactNode
  /** Card title displayed in the header */
  title?: string
  /** Optional description below the title */
  description?: string
  /** Action element rendered at the end of the header */
  headerAction?: ReactNode
  /** Whether to add a subtle shadow */
  elevated?: boolean
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
}

/** A container card with optional header and action slot. */
export function Card({
  children,
  title,
  description,
  headerAction,
  elevated = false,
  padding = 'md',
}: CardProps) {
  const hasHeader = title || description

  return (
    <div
      className={`rounded-lg border border-border bg-surface-raised overflow-hidden ${elevated ? 'shadow-lg shadow-black/20' : ''}`}
    >
      {hasHeader && (
        <div className={`flex items-start justify-between gap-4 border-b border-border ${paddings[padding]}`}>
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-fg m-0">{title}</h3>}
            {description && <p className="text-xs text-fg-subtle mt-1 m-0">{description}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={paddings[padding]}>{children}</div>
    </div>
  )
}
