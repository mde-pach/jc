interface BadgeProps {
  label: string
  color?: 'green' | 'red' | 'blue'
}

export function Badge({ label, color = 'green' }: BadgeProps) {
  return <span data-color={color}>{label}</span>
}
