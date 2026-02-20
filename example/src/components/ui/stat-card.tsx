import type { LucideIcon } from 'lucide-react'

/** A stat card displaying a metric with an icon and optional trend. */
export interface StatCardProps {
  /** The metric label */
  label: string
  /** The metric value */
  value: string
  /** Icon displayed in the card */
  icon: LucideIcon
  /** Trend direction indicator */
  trend?: 'up' | 'down' | 'neutral'
  /** Trend percentage text (e.g. "+12%") */
  trendText?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend = 'neutral',
  trendText,
}: StatCardProps) {
  const trendColors: Record<string, string> = {
    up: '#059669',
    down: '#dc2626',
    neutral: '#6b7280',
  }

  const trendArrows: Record<string, string> = {
    up: '\u2191',
    down: '\u2193',
    neutral: '\u2192',
  }

  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        minWidth: '200px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3b82f6',
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p style={{ margin: '0 0 2px', fontSize: '13px', color: '#6b7280' }}>{label}</p>
        <p style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: '#111827' }}>
          {value}
        </p>
        {trendText && (
          <span style={{ fontSize: '12px', fontWeight: 500, color: trendColors[trend] }}>
            {trendArrows[trend]} {trendText}
          </span>
        )}
      </div>
    </div>
  )
}
