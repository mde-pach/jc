import type { ReactNode } from 'react'

// ── Parent component (the wrapper) ──────────────────────────

interface AccordionProps {
  children: ReactNode
  type?: 'single' | 'multiple'
  collapsible?: boolean
}

export function Accordion({ children }: AccordionProps) {
  return <div data-accordion>{children}</div>
}

// ── Child component with @example on the function ───────────

interface AccordionItemProps {
  value: string
  title: string
  children: ReactNode
}

/**
 * A single accordion item.
 *
 * @example
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="item-1" title="Section 1">Content</AccordionItem>
 * </Accordion>
 *
 * @example
 * <Accordion type="multiple">
 *   <AccordionItem value="faq-1" title="FAQ">Answer here</AccordionItem>
 * </Accordion>
 */
export function AccordionItem({ value, title, children }: AccordionItemProps) {
  return (
    <div data-value={value}>
      <h3>{title}</h3>
      {children}
    </div>
  )
}

// ── Standalone component (no wrapper needed) ────────────────

/**
 * A simple button.
 *
 * @example
 * <StandaloneButton label="Click me" />
 */
export function StandaloneButton({ label }: { label: string }) {
  return <button type="button">{label}</button>
}
