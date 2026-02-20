import type { ReactNode } from 'react'

/** A pricing tier card with price, feature list, and call-to-action. */
export interface PricingCardProps {
  /** Tier name displayed as the card title */
  title: string
  /** Short description of the tier */
  description: string
  /** Price display text (e.g. "$0", "$29/mo") */
  price: string
  /** Optional label next to the price (e.g. "still free", "/month") */
  priceLabel?: string
  /** List of included features, one per line */
  features: string[]
  /** Call-to-action button or element at the bottom */
  children?: ReactNode
  /** Whether this tier is visually highlighted */
  highlighted?: boolean
}

export function PricingCard({
  title,
  description,
  price,
  priceLabel,
  features,
  children,
  highlighted = false,
}: PricingCardProps) {
  return (
    <div
      style={{
        borderRadius: '8px',
        border: highlighted ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        backgroundColor: '#fff',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>{title}</h3>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>{description}</p>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>
          {price}
          {priceLabel && (
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#94a3b8' }}> {priceLabel}</span>
          )}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#64748b' }}>
          {features.map((f) => (
            <div key={f}>{'✓ '}{f}</div>
          ))}
        </div>
        {children}
      </div>
    </div>
  )
}
