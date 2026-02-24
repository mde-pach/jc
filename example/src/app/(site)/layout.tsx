import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/data-display/badge'
import { Layers, Github } from 'lucide-react'

const navLinks = [
  { href: '/docs/getting-started', label: 'Docs' },
  { href: '/showcase', label: 'Showcase' },
]

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-surface/85 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 no-underline">
            <span className="text-lg font-extrabold tracking-tight text-fg font-mono">jc</span>
            <Badge variant="info" pill>
              v0.1
            </Badge>
          </a>
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm font-medium text-fg-muted hover:text-fg rounded-md hover:bg-surface-overlay transition-colors no-underline"
              >
                {link.label}
              </a>
            ))}
            <div className="w-px h-5 bg-border mx-2" />
            <a
              href="https://github.com/mde-pach/jc"
              className="p-2 text-fg-subtle hover:text-fg transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={18} />
            </a>
          </div>
        </div>
      </nav>
      {children}
      <footer className="py-8 text-center text-sm text-fg-subtle border-t border-border">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-4 flex-wrap">
          <span>MIT Licensed</span>
          <span className="text-border">·</span>
          <a
            href="https://github.com/mde-pach/jc"
            className="text-fg-muted hover:text-fg no-underline transition-colors"
          >
            GitHub
          </a>
          <span className="text-border">·</span>
          <span>
            Built with <span className="font-semibold text-fg-muted font-mono">jc</span>
          </span>
        </div>
      </footer>
    </>
  )
}
