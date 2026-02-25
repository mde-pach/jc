import type { LucideIcon, ReactNode } from 'lucide-react'

// ── Complex prop types ──────────────────────────────────────

/** Physical or mailing address */
export interface Address {
  street: string
  city: string
  zipCode: string
  country: string
}

/** Social media link */
export interface SocialLink {
  platform: 'twitter' | 'github' | 'linkedin' | 'website'
  url: string
  label?: string
}

/** A single metric with trend data */
export interface Metric {
  label: string
  value: number
  unit?: string
  trend?: 'up' | 'down' | 'flat'
}

/** Contact info object */
export interface ContactInfo {
  email: string
  phone?: string
  address?: Address
}

/** Notification preference */
export interface NotificationPrefs {
  email: boolean
  push: boolean
  sms: boolean
  frequency: 'instant' | 'daily' | 'weekly'
}

/**
 * A rich profile card showcasing complex prop data structures.
 * Used to test nested objects, typed arrays, callbacks, records, and discriminated unions.
 *
 * @example <ProfileCard name="Alice Johnson" role="admin" contact={{ email: "alice@example.com", phone: "+1 555-0123" }} online />
 * @example <ProfileCard name="Bob Smith" role="member" contact={{ email: "bob@example.com" }} metrics={[{ label: "Posts", value: 42 }, { label: "Followers", value: 1200, trend: "up" }]} />
 * @example <ProfileCard name="Charlie Dev" role="owner" contact={{ email: "charlie@acme.com", address: { street: "123 Main St", city: "Paris", zipCode: "75001", country: "France" } }} socialLinks={[{ platform: "github", url: "https://github.com/charlie" }, { platform: "twitter", url: "https://twitter.com/charlie" }]} verified />
 */
export interface ProfileCardProps {
  /** Display name */
  name: string
  /** Role in the organization */
  role: 'admin' | 'member' | 'owner' | 'guest'
  /** Avatar image URL */
  avatarUrl?: string
  /** Optional bio/description */
  bio?: string
  /** Whether the user is currently online */
  online?: boolean
  /** Whether the profile is verified */
  verified?: boolean

  // ── Complex object prop ──────────────────────────
  /** Contact information (nested object) */
  contact: ContactInfo
  /** Notification preferences (object with mixed types) */
  notifications?: NotificationPrefs

  // ── Array of objects ─────────────────────────────
  /** Social media links */
  socialLinks?: SocialLink[]
  /** Key metrics displayed on the profile */
  metrics?: Metric[]

  // ── Record / map type ────────────────────────────
  /** Custom metadata key-value pairs */
  metadata?: Record<string, string>

  // ── Callback props ───────────────────────────────
  /** Called when the profile card is clicked */
  onClick?: () => void
  /** Called when the user clicks the message button */
  onMessage?: (message: string) => void

  // ── Component props ──────────────────────────────
  /** Leading icon for the card */
  icon?: LucideIcon
  /** Custom badge element */
  badge?: ReactNode
  /** Custom footer content */
  footer?: ReactNode
}

const roleColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: 'bg-error/10', text: 'text-error' },
  owner: { bg: 'bg-warning/10', text: 'text-warning' },
  member: { bg: 'bg-accent/10', text: 'text-accent' },
  guest: { bg: 'bg-fg-subtle/10', text: 'text-fg-subtle' },
}

const platformIcons: Record<string, string> = {
  twitter: '𝕏',
  github: '⌘',
  linkedin: 'in',
  website: '🔗',
}

const trendSymbols: Record<string, { symbol: string; color: string }> = {
  up: { symbol: '↑', color: 'text-success' },
  down: { symbol: '↓', color: 'text-error' },
  flat: { symbol: '→', color: 'text-fg-subtle' },
}

/** A rich profile card showcasing complex prop data structures. */
export function ProfileCard({
  name,
  role,
  avatarUrl,
  bio,
  online = false,
  verified = false,
  contact,
  notifications,
  socialLinks,
  metrics,
  metadata,
  onClick,
  onMessage,
  icon: Icon,
  badge,
  footer,
}: ProfileCardProps) {
  const roleStyle = roleColors[role] ?? roleColors.member

  return (
    <div
      className={`rounded-lg border border-border bg-surface-raised overflow-hidden ${onClick ? 'cursor-pointer hover:border-accent/50 transition-colors' : ''}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-10 h-10 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">
              {Icon ? <Icon size={18} /> : name.charAt(0).toUpperCase()}
            </div>
          )}
          {online && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-surface-raised" />
          )}
        </div>

        {/* Name & role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-fg truncate">{name}</span>
            {verified && (
              <span className="text-accent text-xs" title="Verified">
                ✓
              </span>
            )}
            {badge}
          </div>
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${roleStyle.bg} ${roleStyle.text}`}
          >
            {role}
          </span>
        </div>
      </div>

      {/* Bio */}
      {bio && <p className="px-4 pb-3 text-xs text-fg-muted leading-relaxed m-0">{bio}</p>}

      {/* Contact info */}
      <div className="px-4 pb-3 space-y-1">
        <div className="text-[10px] text-fg-subtle uppercase tracking-wider font-medium">
          Contact
        </div>
        <div className="text-xs text-fg-muted">{contact.email}</div>
        {contact.phone && <div className="text-xs text-fg-muted">{contact.phone}</div>}
        {contact.address && (
          <div className="text-xs text-fg-muted">
            {contact.address.street}, {contact.address.city} {contact.address.zipCode},{' '}
            {contact.address.country}
          </div>
        )}
      </div>

      {/* Metrics */}
      {metrics && metrics.length > 0 && (
        <div className="px-4 pb-3 flex gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-sm font-bold text-fg font-mono">
                {m.value.toLocaleString()}
                {m.unit && (
                  <span className="text-[10px] text-fg-subtle ml-0.5">{m.unit}</span>
                )}
              </div>
              <div className="text-[10px] text-fg-subtle flex items-center gap-1 justify-center">
                {m.label}
                {m.trend && (
                  <span className={trendSymbols[m.trend]?.color}>
                    {trendSymbols[m.trend]?.symbol}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Social links */}
      {socialLinks && socialLinks.length > 0 && (
        <div className="px-4 pb-3 flex gap-2">
          {socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-overlay text-[10px] text-fg-subtle hover:text-fg transition-colors"
              title={link.label ?? link.platform}
            >
              <span>{platformIcons[link.platform] ?? '•'}</span>
              {link.label ?? link.platform}
            </a>
          ))}
        </div>
      )}

      {/* Notification preferences */}
      {notifications && (
        <div className="px-4 pb-3">
          <div className="text-[10px] text-fg-subtle uppercase tracking-wider font-medium mb-1">
            Notifications
          </div>
          <div className="flex gap-3 text-[10px]">
            <span className={notifications.email ? 'text-success' : 'text-fg-subtle'}>
              ✉ Email
            </span>
            <span className={notifications.push ? 'text-success' : 'text-fg-subtle'}>
              🔔 Push
            </span>
            <span className={notifications.sms ? 'text-success' : 'text-fg-subtle'}>
              💬 SMS
            </span>
            <span className="text-fg-muted">• {notifications.frequency}</span>
          </div>
        </div>
      )}

      {/* Metadata */}
      {metadata && Object.keys(metadata).length > 0 && (
        <div className="px-4 pb-3">
          <div className="text-[10px] text-fg-subtle uppercase tracking-wider font-medium mb-1">
            Metadata
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(metadata).map(([key, val]) => (
              <span
                key={key}
                className="inline-block rounded bg-surface-overlay px-2 py-0.5 text-[10px] text-fg-subtle"
              >
                {key}: {val}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Message button */}
      {onMessage && (
        <div className="px-4 pb-3">
          <button
            type="button"
            className="w-full py-1.5 rounded bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-colors border-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onMessage('Hello!')
            }}
          >
            Send Message
          </button>
        </div>
      )}

      {/* Footer */}
      {footer && <div className="border-t border-border px-4 py-3">{footer}</div>}
    </div>
  )
}
