/** A text input field with label and error state. */
export interface InputProps {
  /** Input label displayed above the field */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Current value */
  value?: string
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'url'
  /** Error message shown below the field */
  error?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Whether the field is required */
  required?: boolean
}

export function Input({
  label,
  placeholder,
  value,
  type = 'text',
  error,
  disabled = false,
  required = false,
}: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        readOnly
        style={{
          height: '40px',
          padding: '0 12px',
          fontSize: '14px',
          borderRadius: '6px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          backgroundColor: disabled ? '#f9fafb' : '#fff',
          color: '#111827',
          outline: 'none',
          opacity: disabled ? 0.5 : 1,
          width: '240px',
        }}
      />
      {error && (
        <span style={{ fontSize: '12px', color: '#ef4444' }}>{error}</span>
      )}
    </div>
  )
}
