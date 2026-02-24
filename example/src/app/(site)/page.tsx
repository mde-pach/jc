import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Card } from '@/components/ui/data-display/card'
import { CodeBlock } from '@/components/ui/data-display/code-block'
import { CommandButton } from '@/components/ui/actions/command-button'
import { ArrowRight, Eye } from 'lucide-react'
import { HomepageShowcase } from './homepage-showcase'

/** The component to feature on the landing page */
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
      {/* Hero */}
      <header className="pt-28 pb-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:32px_32px] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-6">
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
            <a href="/docs/getting-started" className="no-underline">
              <CommandButton icon={ArrowRight} variant="primary" size="lg">
                Get started
              </CommandButton>
            </a>
            <a href="/showcase" className="no-underline">
              <CommandButton icon={Eye} size="lg">
                Open showcase
              </CommandButton>
            </a>
          </div>
          <div className="mt-12 inline-block">
            <code className="bg-surface-raised border border-border rounded-lg px-5 py-3 text-sm font-mono text-fg-muted">
              $ bunx jc extract
            </code>
          </div>
        </div>
      </header>

      {/* The Demo */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-mono text-fg-subtle uppercase tracking-widest mb-8">How it works</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-8">
            {/* Input: the real component source code */}
            <div className="flex flex-col">
              <p className="text-xs font-mono text-fg-subtle uppercase tracking-wider mb-3">
                {source?.filePath ?? 'Your component'}
              </p>
              <CodeBlock language="tsx" code={source?.code ?? ''} />
            </div>

            {/* Output: live jc showcase of that same component */}
            <div className="flex flex-col">
              <p className="text-xs font-mono text-fg-subtle uppercase tracking-wider mb-3">Generated showcase</p>
              <div className="rounded-xl border border-border overflow-hidden flex-1">
                <HomepageShowcase componentName={FEATURED_COMPONENT} />
              </div>
            </div>
          </div>

          {/* Terminal output */}
          <CodeBlock
            language="bash"
            code={`$ bunx jc extract
Scanning src/components/ui/**/*.tsx...

  buttons/button.tsx      Button      6 props  2 presets
  forms/text-field.tsx    TextField   8 props
  feedback/alert.tsx      Alert       5 props  wrapper:AlertRoot
  layout/card.tsx         Card        4 props
  data/table.tsx          DataTable   7 props
  ...

✓ 12 components extracted in 280ms
✓ Written to src/jc/generated/meta.json
✓ Written to src/jc/generated/registry.ts`}
          />
        </div>
      </section>

      {/* Three Pillars */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="lg">
              <h3 className="text-base font-semibold text-fg mb-2 m-0">No stories to write</h3>
              <p className="text-sm text-fg-subtle m-0 leading-relaxed">
                jc reads your existing TypeScript prop interfaces directly. No MDX, no{' '}
                <CodeBlock code=".stories.ts" inline />, no boilerplate per component.
              </p>
            </Card>
            <Card padding="lg">
              <h3 className="text-base font-semibold text-fg mb-2 m-0">No separate process</h3>
              <p className="text-sm text-fg-subtle m-0 leading-relaxed">
                Runs alongside your dev server. One command extracts metadata, your existing bundler
                serves the showcase page.
              </p>
            </Card>
            <Card padding="lg">
              <h3 className="text-base font-semibold text-fg mb-2 m-0">Smart defaults</h3>
              <p className="text-sm text-fg-subtle m-0 leading-relaxed">
                Faker-powered prop values, icon pickers via fixture plugins, light/dark theme
                switching. Works out of the box.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-mono text-fg-subtle uppercase tracking-widest mb-3">What you get</p>
          <h2 className="text-2xl font-bold text-fg mb-10">Built for real-world component libraries</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="md">
              <h3 className="text-sm font-semibold text-fg mb-2 m-0">JSDoc-driven examples</h3>
              <p className="text-xs text-fg-subtle m-0 leading-relaxed mb-3">
                Your <CodeBlock code="@example" inline /> blocks become one-click presets. Wrapper
                components, default props, children — all parsed from JSDoc you already write.
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
              <h3 className="text-sm font-semibold text-fg mb-2 m-0">Extensible fixture system</h3>
              <p className="text-xs text-fg-subtle m-0 leading-relaxed mb-3">
                Register icon libraries, custom components, or any React node as fixture plugins.
                Every matching prop gets a visual picker automatically.
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
              <h3 className="text-sm font-semibold text-fg mb-2 m-0">Shareable URL state</h3>
              <p className="text-xs text-fg-subtle m-0 leading-relaxed mb-3">
                Component selection and prop values are serialized into the URL. Share a link to a
                specific component with specific props — it loads exactly as you left it.
              </p>
              <CodeBlock
                language="bash"
                code={`/showcase?component=Button#
  variant=primary&size=lg`}
              />
            </Card>
          </div>
        </div>
      </section>

      {/* Before/After */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-mono text-fg-subtle uppercase tracking-widest mb-3">Comparison</p>
          <h2 className="text-2xl font-bold text-fg mb-10">The Storybook way vs. the jc way</h2>

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
    loading: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: { children: 'Click me', variant: 'default' },
}

export const Primary: Story = {
  args: { children: 'Click me', variant: 'primary' },
}`}
              />
            </div>
            <div>
              <p className="text-xs font-mono text-fg-subtle uppercase tracking-wider mb-3">with jc</p>
              <CodeBlock code="$ bunx jc extract" language="bash" />
              <div className="mt-4">
                <CodeBlock
                  language="tsx"
                  code={`// showcase/page.tsx — that's it
import { createShowcasePage } from 'jc/next'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default createShowcasePage({ meta, registry })`}
                />
              </div>
              <p className="text-sm text-fg-subtle mt-4">
                Props, controls, enums, defaults — all extracted from your existing TypeScript.
                No per-component config.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Install */}
      <section className="py-20 border-t border-border">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-xs font-mono text-fg-subtle uppercase tracking-widest mb-3">Install</p>
          <h2 className="text-2xl font-bold text-fg mb-10">Three steps</h2>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-mono text-fg-subtle mb-2 m-0">1 — add the package</p>
              <CodeBlock code="bun add jc" language="bash" />
            </div>
            <div>
              <p className="text-xs font-mono text-fg-subtle mb-2 m-0">2 — extract metadata</p>
              <CodeBlock code="bunx jc extract" language="bash" />
            </div>
            <div>
              <p className="text-xs font-mono text-fg-subtle mb-2 m-0">3 — render the showcase</p>
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

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-fg mb-3">Try it now</h2>
          <p className="text-fg-subtle mb-8">
            Read the docs or explore the live showcase built with these components.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/docs/getting-started" className="no-underline">
              <CommandButton icon={ArrowRight} variant="primary">
                Get started
              </CommandButton>
            </a>
            <a href="/showcase" className="no-underline">
              <CommandButton icon={Eye}>
                Open showcase
              </CommandButton>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
