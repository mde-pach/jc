import type { ReactNode } from 'react'

export const metadata = {
  title: 'jc — just-components',
  description:
    'Zero-config component showcase for React. Auto-discovers your components, extracts TypeScript props, and generates an interactive playground.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          color: '#111827',
          backgroundColor: '#fff',
        }}
      >
        {children}
      </body>
    </html>
  )
}
