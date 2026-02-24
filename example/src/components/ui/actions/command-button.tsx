import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'

/**
 * A versatile command button with icon, keyboard shortcut, and loading state.
 *
 * @example <CommandButton icon={Download} variant="primary" shortcut="Cmd+S">Save</CommandButton>
 * @example <CommandButton icon={Trash2} variant="destructive" loading>Deleting...</CommandButton>
 */
export interface CommandButtonProps {
  /** Button label */
  children: ReactNode
  /** Leading icon */
  icon?: LucideIcon
  /** Visual variant */
  variant?: 'default' | 'primary' | 'ghost' | 'destructive'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Show loading spinner */
  loading?: boolean
  /** Disable interaction */
  disabled?: boolean
  /** Keyboard shortcut hint */
  shortcut?: string
  /** Optional trailing badge element */
  trailingBadge?: ReactNode
}

const variantClasses: Record<string, string> = {
  default: 'bg-surface-raised border border-border text-fg hover:bg-surface-overlay',
  primary: 'bg-accent text-white hover:bg-accent-muted',
  ghost: 'bg-transparent text-fg-muted hover:bg-surface-overlay hover:text-fg',
  destructive: 'bg-error/15 text-error border border-error/20 hover:bg-error/25',
}

const sizeClasses: Record<string, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2.5',
}

/** A versatile command button with icon, keyboard shortcut, and loading state. */
export function CommandButton({
  children,
  icon: Icon,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled = false,
  shortcut,
  trailingBadge,
}: CommandButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors
        ${variantClasses[variant] ?? variantClasses.default}
        ${sizeClasses[size] ?? sizeClasses.md}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        Icon && <Icon size={16} />
      )}
      <span>{children}</span>
      {trailingBadge && <span className="ml-1">{trailingBadge}</span>}
      {shortcut && (
        <kbd className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-mono opacity-70">
          {shortcut}
        </kbd>
      )}
    </button>
  )
}
