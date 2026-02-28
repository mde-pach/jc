import type { ForwardRefExoticComponent, RefAttributes } from 'react'

/** Simulates LucideIcon-style type that resolves to a structural form */
type LucideIcon = ForwardRefExoticComponent<{ size?: number } & RefAttributes<SVGSVGElement>>

interface CardProps {
  /** Icon prop typed as ForwardRefExoticComponent (like LucideIcon) */
  icon?: LucideIcon
  /** Plain string prop */
  title: string
}

export function Card({ icon: Icon, title }: CardProps) {
  return (
    <div>
      {Icon && <Icon size={16} />}
      <span>{title}</span>
    </div>
  )
}
