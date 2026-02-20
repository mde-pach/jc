/** A testimonial card with a quote, author name, and role. */
export interface TestimonialCardProps {
  /** The testimonial quote text */
  quote: string
  /** Author's full name */
  name: string
  /** Author's role or title */
  role: string
}

export function TestimonialCard({ quote, name, role }: TestimonialCardProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981']
  const colorIndex = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
  const bg = colors[colorIndex]

  return (
    <div
      style={{
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        padding: '20px',
      }}
    >
      <p
        style={{
          margin: '0 0 16px',
          fontSize: '14px',
          lineHeight: 1.7,
          color: '#334155',
          fontStyle: 'italic',
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{role}</div>
        </div>
      </div>
    </div>
  )
}
