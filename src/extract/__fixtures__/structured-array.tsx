import type { ReactNode } from 'react'

interface TabsProps {
  /** Array of tab definitions with ReactNode content */
  tabs: { label: string; content: ReactNode }[]
  defaultIndex?: number
}

export function Tabs({ tabs, defaultIndex = 0 }: TabsProps) {
  return (
    <div>
      {tabs.map((tab, i) => (
        <div key={tab.label}>{i === defaultIndex && tab.content}</div>
      ))}
    </div>
  )
}
