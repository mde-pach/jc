'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

/**
 * A tooltip that displays on hover, built on Radix UI.
 *
 * @example <Tooltip content="Copy to clipboard" side="top">Hover me</Tooltip>
 * @example <Tooltip content="More info" side="right" delayDuration={0}>Help</Tooltip>
 */
export interface TooltipProps {
  /** The trigger element */
  children: ReactNode
  /** Tooltip text content */
  content: string
  /** Preferred side of the trigger to render */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** Delay in ms before showing */
  delayDuration?: number
}

/** A tooltip that displays on hover, built on Radix UI. */
export function Tooltip({
  children,
  content,
  side = 'top',
  delayDuration = 200,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root delayDuration={delayDuration}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className="z-50 rounded-md bg-fg px-2.5 py-1.5 text-xs font-medium text-surface shadow-lg max-w-[220px]"
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-fg" width={10} height={5} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
