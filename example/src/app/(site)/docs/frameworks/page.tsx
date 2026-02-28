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

      <Section title="Next.js (App Router)" badge="Recommended">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          The <CodeBlock code="jc/next" inline /> adapter creates a showcase page with zero
          boilerplate. Pass the raw JSON import — <CodeBlock code="loadMeta()" inline /> is called
          internally:
        </p>
        <CodeBlock
          language="tsx"
          code={`// app/showcase/page.tsx
import { createShowcasePage } from 'jc/next'
import { lucidePlugin } from 'jc/plugins/lucide'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default createShowcasePage({
  meta,
  registry,
  plugins: [lucidePlugin],
})`}
        />
        <div className="mt-4">
          <Callout intent="info" title="App Router only">
            The <CodeBlock code="createShowcasePage" inline /> adapter targets the Next.js App
            Router. For Pages Router, use the manual setup pattern below.
          </Callout>
        </div>
      </Section>

      <Section title="Vite / CRA / Plain React">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          The <CodeBlock code="jc/react" inline /> adapter creates a ready-to-mount component.
          Mount it with React Router, TanStack Router, or any routing solution:
        </p>
        <CodeBlock
          language="tsx"
          code={`// src/showcase.tsx
import { createShowcase } from 'jc/react'
import { lucidePlugin } from 'jc/plugins/lucide'
import meta from './jc/generated/meta.json'
import { registry } from './jc/generated/registry'

const Showcase = createShowcase({
  meta,
  registry,
  plugins: [lucidePlugin],
})

export default Showcase`}
        />
      </Section>

      <Section title="Manual setup (any framework)">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Use <CodeBlock code="ShowcaseApp" inline /> directly for full control. Call{' '}
          <CodeBlock code="loadMeta()" inline /> on the raw JSON import — this replaces the old{' '}
          <CodeBlock code="as unknown as JcMeta" inline /> cast:
        </p>
        <CodeBlock
          language="tsx"
          code={`'use client'
import { ShowcaseApp, loadMeta } from 'jc'
import { lucidePlugin } from 'jc/plugins/lucide'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default function ShowcasePage() {
  return (
    <ShowcaseApp
      meta={loadMeta(meta)}
      registry={registry}
      plugins={[lucidePlugin]}
    />
  )
}`}
        />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          This pattern also works for Remix — <CodeBlock code="jc extract" inline /> auto-detects
          the Remix framework, but the showcase page itself uses manual setup since there is no
          dedicated Remix adapter.
        </p>
      </Section>

      <Section title="Adapter props">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          All three adapters (<CodeBlock code="createShowcasePage" inline />,{' '}
          <CodeBlock code="createShowcase" inline />, <CodeBlock code="ShowcaseApp" inline />) accept
          the same options:
        </p>
        <CodeBlock
          language="tsx"
          code={`{
  meta:               // raw JSON import (adapters call loadMeta() internally)
                      // or the result of loadMeta(meta) for manual setup
  registry:           // component registry from generated/registry
  plugins?:           // fixture/icon plugins, e.g. [lucidePlugin]
  wrapper?:           // optional React component to wrap every preview
  initialComponent?:  // component name to select on first load
  syncUrl?:           // sync state to URL (default: true)
}`}
        />
      </Section>

      <Section title="Client component requirement">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          ShowcaseApp uses React hooks, browser APIs (<CodeBlock code="localStorage" inline />,{' '}
          <CodeBlock code="history.replaceState" inline />), and dynamic imports. It must render in a
          client context.
        </p>
        <Callout intent="warning" title="Next.js manual setup">
          Add <CodeBlock code="'use client'" inline /> at the top of any file that renders{' '}
          <CodeBlock code="ShowcaseApp" inline /> directly. The{' '}
          <CodeBlock code="createShowcasePage" inline /> adapter handles this automatically.
        </Callout>
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          In Vite and other SPA frameworks, everything is client-side by default — no directive
          needed.
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
