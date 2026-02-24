'use client'

import * as AvatarPrimitive from '@radix-ui/react-avatar'

/**
 * A user avatar with image and initials fallback, built on Radix UI.
 *
 * @example <Avatar name="Alice Martin" size="sm" />
 * @example <Avatar name="Bob Johnson" size="lg" src="https://i.pravatar.cc/150?u=bob" />
 * @example <Avatar name="Claire Dupont" />
 */
export interface AvatarProps {
  /** Image URL */
  src?: string
  /** User's display name (used for alt text and initials fallback) */
  name: string
  /** Avatar size */
  size?: 'sm' | 'md' | 'lg'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const sizeClasses: Record<string, string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
}

/** A user avatar with image and initials fallback, built on Radix UI. */
export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-surface-overlay select-none ${sizeClasses[size]}`}
    >
      <AvatarPrimitive.Image
        src={src}
        alt={name}
        className="size-full object-cover"
      />
      <AvatarPrimitive.Fallback
        delayMs={src ? 600 : 0}
        className="size-full flex items-center justify-center bg-accent text-white font-semibold"
      >
        {getInitials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
