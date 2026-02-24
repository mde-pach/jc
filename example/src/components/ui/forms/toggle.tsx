'use client'

/**
 * A toggle switch input for boolean settings.
 *
 * @example <Toggle label="Dark mode" description="Switch between light and dark themes" checked />
 * @example <Toggle label="Notifications" size="sm" />
 * @example <Toggle label="Maintenance" disabled checked />
 */
export interface ToggleProps {
  /** Whether the toggle is on */
  checked?: boolean
  /** Label displayed next to the toggle */
  label?: string
  /** Optional description below the label */
  description?: string
  /** Toggle size */
  size?: 'sm' | 'md'
  /** Disable interaction */
  disabled?: boolean
}

const trackSizes: Record<string, string> = {
  sm: 'w-8 h-[18px]',
  md: 'w-10 h-[22px]',
}

const thumbSizes: Record<string, string> = {
  sm: 'size-3.5',
  md: 'size-[18px]',
}

const thumbTranslate: Record<string, string> = {
  sm: 'translate-x-3.5',
  md: 'translate-x-[18px]',
}

/** A toggle switch input for boolean settings. */
export function Toggle({
  checked = false,
  label,
  description,
  size = 'md',
  disabled = false,
}: ToggleProps) {
  return (
    <label className={`inline-flex items-start gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <span
        className={`relative inline-flex shrink-0 items-center rounded-full transition-colors ${trackSizes[size]} ${checked ? 'bg-accent' : 'bg-surface-overlay'}`}
      >
        <span
          className={`inline-block rounded-full bg-white shadow transition-transform ${thumbSizes[size]} ${checked ? thumbTranslate[size] : 'translate-x-0.5'}`}
        />
      </span>
      {(label || description) && (
        <span className="flex flex-col gap-0.5">
          {label && <span className="text-sm font-medium text-fg">{label}</span>}
          {description && <span className="text-xs text-fg-subtle">{description}</span>}
        </span>
      )}
    </label>
  )
}
