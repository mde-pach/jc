import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * A placeholder for empty content areas with an icon, message, and optional action.
 *
 * @example <EmptyState icon={Inbox} title="No messages" description="You're all caught up." />
 * @example <EmptyState icon={Search} title="No results" description="Try a different search term." />
 * @example <EmptyState icon={FolderOpen} title="Empty folder" />
 */
export interface EmptyStateProps {
  /** Decorative icon */
  icon?: LucideIcon
  /** Primary message */
  title: string
  /** Supporting description */
  description?: string
  /** Action element (e.g. a button) */
  action?: ReactNode
}

/** A placeholder for empty content areas with an icon, message, and optional action. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-surface-overlay p-4 text-fg-subtle">
          <Icon size={32} />
        </div>
      )}
      <h3 className="text-sm font-semibold text-fg m-0">{title}</h3>
      {description && <p className="text-sm text-fg-subtle mt-1.5 m-0 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
