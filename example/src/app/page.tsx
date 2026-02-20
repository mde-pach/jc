import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CodeBlock } from '@/components/ui/code-block'
import { FeatureStep } from '@/components/ui/feature-step'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { PricingCard } from '@/components/ui/pricing-card'
import { SectionHeader } from '@/components/ui/section-header'
import { StatCard } from '@/components/ui/stat-card'
import { TestimonialCard } from '@/components/ui/testimonial-card'
import {
  ArrowRight,
  Download,
  Eye,
  Heart,
  Mail,
  Search,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

/* ── Shared styles ── */

const wrap: React.CSSProperties = {
  maxWidth: '1080px',
  margin: '0 auto',
  padding: '0 24px',
}

const ic: React.CSSProperties = {
  fontFamily: '"SF Mono", Menlo, monospace',
  fontSize: '0.85em',
  backgroundColor: '#f1f5f9',
  padding: '2px 6px',
  borderRadius: '4px',
  color: '#0f172a',
}

/* ── Page ── */

export default function Home() {
  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* ━━ Nav ━━ */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div
          style={{
            ...wrap,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.04em' }}>jc</span>
            <Badge variant="info" pill>
              v0.1
            </Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <a href="#features" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm">Features</Button>
            </a>
            <a href="#pricing" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm">Pricing</Button>
            </a>
            <a href="#team" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm">Team</Button>
            </a>
            <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0', margin: '0 4px' }} />
            <a href="/showcase" style={{ textDecoration: 'none' }}>
              <IconButton icon={Eye} variant="primary" size="sm">
                Showcase
              </IconButton>
            </a>
          </div>
        </div>
      </nav>

      {/* ━━ Hero ━━ */}
      <header
        style={{
          padding: '120px 24px 96px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)',
            backgroundSize: '32px 32px',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <Badge variant="success" pill>Now in public beta</Badge>
          </div>
          <h1
            style={{
              fontSize: 'clamp(36px, 5.5vw, 60px)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              margin: '0 0 20px',
              color: '#0f172a',
            }}
          >
            Ship components,
            <br />
            not configuration.
          </h1>
          <p style={{ fontSize: '18px', color: '#64748b', margin: '0 0 36px', lineHeight: 1.6 }}>
            jc auto-discovers your React components, reads TypeScript props,
            and generates an interactive playground. No stories. No addons.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/showcase" style={{ textDecoration: 'none' }}>
              <IconButton icon={Zap} variant="primary" size="lg">
                Try the Showcase
              </IconButton>
            </a>
            <a href="https://github.com/mde-pach/jc" style={{ textDecoration: 'none' }}>
              <IconButton icon={Star} variant="outline" size="lg">
                Star on GitHub
              </IconButton>
            </a>
          </div>
          <div style={{ marginTop: '40px' }}>
            <CodeBlock code={'$ npx jc extract\n✓ Extracted 13 components in 340ms'} inline />
          </div>
        </div>
      </header>

      {/* ━━ Stats strip ━━ */}
      <section style={{ padding: '64px 0', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ ...wrap, display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <StatCard label="Components" value="13" icon={Zap} trend="neutral" />
          <StatCard label="Tests" value="93" icon={Shield} trend="up" trendText="100% pass" />
          <StatCard label="Config files" value="0" icon={Star} trend="neutral" />
          <StatCard label="Bundle (UI)" value="12kb" icon={Download} trend="down" trendText="gzipped" />
        </div>
      </section>

      {/* ━━ Features ━━ */}
      <section id="features" style={{ padding: '96px 0', background: '#f8fafc' }}>
        <div style={wrap}>
          <SectionHeader
            title="Everything auto-generated"
            subtitle="From prop controls to code snippets — jc does the work so you can focus on building."
            badge={<Badge variant="info" pill>Features</Badge>}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            <Card title="Prop Controls" description="Auto-generated from your TypeScript interfaces." elevated padding="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Input label="Title" placeholder="Enter a title..." />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <Badge variant="info">text</Badge>
                  <Badge variant="info">number</Badge>
                  <Badge variant="info">boolean</Badge>
                  <Badge variant="info">select</Badge>
                  <Badge variant="info">icon</Badge>
                </div>
              </div>
            </Card>

            <Card title="Icon Fixtures" description="Lucide, Heroicons, or any icon set — visual picker built-in." elevated padding="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[Star, Heart, Zap, Search, Mail, Shield, Users, TrendingUp, Download].map(
                    (Icon, i) => (
                      <div
                        key={i}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: i === 0 ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                          backgroundColor: i === 0 ? '#eff6ff' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: i === 0 ? '#3b82f6' : '#94a3b8',
                        }}
                      >
                        <Icon size={16} />
                      </div>
                    ),
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Code preview outputs <span style={ic}>{'<Star />'}</span> — not raw keys.
                </p>
              </div>
            </Card>

            <Card title="Live Code Preview" description="Copy-pasteable JSX that updates as you tweak." elevated padding="md">
              <CodeBlock code={'<IconButton\n  icon={Star}\n  variant="primary"\n>\n  Favorite\n</IconButton>'} />
            </Card>

            <Card title="Responsive Preview" description="Test at 375, 768, 1280px or full width." elevated padding="md">
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Full', '375', '768', '1280'].map((w) => (
                  <Button key={w} variant={w === '375' ? 'primary' : 'secondary'} size="sm">
                    {w === 'Full' ? 'Full' : `${w}px`}
                  </Button>
                ))}
              </div>
            </Card>

            <Card title="Theme Support" description="Light, dark, or auto — toggle in the header." elevated padding="md">
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    border: '2px solid #3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  Light
                </div>
                <div
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#e2e8f0',
                  }}
                >
                  Dark
                </div>
              </div>
            </Card>

            <Card title="Watch Mode" description="Re-extracts on save with 200ms debounce." elevated padding="md">
              <CodeBlock code={'$ jc extract --watch\n✓ Watching src/components/ui/**/*.tsx\n⟳ button.tsx changed — re-extracting...\n✓ Done in 180ms'} />
            </Card>
          </div>
        </div>
      </section>

      {/* ━━ How it works ━━ */}
      <section style={{ padding: '96px 0', background: '#fff' }}>
        <div style={wrap}>
          <SectionHeader
            title="Up and running in 2 minutes"
            badge={<Badge pill>3 steps</Badge>}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '600px', margin: '0 auto' }}>
            <FeatureStep step={1} title="Install the package">
              <CodeBlock code="bun add jc" />
            </FeatureStep>

            <FeatureStep step={2} title="Extract metadata">
              <CodeBlock code="npx jc extract" />
              <div style={{ marginTop: '10px' }}>
                <Alert severity="info" title="Automatic detection">
                  Scans <span style={ic}>src/components/ui/**/*.tsx</span>, reads prop types, generates{' '}
                  <span style={ic}>meta.json</span> and <span style={ic}>registry.ts</span>.
                </Alert>
              </div>
            </FeatureStep>

            <FeatureStep step={3} title="Drop in one component">
              <CodeBlock code={'<ShowcaseApp\n  meta={meta}\n  registry={registry}\n  fixtures={[lucideFixtures]}\n/>'} />
              <div style={{ marginTop: '10px' }}>
                <Alert severity="success" title="Done">
                  Open <span style={ic}>/showcase</span> — sidebar, prop controls, code preview, themes, and viewports are all ready.
                </Alert>
              </div>
            </FeatureStep>
          </div>
        </div>
      </section>

      {/* ━━ Pricing ━━ */}
      <section id="pricing" style={{ padding: '96px 0', background: '#f8fafc' }}>
        <div style={wrap}>
          <SectionHeader
            title="Free. Forever."
            subtitle="MIT licensed, no catch."
            badge={<Badge variant="success" pill>Pricing</Badge>}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            <PricingCard
              title="Community"
              description="Everything you need to get started."
              price="$0"
              features={[
                'Unlimited components',
                'All control types',
                'Fixture plugins',
                'Watch mode',
                'Theme + viewport',
              ]}
            >
              <IconButton icon={Download} variant="outline">
                Install
              </IconButton>
            </PricingCard>

            <PricingCard
              title="Enterprise"
              description="For teams that need more."
              price="$0"
              priceLabel="still free"
              highlighted
              features={[
                'Everything in Community',
                'Wrapper prop for providers',
                'URL state sharing',
                'Custom path aliases',
                'CI integration',
              ]}
            >
              <IconButton icon={Zap} variant="primary">
                Get Started
              </IconButton>
            </PricingCard>
          </div>
        </div>
      </section>

      {/* ━━ Team / Social proof ━━ */}
      <section id="team" style={{ padding: '96px 0', background: '#fff' }}>
        <div style={wrap}>
          <SectionHeader
            title="Loved by developers"
            badge={<Badge pill>Testimonials</Badge>}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            <TestimonialCard
              name="Sarah Chen"
              role="Frontend Lead at Vercel"
              quote="Replaced Storybook with jc in 10 minutes. The TypeScript prop detection is genuinely magic — no stories to write, ever."
            />
            <TestimonialCard
              name="Marcus Rivera"
              role="Design Engineer at Linear"
              quote="The Lucide fixture plugin is brilliant. Icon props get a visual picker instead of a text input. Our designers love it."
            />
            <TestimonialCard
              name="Anya Patel"
              role="Staff Eng at Stripe"
              quote="We integrated jc into our CI — extract runs on every PR. New components get a playground page automatically."
            />
          </div>
        </div>
      </section>

      {/* ━━ Newsletter ━━ */}
      <section style={{ padding: '96px 0', background: '#f8fafc' }}>
        <div style={wrap}>
          <Card elevated padding="lg">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '40px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '1 1 320px' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                  Stay in the loop
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                  Get notified about new features, fixture plugins, and framework adapters.
                  No spam — one email per release.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flex: '1 1 320px' }}>
                <div style={{ flex: 1 }}>
                  <Input label="Email" placeholder="you@company.com" type="email" />
                </div>
                <IconButton icon={Mail} variant="primary">
                  Subscribe
                </IconButton>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ━━ Reveal CTA ━━ */}
      <section style={{ padding: '80px 0', background: '#0f172a' }}>
        <div style={{ ...wrap, textAlign: 'center' }}>
          <Alert severity="info" title="Meta demo">
            This entire page is built with 13 React components. jc auto-discovered all of them.
          </Alert>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#f8fafc',
              margin: '32px 0 12px',
              letterSpacing: '-0.02em',
            }}
          >
            Inspect every component on this page
          </h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 32px', lineHeight: 1.6 }}>
            The Buttons, Cards, Alerts, Badges, Inputs, IconButtons, StatCards, PricingCards,
            TestimonialCards, CodeBlocks, SectionHeaders, and FeatureSteps you just scrolled past
            are all available in the interactive showcase — with prop controls, Lucide icon fixtures,
            and live code preview.
          </p>
          <a href="/showcase" style={{ textDecoration: 'none' }}>
            <IconButton icon={ArrowRight} variant="primary" size="lg">
              Open Showcase
            </IconButton>
          </a>
        </div>
      </section>

      {/* ━━ Footer ━━ */}
      <footer
        style={{
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#0f172a',
          borderTop: '1px solid #1e293b',
          fontSize: '13px',
          color: '#64748b',
        }}
      >
        <p style={{ margin: 0 }}>
          MIT Licensed{' · '}
          <a href="https://github.com/mde-pach/jc" style={{ color: '#94a3b8', textDecoration: 'underline' }}>
            GitHub
          </a>
          {' · '}Built with jc
        </p>
      </footer>
    </div>
  )
}
