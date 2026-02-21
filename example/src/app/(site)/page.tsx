import { Badge } from '@/components/ui/data-display/badge'
import { Card } from '@/components/ui/data-display/card'
import { CodeBlock } from '@/components/ui/data-display/code-block'
import { IconButton } from '@/components/ui/actions/icon-button'
import { SectionHeader } from '@/components/ui/layout/section-header'
import { Steps, Step } from '@/components/ui/layout/steps'
import { Alert } from '@/components/ui/feedback/alert'
import { ArrowRight, BookOpen, Download, Layers, Palette, Code, Eye, Monitor, RefreshCw } from 'lucide-react'

const features = [
  {
    title: 'Zero Config',
    desc: 'Point at a directory, run one command. No stories, no addons, no setup files.',
    icon: Download,
  },
  {
    title: 'TypeScript-First',
    desc: 'Reads your prop interfaces directly. Enums become selects, booleans become toggles.',
    icon: Code,
  },
  {
    title: 'Fixture Plugins',
    desc: 'Swap text inputs for visual pickers — icons, badges, or any custom component.',
    icon: Layers,
  },
  {
    title: 'Theme Support',
    desc: 'Light, dark, or auto. Your components render in both modes instantly.',
    icon: Palette,
  },
  {
    title: 'Responsive Viewports',
    desc: 'Preview at 375px, 768px, 1280px, or full width — one click.',
    icon: Monitor,
  },
  {
    title: 'Watch Mode',
    desc: 'Re-extracts on save with 200ms debounce. Pairs with your dev server for instant feedback.',
    icon: RefreshCw,
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <header className="pt-24 pb-20 text-center relative bg-gradient-to-b from-gray-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.12)_1px,transparent_0)] bg-[length:32px_32px] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-6">
          <div className="mb-6">
            <Badge variant="success" pill>
              Now in public beta
            </Badge>
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.08] mb-5">
            Ship components,
            <br />
            not configuration.
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-lg mx-auto">
            jc auto-discovers your React components, reads TypeScript props, and generates an
            interactive playground. No stories. No addons.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/docs/getting-started" className="no-underline">
              <IconButton icon={BookOpen} variant="primary" size="lg">
                Get Started
              </IconButton>
            </a>
            <a href="/showcase" className="no-underline">
              <IconButton icon={Eye} variant="outline" size="lg">
                Try the Showcase
              </IconButton>
            </a>
          </div>
          <div className="mt-12">
            <CodeBlock code={'$ npx jc extract\n✓ Extracted 12 components in 340ms'} inline />
          </div>
        </div>
      </header>

      {/* How it works */}
      <section className="py-24 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6">
          <SectionHeader
            title="Up and running in 2 minutes"
            subtitle="Install the package, extract metadata from your TypeScript components, and render the showcase."
            badge={<Badge pill>3 steps</Badge>}
          />
          <Steps>
            <Step step={1} title="Install the package">
              <CodeBlock code="bun add jc" />
            </Step>
            <Step step={2} title="Extract component metadata">
              <CodeBlock code="npx jc extract" />
              <div className="mt-3">
                <Alert severity="info" title="Automatic detection">
                  Scans your TypeScript files, reads prop types, generates meta.json and registry.ts.
                </Alert>
              </div>
            </Step>
            <Step step={3} title="Render the showcase">
              <CodeBlock
                code={`<ShowcaseApp\n  meta={meta}\n  registry={registry}\n  fixtures={[lucideFixtures]}\n/>`}
              />
            </Step>
          </Steps>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50/70">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeader
            title="Everything auto-generated"
            subtitle="From prop controls to code snippets — jc does the work so you can focus on building."
            badge={<Badge variant="info" pill>Features</Badge>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Card key={f.title} elevated padding="md">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3b82f6',
                      marginBottom: '4px',
                    }}
                  >
                    <f.icon size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
                    {f.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                    {f.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code preview demo */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <SectionHeader
            title="Live code preview"
            subtitle="Every prop change generates copy-pasteable JSX in real time."
          />
          <Card elevated padding="lg">
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Preview
                </p>
                <div
                  style={{
                    padding: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconButton icon={Layers} variant="primary">
                    Favorite
                  </IconButton>
                </div>
              </div>
              <div style={{ flex: '1 1 280px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Generated code
                </p>
                <CodeBlock
                  code={`<IconButton\n  icon={Layers}\n  variant="primary"\n>\n  Favorite\n</IconButton>`}
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-50/70">
        <div className="max-w-xl mx-auto px-6 text-center">
          <SectionHeader
            title="Ready to try it?"
            subtitle="Read the docs or jump straight into the interactive showcase."
          />
          <div className="flex gap-3 justify-center">
            <a href="/docs/getting-started" className="no-underline">
              <IconButton icon={ArrowRight} variant="primary">
                Getting Started
              </IconButton>
            </a>
            <a href="/showcase" className="no-underline">
              <IconButton icon={Eye} variant="outline">
                Open Showcase
              </IconButton>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
