import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * A button with a leading icon and text label.
 *
 * @example <IconButton icon={Heart}>Like</IconButton>
 * @example <IconButton icon={Settings} onClick={() => alert('Settings')} rounded>Settings</IconButton>
 * @example <IconButton icon={Trash2} disabled>Delete</IconButton>
 */
export interface IconButtonProps {
  children: ReactNode
  icon: LucideIcon
  onClick?: () => void
  rounded?: boolean
  disabled?: boolean
}

/** A button with a leading icon and text label. */
export function IconButton({ children, icon: Icon, onClick, rounded, disabled }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 h-9 bg-surface-raised
        border border-border text-fg text-sm hover:bg-surface-overlay transition-colors
        ${rounded ? 'rounded-full' : 'rounded-md'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <Icon size={16} />
      <span>{children}</span>
    </button>
  )
}
