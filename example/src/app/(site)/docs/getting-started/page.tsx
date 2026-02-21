import { CodeBlock } from '@/components/ui/data-display/code-block'
import { Tabs } from '@/components/ui/data-display/tabs'
import { PropsTable } from '@/components/ui/data-display/props-table'
import { Alert } from '@/components/ui/feedback/alert'
import { Steps, Step } from '@/components/ui/layout/steps'
import { LinkCard } from '@/components/ui/navigation/link-card'
import { Settings } from 'lucide-react'

export default function GettingStartedPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">Getting Started</h1>
      <p className="text-gray-500 text-lg mb-12 leading-relaxed">
        Install jc, extract component metadata, and launch your showcase in under 2 minutes.
      </p>

      <Section title="Prerequisites">
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1.5 leading-relaxed">
          <li>React &gt;= 18</li>
          <li>TypeScript &gt;= 5</li>
          <li>Node.js &gt;= 18 or Bun</li>
        </ul>
      </Section>

      <Section title="Quick start">
        <Steps>
          <Step step={1} title="Install the package">
            <Tabs
              tabs={[
                { label: 'bun', content: <CodeBlock code="bun add jc" /> },
                { label: 'npm', content: <CodeBlock code="npm install jc" /> },
                { label: 'pnpm', content: <CodeBlock code="pnpm add jc" /> },
              ]}
            />
            <p className="text-sm text-gray-500 mt-3">
              <strong>Peer dependencies:</strong>{' '}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">react &gt;= 18</code>,{' '}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">react-dom &gt;= 18</code>
            </p>
          </Step>

          <Step step={2} title="Extract component metadata">
            <CodeBlock code="npx jc extract" />
            <p className="text-sm text-gray-600 mt-4 leading-relaxed">
              This scans your component files (default:{' '}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">src/components/ui/**/*.tsx</code>),
              reads TypeScript prop types, and generates two files:
            </p>
            <div className="mt-4">
              <PropsTable
                columns={['File', 'Purpose']}
                rows={[
                  ['meta.json', 'Component names, props, types, defaults, descriptions, enum values'],
                  ['registry.ts', 'Lazy import() map for each component, keyed by display name'],
                ]}
              />
            </div>
          </Step>

          <Step step={3} title="Create a showcase page">
            <CodeBlock
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
              <Alert severity="info" title="Why 'use client'?">
                The showcase uses React hooks and browser APIs (localStorage, history). It must be a
                client component.
              </Alert>
            </div>
          </Step>
        </Steps>
      </Section>

      <Section title="Watch mode">
        <CodeBlock code="npx jc extract --watch" />
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">
          Watches your component files for changes and re-extracts automatically with a 200ms debounce.
          Pairs well with your dev server for instant feedback.
        </p>
      </Section>

      <Section title="What you get">
        <div className="space-y-2">
          {[
            ['Left sidebar', 'Searchable component list, grouped by directory'],
            ['Center', 'Live component preview with checkered background'],
            ['Right panel', 'Interactive prop controls (text, number, boolean, select, component picker)'],
            ['Bottom', 'Auto-generated JSX code snippet that updates as you tweak'],
            ['Header', 'Theme toggle (auto/light/dark) and viewport picker (full/375/768/1280px)'],
          ].map(([label, desc]) => (
            <div key={label} className="flex gap-3 text-sm">
              <span className="font-semibold text-gray-900 w-28 shrink-0">{label}</span>
              <span className="text-gray-600">{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="mt-14 flex gap-3">
        <LinkCard
          href="/docs/configuration"
          title="Configuration"
          description="Customize globs, path aliases, and prop filtering"
          icon={Settings}
          direction="forward"
        />
      </div>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-gray-900 mb-5">{title}</h2>
      {children}
    </section>
  )
}
