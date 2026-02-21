import type { ReactNode } from 'react'

/** A numbered step in a vertical sequence — used for tutorials and guides. */
export interface StepsProps {
  /** The step items to render */
  children: ReactNode
}

/** Container for a vertical list of numbered steps. */
export function Steps({ children }: StepsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {children}
    </div>
  )
}

/** A single numbered step with a title and content body. */
export interface StepProps {
  /** Step number displayed in the circle */
  step: number
  /** Step title */
  title: string
  /** Step content body */
  children: ReactNode
}

export function Step({ step, title, children }: StepProps) {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px',
        }}
      >
        {step}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            margin: '0 0 8px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#1e293b',
          }}
        >
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}
