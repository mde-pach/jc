'use client'

import { type ReactNode, useState } from 'react'

/** A tabbed content switcher with inline tab bar. */
export interface TabsProps {
  /** Tab definitions — each must have a unique label */
  tabs: { label: string; content: ReactNode }[]
  /** Index of the initially active tab */
  defaultIndex?: number
}

export function Tabs({ tabs, defaultIndex = 0 }: TabsProps) {
  const [active, setActive] = useState(defaultIndex)

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '2px',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '16px',
        }}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(i)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: i === active ? '#1e40af' : '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: i === active ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active]?.content}</div>
    </div>
  )
}
