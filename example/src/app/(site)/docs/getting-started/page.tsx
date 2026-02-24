import { CodeBlock } from '@/components/ui/data-display/code-block'
import { DataTable } from '@/components/ui/data-display/data-table'
import { Callout } from '@/components/ui/feedback/callout'

export default function GettingStartedPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-fg mb-2">Getting Started</h1>
      <p className="text-fg-muted text-lg mb-12 leading-relaxed">
        From install to interactive showcase in under 2 minutes.
      </p>

      <Section title="Prerequisites">
        <ul className="list-disc pl-5 text-sm text-fg-muted space-y-1.5 leading-relaxed">
          <li>React 18+</li>
          <li>TypeScript 5+</li>
          <li>Node.js 18+ or Bun</li>
        </ul>
      </Section>

      <Section title="Install">
        <CodeBlock code="bun add jc" language="bash" />
        <p className="text-sm text-fg-muted mt-3">
          Peer dependencies: <CodeBlock code="react" inline /> and <CodeBlock code="react-dom" inline /> (18+).
        </p>
      </Section>

      <Section title="Extract">
        <CodeBlock code="bunx jc extract" language="bash" />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          Scans your component files (default: <CodeBlock code="src/components/ui/**/*.tsx" inline />),
          parses TypeScript prop interfaces via react-docgen-typescript, and writes two files:
        </p>
        <div className="mt-4">
          <DataTable
            columns={['File', 'Contents']}
            rows={[
              ['meta.json', 'Component names, prop types, defaults, descriptions, enum values, @example presets'],
              ['registry.ts', 'Lazy import() map keyed by component display name'],
            ]}
            monoFirstCol
          />
        </div>
      </Section>

      <Section title="Create your page">
        <CodeBlock
          language="tsx"
          code={`// src/app/showcase/page.tsx
'use client'

import type { JcMeta } from 'jc'
import { ShowcaseApp } from 'jc'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default function ShowcasePage() {
  return (
    <ShowcaseApp
      meta={meta as unknown as JcMeta}
      registry={registry}
    />
  )
}`}
        />
        <div className="mt-4">
          <Callout intent="info" title="Why 'use client'?">
            ShowcaseApp uses React hooks, localStorage, and history.replaceState. It must render in a client context.
          </Callout>
        </div>
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          Or use the Next.js adapter for zero boilerplate:
        </p>
        <div className="mt-3">
          <CodeBlock
            language="tsx"
            code={`// src/app/showcase/page.tsx
import { createShowcasePage } from 'jc/next'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default createShowcasePage({ meta, registry })`}
          />
        </div>
      </Section>

      <Section title="Add fixtures">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Props typed as React components (like <CodeBlock code="icon?: LucideIcon" inline />) need
          concrete values. Fixture plugins provide them with visual pickers.
        </p>
        <CodeBlock
          language="tsx"
          code={`import { defineFixtures } from 'jc'
import { Star, Heart, Zap, Download, Trash2 } from 'lucide-react'
import { createElement } from 'react'

function icon(Comp: typeof Star, size = 20) {
  return {
    render: () => createElement(Comp, { size }),
    renderIcon: () => createElement(Comp, { size: 14 }),
    component: Comp,
  }
}

export const lucideFixtures = defineFixtures({
  name: 'lucide',
  fixtures: [
    { key: 'star', label: 'Star', category: 'icons', ...icon(Star) },
    { key: 'heart', label: 'Heart', category: 'icons', ...icon(Heart) },
    { key: 'zap', label: 'Zap', category: 'icons', ...icon(Zap) },
    { key: 'download', label: 'Download', category: 'icons', ...icon(Download) },
    { key: 'trash', label: 'Trash', category: 'icons', ...icon(Trash2) },
  ],
})`}
        />
        <p className="text-sm text-fg-muted mt-4">
          Pass fixtures to ShowcaseApp:
        </p>
        <div className="mt-3">
          <CodeBlock
            language="tsx"
            code={`<ShowcaseApp
  meta={meta as unknown as JcMeta}
  registry={registry}
  fixtures={[lucideFixtures]}
/>`}
          />
        </div>
      </Section>

      <Section title="Watch mode">
        <CodeBlock code="bunx jc extract --watch" language="bash" />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          Watches your component files and re-extracts on save with 200ms debounce.
          Run alongside your dev server for instant feedback when you add or change props.
        </p>
      </Section>

      <Section title="What the showcase gives you">
        <DataTable
          columns={['Area', 'Description']}
          rows={[
            ['Sidebar', 'Searchable component list grouped by directory'],
            ['Preview', 'Live component render with checkered background'],
            ['Controls', 'Auto-generated prop editor — text, number, boolean, select, component picker'],
            ['Code output', 'Copy-pasteable JSX that updates as you change props'],
            ['Header', 'Theme toggle (auto/light/dark) and viewport picker (full/375/768/1280px)'],
          ]}
          monoFirstCol
        />
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-fg mb-5">{title}</h2>
      {children}
    </section>
  )
}
