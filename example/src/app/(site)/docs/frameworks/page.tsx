import { CodeBlock } from '@/components/ui/data-display/code-block'
import { Callout } from '@/components/ui/feedback/callout'
import { Badge } from '@/components/ui/data-display/badge'

export default function FrameworksPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-fg mb-2">Frameworks</h1>
      <p className="text-fg-muted text-lg mb-12 leading-relaxed">
        jc works with any React 18+ project. Framework-specific setup below.
      </p>

      <Section title="Next.js" badge="Recommended">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          The <CodeBlock code="jc/next" inline /> adapter creates a showcase page with zero
          boilerplate:
        </p>
        <CodeBlock
          language="tsx"
          code={`// src/app/showcase/page.tsx
import { createShowcasePage } from 'jc/next'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'
import { lucideFixtures } from './fixtures'

export default createShowcasePage({
  meta,
  registry,
  fixtures: [lucideFixtures],
})`}
        />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          Or set it up manually if you need more control:
        </p>
        <div className="mt-3">
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
        </div>
        <div className="mt-4">
          <Callout intent="info" title="App Router only">
            The <CodeBlock code="createShowcasePage" inline /> adapter targets the App Router.
            For Pages Router, use the manual setup above.
          </Callout>
        </div>
      </Section>

      <Section title="Vite">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Create a standard React component and mount it in your router:
        </p>
        <CodeBlock
          language="tsx"
          code={`// src/showcase.tsx
import type { JcMeta } from 'jc'
import { ShowcaseApp } from 'jc'
import meta from './jc/generated/meta.json'
import { registry } from './jc/generated/registry'

export function Showcase() {
  return (
    <ShowcaseApp
      meta={meta as unknown as JcMeta}
      registry={registry}
    />
  )
}`}
        />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          Mount it with React Router, TanStack Router, or any routing solution.
        </p>
      </Section>

      <Section title="Other frameworks">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          For any React 18+ project with a bundler that supports dynamic imports:
        </p>
        <CodeBlock
          language="tsx"
          code={`import type { JcMeta } from 'jc'
import { ShowcaseApp } from 'jc'
import meta from './jc/generated/meta.json'
import { registry } from './jc/generated/registry'

function App() {
  return (
    <ShowcaseApp
      meta={meta as unknown as JcMeta}
      registry={registry}
    />
  )
}`}
        />
      </Section>

      <Section title="Client component requirement">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          ShowcaseApp uses React hooks, browser APIs (<CodeBlock code="localStorage" inline />,{' '}
          <CodeBlock code="history.replaceState" inline />), and dynamic imports. It must render in a
          client context.
        </p>
        <Callout intent="warning" title="Next.js">
          Add <CodeBlock code="'use client'" inline /> at the top of any file that renders ShowcaseApp.
          The jc package ships with the directive injected via a post-build step, but your page file
          needs it too.
        </Callout>
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          In Vite and other SPA frameworks, everything is client-side by default — no directive needed.
        </p>
      </Section>
    </article>
  )
}

function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-5">
        <h2 className="text-xl font-bold text-fg m-0">{title}</h2>
        {badge && <Badge variant="success" pill>{badge}</Badge>}
      </div>
      {children}
    </section>
  )
}
