import type { ReactNode } from 'react'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

export const metadata = {
  title: 'jc — Zero-Config Component Showcase',
  description:
    'Auto-discovers your React components, reads TypeScript props, and generates an interactive playground. No stories. No addons.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} bg-surface text-fg font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
