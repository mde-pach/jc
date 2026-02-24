'use client'

import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

/** A collapsible accordion container built on Radix UI. */
export interface AccordionProps {
  /** AccordionItem children */
  children: ReactNode
  /** Whether one or multiple items can be open */
  type?: 'single' | 'multiple'
  /** Whether items are collapsible when type is single */
  collapsible?: boolean
}

/** A collapsible accordion container built on Radix UI. */
export function Accordion({
  children,
  type = 'single',
  collapsible = true,
}: AccordionProps) {
  const props =
    type === 'single'
      ? ({ type: 'single' as const, collapsible })
      : ({ type: 'multiple' as const })

  return (
    <AccordionPrimitive.Root
      {...props}
      className="rounded-lg border border-border overflow-hidden w-full"
    >
      {children}
    </AccordionPrimitive.Root>
  )
}

/** Props for AccordionItem. */
export interface AccordionItemProps {
  /** Unique value for this item */
  value: string
  /** Header text displayed in the trigger */
  title: string
  /** Content revealed when expanded */
  children: ReactNode
}

/**
 * A single item within an Accordion.
 *
 * @example
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="install" title="How do I install jc?">Run bun add jc.</AccordionItem>
 * </Accordion>
 *
 * @example
 * <Accordion type="multiple">
 *   <AccordionItem value="faq-1" title="Is jc free?">Yes, MIT licensed.</AccordionItem>
 * </Accordion>
 */
export function AccordionItem({ value, title, children }: AccordionItemProps) {
  return (
    <AccordionPrimitive.Item value={value} className="border-b border-border last:border-0">
      <AccordionPrimitive.Header className="m-0">
        <AccordionPrimitive.Trigger className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium text-fg bg-transparent hover:bg-surface-overlay/50 cursor-pointer transition-colors border-none outline-none text-left">
          {title}
          <ChevronDown size={14} className="text-fg-subtle shrink-0 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden text-sm text-fg-muted leading-relaxed">
        <div className="px-4 pb-4">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  )
}
