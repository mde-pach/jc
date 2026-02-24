import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Accordion, AccordionItem } from '@/components/ui/data-display/accordion'
import { Avatar } from '@/components/ui/data-display/avatar'
import { Badge } from '@/components/ui/data-display/badge'
import { Card } from '@/components/ui/data-display/card'
import { CodeBlock } from '@/components/ui/data-display/code-block'
import { DataTable } from '@/components/ui/data-display/data-table'
import { StatCard } from '@/components/ui/data-display/stat-card'
import { Toggle } from '@/components/ui/forms/toggle'
import { EmptyState } from '@/components/ui/layout/empty-state'
import { CommandButton } from '@/components/ui/actions/command-button'
import { IconButton } from '@/components/ui/actions/icon-button'
import {
  Eye,
  Zap,
  Package,
  Terminal,
  TrendingUp,
  TrendingDown,
  Sparkles,
  FileCode,
  Clock,
  FolderOpen,
  Github,
} from 'lucide-react'
import { HomepageShowcase } from './homepage-showcase'
import { InstallCommand, QuickstartDialog, NewsletterForm } from './landing-interactive'

const FEATURED_COMPONENT = 'IconButton'

function readComponentSource(displayName: string): { filePath: string; code: string } | null {
  try {
    const raw = readFileSync(join(process.cwd(), 'src/jc/generated/meta.json'), 'utf-8')
    const meta = JSON.parse(raw)
    const comp = meta.components?.find((c: { displayName: string }) => c.displayName === displayName)
    if (!comp) return null
    const code = readFileSync(join(process.cwd(), comp.filePath), 'utf-8')
    return { filePath: comp.filePath, code }
  } catch {
    return null
  }
}

export default function HomePage() {
  const source = readComponentSource(FEATURED_COMPONENT)
  return (
    <div>
      {/* ── Hero ────────────────────────────────────────────── */}
      <header className="pt-28 pb-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:32px_32px] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="info" pill>MIT Licensed</Badge>
            <Badge variant="outline" pill>v0.1</Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-fg leading-[1.1] mb-4">
            Your component playground.
            <br />
            <span className="text-fg-muted">Auto-generated.</span>
          </h1>
          <p className="text-base text-fg-subtle mb-10 leading-relaxed max-w-lg mx-auto">
            jc reads your TypeScript prop interfaces and generates an interactive showcase.
            No stories to write. No config to maintain.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <QuickstartDialog />
            <a href="/showcase" className="no-underline">
              <CommandButton icon={Eye} size="lg">
                Live demo
              </CommandButton>
            </a>
          </div>
          <div className="mt-8">
            <InstallCommand />
          </div>
        </div>
      </header>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-mono text-fg-subtle uppercase tracking-widest mb-8">How it works</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-8">
            <div className="flex flex-col">
              <p className="text-xs font-mono text-fg-subtle uppercase tracking-wider mb-3">
                {source?.filePath ?? 'Your component'}
              </p>
              <CodeBlock language="tsx" code={source?.code ?? ''} />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-mono text-fg-subtle uppercase tracking-wider mb-3">Generated showcase</p>
              <div className="rounded-xl border border-border overflow-hidden flex-1">
                <HomepageShowcase componentName={FEATURED_COMPONENT} />
              </div>
            </div>
          </div>

          <CodeBlock
            language="bash"
            code={`$ bunx jc extract
Scanning src/components/ui/**/*.tsx...

  actions/command-button.tsx   CommandButton   7 props  2 presets
  actions/icon-button.tsx      IconButton      3 props  3 presets
  data-display/stat-card.tsx   StatCard        6 props  3 presets
  forms/text-field.tsx         TextField       8 props  4 presets
  feedback/callout.tsx         Callout         4 props  4 presets
  ...

✓ 16 components extracted in 280ms
✓ Written to src/jc/generated/meta.json
✓ Written to src/jc/generated/registry.ts`}
          />
        </div>
      </section>

      {/* ── Why jc ──────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="lg" elevated>
              <div className="mb-3">
                <IconButton icon={Zap}>Instant</IconButton>
              </div>
              <h3 className="text-base font-semibold text-fg mb-2 m-0">No stories to write</h3>
              <p className="text-sm text-fg-subtle m-0 leading-relaxed">
                Your TypeScript interfaces are the source of truth. No <CodeBlock code=".stories.ts" inline />,
                no boilerplate, no duplication.
              </p>
            </Card>
            <Card padding="lg" elevated>
              <div className="mb-3">
                <IconButton icon={Terminal}>One command</IconButton>
              </div>
              <h3 className="text-base font-semibold text-fg mb-2 m-0">No separate process</h3>
              <p className="text-sm text-fg-subtle m-0 leading-relaxed">
                Runs alongside your dev server. One command extracts metadata, your existing bundler serves the page.
              </p>
            </Card>
            <Card padding="lg" elevated>
              <div className="mb-3">
                <IconButton icon={Sparkles}>Automatic</IconButton>
              </div>
              <h3 className="text-base font-semibold text-fg mb-2 m-0">Smart defaults</h3>
              <p className="text-sm text-fg-subtle m-0 leading-relaxed">
                Faker-powered prop values, icon pickers, light/dark themes, responsive viewports.
                Works out of the box.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Numbers ─────────────────────────────────────────── */}
      <section className="py-16 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Extraction time" value={280} trend="down" change="-40%" icon={Clock} tags={['ms']} />
            <StatCard label="Config files" value={0} trend="flat" icon={FileCode} />
            <StatCard label="Type accuracy" value={100} trend="up" change="+12%" icon={TrendingUp} tags={['%']} />
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-mono text-fg-subtle uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-2xl font-bold text-fg mb-10">Built for real-world component libraries</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="md">
              <h3 className="text-sm font-semibold text-fg mb-2 m-0">JSDoc-driven presets</h3>
              <p className="text-xs text-fg-subtle m-0 leading-relaxed mb-3">
                <CodeBlock code="@example" inline /> blocks become one-click presets.
                Wrapper components, default props, children — parsed from JSDoc you already write.
              </p>
              <CodeBlock
                language="tsx"
                code={`/**
 * @example
 * <Button variant="primary" size="lg">
 *   Save changes
 * </Button>
 */`}
              />
            </Card>
            <Card padding="md">
              <h3 className="text-sm font-semibold text-fg mb-2 m-0">Fixture plugins</h3>
              <p className="text-xs text-fg-subtle m-0 leading-relaxed mb-3">
                Register icon libraries or custom components as fixtures. Matching props get
                a visual picker automatically.
              </p>
              <CodeBlock
                language="tsx"
                code={`const icons = defineFixtures({
  name: 'lucide',
  fixtures: [
    { key: 'star', label: 'Star',
      render: () => <Star /> },
  ],
})`}
              />
            </Card>
            <Card padding="md">
              <h3 className="text-sm font-semibold text-fg mb-2 m-0">Shareable URLs</h3>
              <p className="text-xs text-fg-subtle m-0 leading-relaxed mb-3">
                Component and prop state is serialized into the URL.
                Share a link — it loads exactly as you left it.
              </p>
              <CodeBlock
                language="bash"
                code={`/showcase?component=Button#s=eyJwIjp7
  InZhcmlhbnQiOiJwcmltYXJ5In19`}
              />
            </Card>
          </div>
        </div>
      </section>

      {/* ── Comparison ──────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-mono text-fg-subtle uppercase tracking-widest mb-3">Comparison</p>
          <h2 className="text-2xl font-bold text-fg mb-10">Storybook vs. jc</h2>

          <div className="mb-8">
            <DataTable
              columns={['', 'Storybook', 'jc']}
              rows={[
                ['Config per component', 'stories.tsx + meta + argTypes', 'None'],
                ['Separate build process', 'Yes (webpack/vite)', 'No'],
                ['Type extraction', 'Manual argTypes', 'Automatic from TS'],
                ['Icon/component pickers', 'Custom addons', 'Built-in fixtures'],
                ['URL state sharing', 'Limited', 'Full prop serialization'],
                ['Bundle size', '~2MB', '~80KB'],
              ]}
              striped
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-mono text-fg-subtle uppercase tracking-wider mb-3">button.stories.tsx</p>
              <CodeBlock
                language="tsx"
                code={`import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { children: 'Click me', variant: 'primary' },
}`}
              />
            </div>
            <div>
              <p className="text-xs font-mono text-fg-subtle uppercase tracking-wider mb-3">with jc — nothing to write</p>
              <CodeBlock code="$ bunx jc extract" language="bash" />
              <div className="mt-4">
                <CodeBlock
                  language="tsx"
                  code={`// showcase/page.tsx
import { createShowcasePage } from 'jc/next'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default createShowcasePage({ meta, registry })`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Install ─────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-xs font-mono text-fg-subtle uppercase tracking-widest mb-3">Setup</p>
          <h2 className="text-2xl font-bold text-fg mb-10">Three steps, under a minute</h2>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-mono text-fg-subtle mb-2 m-0">1 — install</p>
              <CodeBlock code="bun add jc" language="bash" />
            </div>
            <div>
              <p className="text-xs font-mono text-fg-subtle mb-2 m-0">2 — extract</p>
              <CodeBlock code="bunx jc extract" language="bash" />
            </div>
            <div>
              <p className="text-xs font-mono text-fg-subtle mb-2 m-0">3 — render</p>
              <CodeBlock
                language="tsx"
                code={`import { createShowcasePage } from 'jc/next'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default createShowcasePage({ meta, registry })`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-mono text-fg-subtle uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-2xl font-bold text-fg mb-8">Common questions</h2>
          <Accordion type="single" collapsible>
            <AccordionItem value="what" title="What is jc?">
              A zero-config component showcase toolkit for React. It reads your TypeScript
              prop interfaces and generates an interactive playground — like Storybook,
              but without the stories.
            </AccordionItem>
            <AccordionItem value="frameworks" title="Which frameworks are supported?">
              Any React framework. Ships with a Next.js adapter (<CodeBlock code="jc/next" inline />),
              works with Vite, Remix, or any custom bundler setup.
            </AccordionItem>
            <AccordionItem value="types" title="How does it handle complex types?">
              jc uses TypeScript's type checker directly — not regex.
              Arrays (<CodeBlock code="string[]" inline />), objects, records, and structured types
              all get accurate extraction and the right editor controls.
            </AccordionItem>
            <AccordionItem value="migrate" title="Can I migrate from Storybook?">
              Yes. Delete your <CodeBlock code=".stories.tsx" inline /> files,
              run <CodeBlock code="bunx jc extract" inline />, and add a single showcase page.
              Your existing components don't need any changes.
            </AccordionItem>
            <AccordionItem value="ci" title="Does it work in CI?">
              Extraction runs as a CLI command — works anywhere Node runs.
              Add <CodeBlock code="bunx jc extract" inline /> to your build step to keep metadata
              in sync.
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* ── Maintainer ──────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <Avatar name="Maxime De Pachtere" size="lg" />
                <div>
                  <p className="text-sm font-semibold text-fg m-0">Maxime De Pachtere</p>
                  <p className="text-xs text-fg-subtle m-0">Creator</p>
                </div>
              </div>
              <p className="text-sm text-fg-subtle m-0 leading-relaxed">
                Built because writing stories for every component felt like busywork.
                If your types already describe your props, why repeat yourself?
              </p>
              <div className="mt-4">
                <a href="https://github.com/mde-pach/jc" className="no-underline">
                  <IconButton icon={Github}>Source on GitHub</IconButton>
                </a>
              </div>
            </Card>
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-4 h-full">
                <StatCard label="Tests passing" value={327} trend="up" change="+11" icon={TrendingUp} />
                <StatCard label="Bundle size" value={80} trend="down" change="-60%" icon={TrendingDown} tags={['KB']} />
                <StatCard label="Dependencies" value={2} trend="flat" icon={Package} tags={['react', 'faker']} />
                <StatCard label="Open issues" value={0} trend="flat" icon={FolderOpen} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Empty state / CTA ───────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <EmptyState
          icon={Eye}
          title="See it in action"
          description="Explore the live showcase — every component on this page is in there, extracted automatically."
          action={
            <div className="flex gap-3 flex-wrap justify-center">
              <a href="/showcase" className="no-underline">
                <CommandButton icon={Eye} variant="primary">Open showcase</CommandButton>
              </a>
              <a href="/docs/getting-started" className="no-underline">
                <CommandButton icon={Terminal}>Read the docs</CommandButton>
              </a>
            </div>
          }
        />
      </section>

      {/* ── Newsletter ──────────────────────────────────────── */}
      <section className="py-16 border-t border-border">
        <div className="max-w-xl mx-auto px-6 text-center">
          <p className="text-sm text-fg-muted mb-4">Get notified about releases</p>
          <NewsletterForm />
          <div className="mt-4 flex items-center justify-center gap-2">
            <Toggle label="Include changelogs" size="sm" checked />
          </div>
        </div>
      </section>
    </div>
  )
}
