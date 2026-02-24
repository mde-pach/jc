// ── String literal unions ────────────────────────────────────

interface StringUnionProps {
  /** Required variant */
  variant: 'primary' | 'secondary' | 'destructive'
  /** Optional size */
  size?: 'sm' | 'md' | 'lg'
  /** Boolean prop */
  disabled?: boolean
  /** true | false union (should resolve to boolean) */
  open?: true | false
  /** Optional string union (has undefined in union) */
  color?: 'red' | 'blue' | 'green'
}

export function StringUnion({ variant, size, disabled, open, color }: StringUnionProps) {
  return (
    <div data-variant={variant} data-size={size} data-disabled={disabled} data-open={open} data-color={color} />
  )
}
