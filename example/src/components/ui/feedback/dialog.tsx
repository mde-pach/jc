'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * A modal dialog built on Radix UI primitives.
 *
 * @example <Dialog title="Confirm action" description="Are you sure you want to proceed?" trigger={"hello"} defaultOpen>Dialog body content here.</Dialog>
 * @example <Dialog title="New project" defaultOpen>Fill in the details to create a project.</Dialog>
 */
export interface DialogProps {
  /** Element that triggers the dialog */
  trigger?: ReactNode
  /** Dialog title */
  title: string
  /** Optional description below the title */
  description?: string
  /** Dialog body content */
  children: ReactNode
  /** Whether the dialog is open by default */
  defaultOpen?: boolean
}

/** A modal dialog built on Radix UI primitives. */
export function Dialog({
  trigger,
  title,
  description,
  children,
  defaultOpen = false,
}: DialogProps) {
  return (
    <DialogPrimitive.Root defaultOpen={defaultOpen}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed z-51 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-xl border border-border bg-surface-raised p-6 shadow-2xl shadow-black/40">
          <DialogPrimitive.Title className="text-base font-semibold text-fg m-0">
            {title}
          </DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="text-sm text-fg-muted mt-1.5 m-0">
              {description}
            </DialogPrimitive.Description>
          )}
          <div className="mt-5">{children}</div>
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-4 right-4 text-fg-subtle hover:text-fg transition-colors bg-transparent border-none cursor-pointer p-1"
          >
            <X size={16} />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
