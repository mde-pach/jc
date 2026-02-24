import type { LucideIcon } from 'lucide-react'

/**
 * A text input field with label, error state, and optional leading icon.
 *
 * @example <TextField label="Email" placeholder="you@example.com" type="email" required leadingIcon={Mail} />
 * @example <TextField label="Password" type="password" placeholder="Enter password" />
 * @example <TextField label="Username" value="alice" error="Already taken" />
 * @example <TextField placeholder="Search..." type="search" leadingIcon={Search} />
 */
export interface TextFieldProps {
  /** Input label */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Current value */
  value?: string
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'search'
  /** Error message displayed below the input */
  error?: string
  /** Disable interaction */
  disabled?: boolean
  /** Show required indicator */
  required?: boolean
  /** Optional icon displayed inside the input */
  leadingIcon?: LucideIcon
}

/** A text input field with label, error state, and optional leading icon. */
export function TextField({
  label,
  placeholder,
  value,
  type = 'text',
  error,
  disabled = false,
  required = false,
  leadingIcon: Icon,
}: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-fg">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly
          className={`w-full rounded-md border bg-surface text-sm text-fg placeholder:text-fg-subtle outline-none transition-colors
            ${Icon ? 'pl-9 pr-3' : 'px-3'} py-2
            ${error ? 'border-error' : 'border-border focus:border-accent'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>
      {error && <p className="text-xs text-error m-0">{error}</p>}
    </div>
  )
}
