import type { ReactNode } from 'react'

const sections = [
  { href: '/docs/getting-started', label: 'Getting Started' },
  { href: '/docs/configuration', label: 'Configuration' },
  { href: '/docs/fixtures', label: 'Fixtures' },
  { href: '/docs/api', label: 'API Reference' },
  { href: '/docs/frameworks', label: 'Frameworks' },
]

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-6 flex gap-12 py-12 min-h-[calc(100vh-56px-73px)]">
      <aside className="hidden md:block w-48 shrink-0">
        <nav className="sticky top-[80px] flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3 px-3">
            Docs
          </span>
          {sections.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="px-3 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors no-underline"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 max-w-3xl">{children}</main>
    </div>
  )
}
