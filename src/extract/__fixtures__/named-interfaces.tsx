import type { ReactNode } from 'react'

// ── Named interface types (not inlined in props) ──────────

interface Address {
  street: string
  city: string
  zipCode: string
  country: string
}

interface ContactInfo {
  email: string
  phone?: string
  address?: Address
}

interface SocialLink {
  platform: 'twitter' | 'github' | 'linkedin' | 'website'
  url: string
  label?: string
}

interface Metric {
  label: string
  value: number
  unit?: string
  trend?: 'up' | 'down' | 'flat'
}

interface NotificationPrefs {
  email: boolean
  push: boolean
  sms: boolean
  frequency: 'instant' | 'daily' | 'weekly'
}

interface ProfileCardProps {
  /** Display name */
  name: string
  /** Role in the organization */
  role: 'admin' | 'member' | 'owner' | 'guest'
  /** Whether the user is online */
  online?: boolean

  /** Contact information (named interface, nested objects) */
  contact: ContactInfo
  /** Notification preferences (object with booleans + enum) */
  notifications?: NotificationPrefs

  /** Social media links (array of objects with enum field) */
  socialLinks?: SocialLink[]
  /** Key metrics (array of objects with optional enum) */
  metrics?: Metric[]

  /** Custom metadata key-value pairs */
  metadata?: Record<string, string>

  /** Called when the card is clicked */
  onClick?: () => void
  /** Called when the user sends a message */
  onMessage?: (message: string) => void
  /** Called when metrics change */
  onMetricsChange?: (metrics: Metric[]) => void

  /** Custom badge element */
  badge?: ReactNode
  /** Custom footer content */
  footer?: ReactNode
}

export function ProfileCard({
  name,
  role,
  online,
  contact,
  notifications,
  socialLinks,
  metrics,
  metadata,
  onClick,
  onMessage,
  onMetricsChange,
  badge,
  footer,
}: ProfileCardProps) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: test fixture
    // biome-ignore lint/a11y/useKeyWithClickEvents: test fixture
    <div
      onClick={() => {
        onClick?.()
        onMessage?.('hi')
        onMetricsChange?.([])
      }}
    >
      <h3>{name}</h3>
      <span>{role}</span>
      {online && <span>Online</span>}
      <div>{contact.email}</div>
      {contact.phone && <div>{contact.phone}</div>}
      {contact.address && (
        <div>
          {contact.address.street}, {contact.address.city}
        </div>
      )}
      {notifications && <div>{notifications.frequency}</div>}
      {socialLinks?.map((l) => (
        <a key={l.platform} href={l.url}>
          {l.label ?? l.platform}
        </a>
      ))}
      {metrics?.map((m) => (
        <span key={m.label}>
          {m.value}
          {m.unit}
        </span>
      ))}
      {metadata &&
        Object.entries(metadata).map(([k, v]) => (
          <span key={k}>
            {k}: {v}
          </span>
        ))}
      {badge}
      {footer}
    </div>
  )
}
