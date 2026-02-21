import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/data-display/badge'
import { IconButton } from '@/components/ui/actions/icon-button'
import { BookOpen, Github, Layers } from 'lucide-react'

const navLinks = [
  { href: '/docs/getting-started', label: 'Docs' },
  { href: '/docs/api', label: 'API' },
]

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 no-underline">
            <span className="text-lg font-extrabold tracking-tight text-gray-900">jc</span>
            <Badge variant="info" pill>
              v0.1
            </Badge>
          </a>
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors no-underline"
              >
                {link.label}
              </a>
            ))}
            <div className="w-px h-5 bg-gray-200 mx-1.5" />
            <a href="/showcase" className="no-underline">
              <IconButton icon={Layers} variant="primary" size="sm">
                Showcase
              </IconButton>
            </a>
            <a
              href="https://github.com/mde-pach/jc"
              className="no-underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconButton icon={Github} variant="ghost" size="sm">
                GitHub
              </IconButton>
            </a>
          </div>
        </div>
      </nav>
      {children}
      <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-4 flex-wrap">
          <span>MIT Licensed</span>
          <span className="text-gray-200">·</span>
          <a
            href="https://github.com/mde-pach/jc"
            className="text-gray-500 hover:text-gray-700 no-underline"
          >
            GitHub
          </a>
          <span className="text-gray-200">·</span>
          <span>
            Built with <span className="font-semibold text-gray-600">jc</span>
          </span>
        </div>
      </footer>
    </>
  )
}
