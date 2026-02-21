import type { ReactNode } from 'react'
import './globals.css'

export const metadata = {
  title: 'jc — just-components',
  description:
    'Zero-config component showcase for React. Auto-discovers your components, extracts TypeScript props, and generates an interactive playground.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 font-sans antialiased text-gray-900 bg-white">{children}</body>
    </html>
  )
}
