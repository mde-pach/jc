import { Alert } from '@/components/ui/alert'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const section: React.CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
  padding: '0 24px',
}

const code: React.CSSProperties = {
  fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
  fontSize: '13px',
  lineHeight: 1.7,
  backgroundColor: '#1e1e2e',
  color: '#cdd6f4',
  borderRadius: '10px',
  padding: '20px 24px',
  overflow: 'auto',
  border: '1px solid #313244',
}

const inlineCode: React.CSSProperties = {
  fontFamily: '"SF Mono", "Fira Code", Menlo, monospace',
  fontSize: '0.85em',
  backgroundColor: '#f3f4f6',
  padding: '2px 6px',
  borderRadius: '4px',
  color: '#e11d48',
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
      <h2 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
        {children}
      </h2>
      {sub && (
        <p
          style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0,
            maxWidth: '560px',
            marginInline: 'auto',
          }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre style={code}>
      <code>{children}</code>
    </pre>
  )
}

export default function Home() {
  return (
    <div>
      {/* ─── Hero ─── */}
      <header
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '64px 24px',
          background: 'linear-gradient(180deg, #f8fafc 0%, #fff 50%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '20px' }}>
            <Badge variant="info" pill>
              Open Source
            </Badge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 64px)',
              fontWeight: 800,
              margin: '0 0 16px',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            just-components
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: '#6b7280',
              margin: '0 0 40px',
              maxWidth: '520px',
              lineHeight: 1.6,
            }}
          >
            Zero-config component showcase for React.
            <br />
            Point it at your components, run one command,
            <br />
            get an interactive playground.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/showcase" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg">
                Open Showcase
              </Button>
            </a>
            <a href="#get-started" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="lg">
                Get Started
              </Button>
            </a>
          </div>

          <div style={{ marginTop: '32px' }}>
            <pre
              style={{
                display: 'inline-block',
                ...code,
                padding: '12px 20px',
                fontSize: '14px',
              }}
            >
              <code>npx jc extract && open /showcase</code>
            </pre>
          </div>
        </div>
      </header>

      {/* ─── Why jc ─── */}
      <section style={{ padding: '96px 0', background: '#fff' }}>
        <div style={section}>
          <SectionTitle sub="No stories to write, no addons to configure. jc reads your TypeScript types and does the rest.">
            A simpler alternative to Storybook
          </SectionTitle>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            <Card
              title="Zero Config"
              description="Scans your component directory and generates everything automatically."
              elevated
            >
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Badge variant="success">Auto-extract</Badge>
                <Badge variant="success">TypeScript</Badge>
                <Badge variant="success">Smart defaults</Badge>
              </div>
            </Card>

            <Card
              title="TypeScript Native"
              description="Reads your prop interfaces and generates controls from actual types."
              elevated
            >
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Badge variant="info">Enums</Badge>
                <Badge variant="info">Booleans</Badge>
                <Badge variant="info">Components</Badge>
              </div>
            </Card>

            <Card
              title="Framework Agnostic"
              description="Works with Next.js, Vite, Remix — anything React >= 18."
              elevated
            >
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Badge>Next.js</Badge>
                <Badge>Vite</Badge>
                <Badge>Remix</Badge>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Get Started ─── */}
      <section id="get-started" style={{ padding: '96px 0', background: '#f8fafc' }}>
        <div style={section}>
          <SectionTitle sub="Three steps to a full interactive playground.">Quick Start</SectionTitle>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '40px',
              maxWidth: '640px',
              margin: '0 auto',
            }}
          >
            {/* Step 1 */}
            <div>
              <StepHeader n={1} title="Install" />
              <CodeBlock>{`bun add jc\n# or: npm install jc`}</CodeBlock>
            </div>

            {/* Step 2 */}
            <div>
              <StepHeader n={2} title="Extract" />
              <CodeBlock>{`npx jc extract`}</CodeBlock>
              <div style={{ marginTop: '12px' }}>
                <Alert severity="info" title="What happens here?">
                  jc scans your <span style={inlineCode}>src/components/ui/**/*.tsx</span> files, reads
                  TypeScript prop types, and generates <span style={inlineCode}>meta.json</span> +{' '}
                  <span style={inlineCode}>registry.ts</span>.
                </Alert>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <StepHeader n={3} title="Add a page" />
              <CodeBlock>{`// src/app/showcase/page.tsx
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
}`}</CodeBlock>
              <div style={{ marginTop: '12px' }}>
                <Alert severity="success" title="That's it!">
                  Open <span style={inlineCode}>/showcase</span> in your browser. No stories, no config
                  files, no addons.
                </Alert>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Component Gallery ─── */}
      <section style={{ padding: '96px 0', background: '#fff' }}>
        <div style={section}>
          <SectionTitle sub="Every component below was auto-discovered by jc. Click the button at the bottom to inspect them all in the interactive showcase.">
            Live Component Gallery
          </SectionTitle>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Button showcase */}
            <Card title="Button" description="6 variants, 3 sizes, full-width support" padding="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button variant="primary" size="sm">
                    Primary
                  </Button>
                  <Button variant="secondary" size="sm">
                    Secondary
                  </Button>
                  <Button variant="destructive" size="sm">
                    Destructive
                  </Button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button variant="outline" size="sm">
                    Outline
                  </Button>
                  <Button variant="ghost" size="sm">
                    Ghost
                  </Button>
                  <Button variant="default" size="sm" disabled>
                    Disabled
                  </Button>
                </div>
              </div>
            </Card>

            {/* Alert showcase */}
            <Card title="Alert" description="4 severity levels, dismissible option" padding="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Alert severity="info">Informational message</Alert>
                <Alert severity="success">Operation successful</Alert>
                <Alert severity="warning">Proceed with caution</Alert>
              </div>
            </Card>

            {/* Badge showcase */}
            <Card title="Badge" description="5 color variants, pill or square" padding="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Badge variant="default">Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Badge variant="success" pill>
                    Active
                  </Badge>
                  <Badge variant="error" pill>
                    Archived
                  </Badge>
                  <Badge variant="info" pill>
                    v0.1.0
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Avatar showcase */}
            <Card title="Avatar" description="Image or initials, 3 sizes, 2 shapes" padding="md">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Avatar name="Alice Martin" size="lg" />
                <Avatar name="Bob Chen" size="md" />
                <Avatar name="Clara D" size="sm" />
                <Avatar name="Dev Team" size="md" shape="square" />
              </div>
            </Card>

            {/* Input showcase */}
            <Card title="Input" description="Labels, types, error states, required" padding="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Input label="Email" placeholder="you@example.com" type="email" />
                <Input label="Password" type="password" error="Too short" required />
              </div>
            </Card>

            {/* Card meta showcase */}
            <Card title="Card" description="You're looking at one right now" padding="md" elevated>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
                  Every section on this page uses the <span style={inlineCode}>{'<Card />'}</span>{' '}
                  component. This is the meta demo — the landing page is built with the same components
                  you can inspect in the showcase.
                </p>
                <div>
                  <Badge variant="info" pill>
                    Meta
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Features grid ─── */}
      <section style={{ padding: '96px 0', background: '#f8fafc' }}>
        <div style={section}>
          <SectionTitle sub="Everything you need, nothing you don't.">Features</SectionTitle>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {[
              {
                title: 'Prop Controls',
                desc: 'Text, number, boolean, select, component picker — auto-generated from your TypeScript interfaces.',
              },
              {
                title: 'Live Code Preview',
                desc: 'See the JSX snippet update in real-time as you tweak props. Copy and paste into your project.',
              },
              {
                title: 'Theme Toggle',
                desc: 'Switch between light, dark, and auto themes. Test your components in both modes.',
              },
              {
                title: 'Viewport Preview',
                desc: 'Resize the preview to 375px, 768px, 1280px or full width. Responsive testing built in.',
              },
              {
                title: 'Fixture Plugins',
                desc: 'Provide real icons, badges, or any component for component-type props. Renders actual elements, not placeholder text.',
              },
              {
                title: 'Watch Mode',
                desc: 'Run jc extract --watch and metadata regenerates automatically when you save a component file.',
              },
              {
                title: 'URL Persistence',
                desc: 'Selected component persists in the ?component= query param. Share direct links to specific components.',
              },
              {
                title: 'Directory Grouping',
                desc: 'Components are grouped by directory in the sidebar. Organize by feature, not alphabetically.',
              },
              {
                title: 'Wrapper Prop',
                desc: 'Inject ThemeProvider, TooltipProvider, or any context your components need via the wrapper prop.',
              },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                }}
              >
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600 }}>{f.title}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Meta CTA ─── */}
      <section style={{ padding: '96px 0', background: '#fff' }}>
        <div style={section}>
          <div
            style={{
              textAlign: 'center',
              padding: '64px 32px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <Badge variant="success" pill>
                Meta Demo
              </Badge>
            </div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                margin: '0 0 12px',
                letterSpacing: '-0.02em',
              }}
            >
              See these components in the showcase
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: '#6b7280',
                margin: '0 0 32px',
                maxWidth: '480px',
                marginInline: 'auto',
                lineHeight: 1.6,
              }}
            >
              Every <span style={inlineCode}>{'<Button />'}</span>,{' '}
              <span style={inlineCode}>{'<Card />'}</span>,{' '}
              <span style={inlineCode}>{'<Alert />'}</span>, and{' '}
              <span style={inlineCode}>{'<Badge />'}</span> on this page was auto-discovered by jc. Open
              the showcase to inspect their props, tweak values, and copy JSX snippets.
            </p>
            <a href="/showcase" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg">
                Open Interactive Showcase
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          color: '#9ca3af',
          fontSize: '13px',
        }}
      >
        <p style={{ margin: 0 }}>
          Built with{' '}
          <a
            href="https://github.com/mde-pach/jc"
            style={{ color: '#6b7280', textDecoration: 'underline' }}
          >
            jc
          </a>{' '}
          — just-components
        </p>
      </footer>
    </div>
  )
}

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {n}
      </div>
      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{title}</h3>
    </div>
  )
}
