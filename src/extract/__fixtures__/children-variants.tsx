import type { PropsWithChildren, ReactNode } from 'react'

// ── Explicit children prop ───────────────────────────────────

interface ExplicitChildrenProps {
  title: string
  children?: ReactNode
}

export function ExplicitChildren({ title, children }: ExplicitChildrenProps) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

// ── PropsWithChildren wrapper ────────────────────────────────

interface BaseCardProps {
  variant?: 'default' | 'outlined'
}

export function CardWithChildren({ variant, children }: PropsWithChildren<BaseCardProps>) {
  return <div data-variant={variant}>{children}</div>
}

// ── No children at all ───────────────────────────────────────

interface NoChildrenProps {
  value: number
  label: string
}

export function NoChildren({ value, label }: NoChildrenProps) {
  return (
    <span>
      {label}: {value}
    </span>
  )
}
