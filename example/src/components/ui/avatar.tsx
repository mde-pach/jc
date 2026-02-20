/** A user avatar with image or initials fallback. */
export interface AvatarProps {
  /** Image URL */
  src?: string
  /** Alt text / user name (used for initials fallback) */
  name?: string
  /** Avatar size */
  size?: 'sm' | 'md' | 'lg'
  /** Shape variant */
  shape?: 'circle' | 'square'
}

export function Avatar({
  src,
  name = '',
  size = 'md',
  shape = 'circle',
}: AvatarProps) {
  const sizes: Record<string, number> = { sm: 32, md: 40, lg: 56 }
  const px = sizes[size]
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      style={{
        width: `${px}px`,
        height: `${px}px`,
        borderRadius: shape === 'circle' ? '50%' : '8px',
        backgroundColor: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontSize: `${px * 0.35}px`,
        fontWeight: 600,
        color: '#6b7280',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials || '?'
      )}
    </div>
  )
}
