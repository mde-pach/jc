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
        <CodeBlock code="bun add github:mde-pach/jc" language="bash" />
        <p className="text-sm text-fg-muted mt-3">
          Peer dependencies: <CodeBlock code="react" inline /> and <CodeBlock code="react-dom" inline /> (18+).
          Not on npm yet — install directly from GitHub.
        </p>
      </Section>

      <Section title="Extract">
        <CodeBlock code="bunx jc extract" language="bash" />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          Scans your component files, parses TypeScript prop interfaces via react-docgen-typescript,
          and writes two files into your configured <CodeBlock code="outputDir" inline />:
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
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Use <CodeBlock code="loadMeta()" inline /> to import the generated JSON — it handles the TypeScript cast for you:
        </p>
        <CodeBlock
          language="tsx"
          code={`// src/app/showcase/page.tsx
'use client'

import { ShowcaseApp, loadMeta } from 'jc'
import { registry } from '@/jc/generated/registry'
import metaJson from '@/jc/generated/meta.json'

const meta = loadMeta(metaJson)

export default function ShowcasePage() {
  return (
    <ShowcaseApp
      meta={meta}
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
        <p className="text-sm text-fg-muted mt-6 mb-3 leading-relaxed">
          Or use the Next.js adapter for zero boilerplate:
        </p>
        <CodeBlock
          language="tsx"
          code={`// src/app/showcase/page.tsx
import { createShowcasePage } from 'jc/next'
import metaJson from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default createShowcasePage({ meta: metaJson, registry })`}
        />
        <p className="text-sm text-fg-muted mt-3 leading-relaxed">
          <CodeBlock code="createShowcasePage()" inline /> wraps the client component automatically — no{' '}
          <CodeBlock code="'use client'" inline /> needed in your page file.
        </p>
      </Section>

      <Section title="Add plugins">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Props typed as React components (like <CodeBlock code="icon?: LucideIcon" inline />) need
          concrete values. Plugins provide them with visual pickers. The built-in Lucide plugin
          is zero-config — just import and pass it:
        </p>
        <CodeBlock
          language="tsx"
          code={`import { ShowcaseApp, loadMeta } from 'jc'
import { lucidePlugin } from 'jc/plugins/lucide'
import { registry } from '@/jc/generated/registry'
import metaJson from '@/jc/generated/meta.json'

const meta = loadMeta(metaJson)

export default function ShowcasePage() {
  return (
    <ShowcaseApp
      meta={meta}
      registry={registry}
      plugins={[lucidePlugin]}
    />
  )
}`}
        />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          <CodeBlock code="lucidePlugin" inline /> automatically matches props typed as{' '}
          <CodeBlock code="LucideIcon" inline /> and renders an icon picker with the full Lucide catalog.
          Requires <CodeBlock code="lucide-react" inline /> as a peer dependency.
        </p>
        <div className="mt-4">
          <Callout intent="info" title="Custom plugins">
            Need to support other icon libraries or design system components? Use{' '}
            <CodeBlock code="definePlugin()" inline /> from <CodeBlock code="jc" inline /> to build
            your own. See the Plugins documentation for details.
          </Callout>
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
