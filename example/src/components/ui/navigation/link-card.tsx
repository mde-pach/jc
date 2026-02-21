import type { LucideIcon } from 'lucide-react'

/** A clickable card used for navigation between doc pages. */
export interface LinkCardProps {
  /** Navigation label (e.g. "Getting Started") */
  title: string
  /** Short description shown below the title */
  description?: string
  /** URL the card links to */
  href: string
  /** Optional Lucide icon displayed before the title */
  icon?: LucideIcon
  /** Direction hint that affects the arrow and alignment */
  direction?: 'forward' | 'back'
}

export function LinkCard({
  title,
  description,
  href,
  icon: Icon,
  direction = 'forward',
}: LinkCardProps) {
  const isBack = direction === 'back'

  return (
    <a
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isBack ? 'flex-start' : 'flex-end',
        textAlign: isBack ? 'left' : 'right',
        padding: '16px 20px',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        textDecoration: 'none',
        transition: 'all 0.15s',
        flex: 1,
      }}
    >
      <span
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: '#94a3b8',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {isBack && '←'}
        {isBack ? 'Previous' : 'Next'}
        {!isBack && '→'}
      </span>
      <span
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {Icon && <Icon size={15} />}
        {title}
      </span>
      {description && (
        <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
          {description}
        </span>
      )}
    </a>
  )
}
