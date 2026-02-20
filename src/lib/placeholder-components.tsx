'use client'

import { createElement, type ReactNode } from 'react'

/**
 * Minimal inline SVG icons for the showcase preview.
 * These are simple path-based icons that work without any icon library.
 * When rendering, the host app's actual icon library (e.g. lucide-react) is not needed.
 */

interface IconProps {
  className?: string
  strokeWidth?: number
  size?: number
}

function SvgIcon({ d, className, strokeWidth = 2, size = 24 }: IconProps & { d: string }) {
  return createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
  }, createElement('path', { d }))
}

// Reusable factory
function makeIcon(d: string) {
  return function Icon(props: IconProps) {
    return createElement(SvgIcon, { ...props, d })
  }
}

// Icon definitions (subset of Lucide paths)
const ICON_MAP: Record<string, (props: IconProps) => ReactNode> = {
  star: makeIcon('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'),
  heart: makeIcon('M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'),
  zap: makeIcon('M13 2L3 14h9l-1 10 10-12h-9l1-10z'),
  bell: makeIcon('M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0'),
  check: makeIcon('M20 6L9 17l-5-5'),
  x: makeIcon('M18 6L6 18M6 6l12 12'),
  search: makeIcon('M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5zM21 21l-4.35-4.35'),
  settings: makeIcon('M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'),
  user: makeIcon('M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'),
  home: makeIcon('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'),
  plus: makeIcon('M12 5v14M5 12h14'),
  'arrow-right': makeIcon('M5 12h14M12 5l7 7-7 7'),
  calendar: makeIcon('M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18'),
  mail: makeIcon('M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6'),
  tag: makeIcon('M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01'),
}

/**
 * Resolve a placeholder key to an actual React value.
 *
 * Key format:
 *   - 'icon:star'        → SVG icon component or element (depends on componentKind)
 *   - 'text:badge'       → <span>New</span>
 *   - 'text:label'       → <span>Label</span>
 *   - 'text:paragraph'   → <span>Lorem ipsum...</span>
 *   - 'none'             → undefined (prop not passed)
 *
 * @param componentKind 'icon' returns a component constructor (for LucideIcon-style props),
 *                       'element'/'node' returns a rendered JSX element (for ReactNode props).
 */
export function resolvePlaceholder(key: string, componentKind?: string): unknown {
  if (!key || key === 'none') return undefined

  const [type, name] = key.split(':')

  if (type === 'icon' && name) {
    const IconComp = ICON_MAP[name] ?? ICON_MAP.star

    // 'icon' kind = component expects a constructor (LucideIcon pattern: <Icon className="..." />)
    // 'element'/'node' kind = component expects a rendered element (<Star /> as ReactNode)
    if (componentKind === 'element' || componentKind === 'node') {
      return createElement(IconComp, null)
    }
    // Default: return constructor for LucideIcon-style props
    return IconComp
  }

  if (type === 'text') {
    switch (name) {
      case 'badge':
        return createElement('span', null, 'New')
      case 'label':
        return createElement('span', null, 'Label')
      case 'paragraph':
        return createElement('span', null, 'Lorem ipsum dolor sit amet')
      default:
        return createElement('span', null, name)
    }
  }

  return undefined
}

/**
 * Check if a placeholder key represents an icon component constructor
 * (which needs to be called differently than a ReactNode element).
 */
export function isIconKey(key: string): boolean {
  return key.startsWith('icon:')
}

/**
 * For the code preview, convert a placeholder key to a readable JSX string.
 */
export function placeholderToCodeString(key: string, propName: string): string {
  if (!key || key === 'none') return ''

  const [type, name] = key.split(':')

  if (type === 'icon' && name) {
    const pascal = name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')
    return pascal
  }

  if (type === 'text') {
    switch (name) {
      case 'badge': return '<span>New</span>'
      case 'label': return '<span>Label</span>'
      case 'paragraph': return '<span>Lorem ipsum...</span>'
      default: return `<span>${name}</span>`
    }
  }

  return key
}
