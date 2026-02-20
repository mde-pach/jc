import type { ReactNode } from 'react'

/** A numbered step with a title and content — used for onboarding or how-it-works sections. */
export interface FeatureStepProps {
  /** Step number displayed in the circle */
  step: number
  /** Step title */
  title: string
  /** Step content */
  children: ReactNode
}

export function FeatureStep({ step, title, children }: FeatureStepProps) {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: '#eff6ff',
          color: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '14px',
          flexShrink: 0,
        }}
      >
        {step}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}
