import { CodeBlock } from '@/components/ui/data-display/code-block'
import { Tabs } from '@/components/ui/data-display/tabs'
import { Alert } from '@/components/ui/feedback/alert'
import { LinkCard } from '@/components/ui/navigation/link-card'
import { FileCode } from 'lucide-react'

export default function FrameworksPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">Frameworks</h1>
      <p className="text-gray-500 text-lg mb-12 leading-relaxed">
        jc works with any React setup. Here&apos;s how to integrate it with popular frameworks.
      </p>

      <Section title="Next.js (App Router)">
        <Tabs
          tabs={[
            {
              label: 'Direct usage',
              content: (
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
              ),
            },
            {
              label: 'jc/next adapter',
              content: (
                <CodeBlock
                  code={`// src/app/showcase/page.tsx
'use client'

import { createShowcasePage } from 'jc/next'
import type { JcMeta } from 'jc'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default createShowcasePage({
  meta: meta as unknown as JcMeta,
  registry,
})`}
                />
              ),
            },
          ]}
        />

        <h3 className="text-base font-semibold text-gray-900 mb-3 mt-8">transpilePackages</h3>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          If your project uses{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">next.config.ts</code>, add{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">jc</code> to transpilePackages:
        </p>
        <CodeBlock
          code={`// next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: ['jc'],
}

export default nextConfig`}
        />
      </Section>

      <Section title="Vite">
        <CodeBlock
          code={`// src/showcase.tsx
import { ShowcaseApp } from 'jc'
import meta from './generated/meta.json'
import { registry } from './generated/registry'

function App() {
  return (
    <ShowcaseApp
      meta={meta}
      registry={registry}
    />
  )
}`}
        />
        <div className="mt-4">
          <Alert severity="info" title="Path aliases">
            If you use path aliases in Vite (e.g.{' '}
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">@/</code>), configure the
            same alias in your jc.config.ts so the generated registry imports resolve correctly.
          </Alert>
        </div>
      </Section>

      <Section title="Generic React setup">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          The ShowcaseApp component is framework-agnostic — it only needs React &gt;= 18. It works
          with Create React App, Remix, Astro (with React integration), or any custom setup:
        </p>
        <CodeBlock
          code={`import { ShowcaseApp } from 'jc'
import meta from './generated/meta.json'
import { registry } from './generated/registry'

function Showcase() {
  return <ShowcaseApp meta={meta} registry={registry} />
}`}
        />
      </Section>

      <Section title="'use client' explained">
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          The jc library ships with a{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">&apos;use client&apos;</code>{' '}
          directive at the top of its ESM bundle. This tells React Server Component frameworks
          (Next.js, Remix) that ShowcaseApp is a client component.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Your showcase page must also be a client component (or import ShowcaseApp in one) because
          the showcase uses React hooks, localStorage, and the History API — all browser-only features.
        </p>
      </Section>

      <div className="mt-14 flex gap-3">
        <LinkCard
          href="/docs/api"
          title="API Reference"
          icon={FileCode}
          direction="back"
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
