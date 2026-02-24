import { type ComponentType, type ReactNode, forwardRef, memo } from 'react'

// ── forwardRef component ─────────────────────────────────────

interface ForwardRefProps {
  variant?: 'solid' | 'outline' | 'ghost'
  icon?: ComponentType<{ size?: number }>
  children?: ReactNode
}

export const ForwardRefButton = forwardRef<HTMLButtonElement, ForwardRefProps>(
  ({ variant, icon, children }, ref) => {
    return (
      <button type="button" ref={ref} data-variant={variant}>
        {children}
      </button>
    )
  },
)
ForwardRefButton.displayName = 'ForwardRefButton'

// ── memo component ───────────────────────────────────────────

interface MemoProps {
  title: string
  size?: 'sm' | 'md' | 'lg'
}

export const MemoCard = memo(({ title, size }: MemoProps) => {
  return <div data-size={size}>{title}</div>
})
MemoCard.displayName = 'MemoCard'
