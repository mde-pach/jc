import type { ComponentType, ReactElement, ReactNode } from 'react'

interface IconComponentProps {
  /** A component constructor (LucideIcon-like) */
  icon?: ComponentType<{ size?: number }>
  /** A rendered React element */
  element?: ReactElement
  /** Arbitrary React content */
  node?: ReactNode
  /** Plain string prop — not a component */
  label?: string
  /** Another component constructor with different generic */
  renderer?: ComponentType<Record<string, unknown>>
}

export function IconComponent({ icon: Icon, element, node, label, renderer }: IconComponentProps) {
  return (
    <div>
      {Icon && <Icon size={16} />}
      {element}
      {node}
      {label}
    </div>
  )
}
