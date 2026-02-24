import type { ReactNode } from 'react'

interface StatCardProps {
  /** The label displayed on the card */
  label: string
  /** Numeric value */
  value: number
  /** Percentage change */
  change?: string
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral'
  /** Metadata tags */
  tags?: string[]
  /** Numeric scores */
  scores?: number[]
  /** Whether the card is highlighted */
  highlighted?: boolean
}

export function StatCard({
  label,
  value,
  change,
  trend,
  tags,
  scores,
  highlighted,
}: StatCardProps) {
  return (
    <div data-highlighted={highlighted}>
      <h3>{label}</h3>
      <span>{value}</span>
      {change && <span data-trend={trend}>{change}</span>}
      {tags && tags.map((t) => <span key={t}>{t}</span>)}
      {scores && scores.map((s, i) => <span key={i}>{s}</span>)}
    </div>
  )
}

interface ConfigPanelProps {
  /** Panel title */
  title: string
  /** Configuration object */
  config: { theme: string; layout: string }
  /** List of menu items with structured fields */
  menuItems: { label: string; icon: ReactNode; href: string }[]
  /** Simple string-to-string mapping */
  labels?: Record<string, string>
}

export function ConfigPanel({ title, config, menuItems, labels }: ConfigPanelProps) {
  return (
    <div>
      <h2>{title}</h2>
      <pre>{JSON.stringify(config)}</pre>
      {menuItems.map((item) => (
        <a key={item.href} href={item.href}>
          {item.icon} {item.label}
        </a>
      ))}
      {labels && Object.entries(labels).map(([k, v]) => <span key={k}>{v}</span>)}
    </div>
  )
}
