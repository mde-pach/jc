import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * A metric card displaying a key statistic with optional trend indicator.
 *
 * @example <StatCard label="Revenue" value={12500} change="+14%" trend="up" icon={DollarSign} />
 * @example <StatCard label="Bugs" value={3} change="-60%" trend="down" icon={Bug} tags={["critical", "ui"]} />
 * @example <StatCard label="Uptime" value={99} trend="flat" />
 */
export interface StatCardProps {
  /** Metric label */
  label: string
  /** Numeric value */
  value: number
  /** Change text (e.g. "+12%") */
  change?: string
  /** Trend direction */
  trend?: 'up' | 'down' | 'flat'
  /** Decorative icon */
  icon?: LucideIcon
  /** Metadata tags */
  tags?: string[]
}

const trendConfig: Record<string, { color: string; Icon: LucideIcon }> = {
  up: { color: 'text-success', Icon: TrendingUp },
  down: { color: 'text-error', Icon: TrendingDown },
  flat: { color: 'text-fg-subtle', Icon: Minus },
}

/** A metric card displaying a key statistic with optional trend indicator. */
export function StatCard({
  label,
  value,
  change,
  trend = 'flat',
  icon: Icon,
  tags,
}: StatCardProps) {
  const t = trendConfig[trend] ?? trendConfig.flat

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-fg-subtle uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="text-fg-subtle">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-fg font-mono">{value.toLocaleString()}</span>
        {change && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${t.color}`}>
            <t.Icon size={14} />
            {change}
          </span>
        )}
      </div>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded bg-surface-overlay px-2 py-0.5 text-[11px] text-fg-subtle"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
