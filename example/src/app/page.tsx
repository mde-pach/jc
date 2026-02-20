import { Alert } from '@/components/ui/alert'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { StatCard } from '@/components/ui/stat-card'
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

const mono: React.CSSProperties = {
  fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
  fontSize: '13px',
  lineHeight: 1.7,
  backgroundColor: '#0f172a',
  color: '#e2e8f0',
  borderRadius: '12px',
  padding: '20px 24px',
  overflow: 'auto',
  border: '1px solid #1e293b',
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
            <pre style={{ ...mono, display: 'inline-block', padding: '14px 24px', fontSize: '14px' }}>
              <code>
                <span style={{ color: '#94a3b8' }}>$</span> npx jc extract{'\n'}
                <span style={{ color: '#34d399' }}>{'✓'}</span> Extracted 8 components in 340ms
              </code>
            </pre>
          </div>
        </div>
      </header>

      {/* ━━ Stats strip ━━ */}
      <section style={{ padding: '64px 0', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ ...wrap, display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <StatCard label="Components" value="8" icon={Zap} trend="neutral" />
          <StatCard label="Tests" value="93" icon={Shield} trend="up" trendText="100% pass" />
          <StatCard label="Config files" value="0" icon={Star} trend="neutral" />
          <StatCard label="Bundle (UI)" value="12kb" icon={Download} trend="down" trendText="gzipped" />
        </div>
      </section>

      {/* ━━ Features ━━ */}
      <section id="features" style={{ padding: '96px 0', background: '#f8fafc' }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <Badge variant="info" pill>Features</Badge>
            <h2
              style={{
                fontSize: '36px',
                fontWeight: 800,
                margin: '12px 0 8px',
                letterSpacing: '-0.03em',
                color: '#0f172a',
              }}
            >
              Everything auto-generated
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', margin: 0, maxWidth: '480px', marginInline: 'auto' }}>
              From prop controls to code snippets — jc does the work so you can focus on building.
            </p>
          </div>

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
              <pre style={{ ...mono, fontSize: '12px', padding: '14px 16px', margin: 0 }}>
                <code>
                  {'<'}<span style={{ color: '#7dd3fc' }}>IconButton</span>{'\n'}
                  {'  '}<span style={{ color: '#c4b5fd' }}>icon</span>={'{'}<span style={{ color: '#34d399' }}>Star</span>{'}'}{'\n'}
                  {'  '}<span style={{ color: '#c4b5fd' }}>variant</span>=<span style={{ color: '#fde68a' }}>"primary"</span>{'\n'}
                  {'>'}{'\n'}
                  {'  Favorite'}{'\n'}
                  {'</'}<span style={{ color: '#7dd3fc' }}>IconButton</span>{'>'}
                </code>
              </pre>
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
              <pre style={{ ...mono, fontSize: '12px', padding: '14px 16px', margin: 0 }}>
                <code>
                  <span style={{ color: '#94a3b8' }}>$</span> jc extract --watch{'\n'}
                  <span style={{ color: '#34d399' }}>{'✓'}</span> Watching src/components/ui/**/*.tsx{'\n'}
                  <span style={{ color: '#fbbf24' }}>{'⟳'}</span> button.tsx changed — re-extracting...{'\n'}
                  <span style={{ color: '#34d399' }}>{'✓'}</span> Done in 180ms
                </code>
              </pre>
            </Card>
          </div>
        </div>
      </section>

      {/* ━━ How it works ━━ */}
      <section style={{ padding: '96px 0', background: '#fff' }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <Badge pill>3 steps</Badge>
            <h2
              style={{
                fontSize: '36px',
                fontWeight: 800,
                margin: '12px 0 0',
                letterSpacing: '-0.03em',
                color: '#0f172a',
              }}
            >
              Up and running in 2 minutes
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#eff6ff',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>Install the package</h3>
                <pre style={{ ...mono, padding: '12px 16px', fontSize: '13px', margin: 0 }}>
                  <code>bun add jc</code>
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#eff6ff',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>Extract metadata</h3>
                <pre style={{ ...mono, padding: '12px 16px', fontSize: '13px', margin: 0 }}>
                  <code>npx jc extract</code>
                </pre>
                <div style={{ marginTop: '10px' }}>
                  <Alert severity="info" title="Automatic detection">
                    Scans <span style={ic}>src/components/ui/**/*.tsx</span>, reads prop types, generates{' '}
                    <span style={ic}>meta.json</span> and <span style={ic}>registry.ts</span>.
                  </Alert>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#eff6ff',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>Drop in one component</h3>
                <pre style={{ ...mono, padding: '14px 16px', fontSize: '12px', margin: 0 }}>
                  <code>
                    {'<'}<span style={{ color: '#7dd3fc' }}>ShowcaseApp</span>{'\n'}
                    {'  '}<span style={{ color: '#c4b5fd' }}>meta</span>={'{meta}'}{'\n'}
                    {'  '}<span style={{ color: '#c4b5fd' }}>registry</span>={'{registry}'}{'\n'}
                    {'  '}<span style={{ color: '#c4b5fd' }}>fixtures</span>={'{[lucideFixtures]}'}{'\n'}
                    {'/>'}
                  </code>
                </pre>
                <div style={{ marginTop: '10px' }}>
                  <Alert severity="success" title="Done">
                    Open <span style={ic}>/showcase</span> — sidebar, prop controls, code preview, themes, and viewports are all ready.
                  </Alert>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━ Pricing ━━ */}
      <section id="pricing" style={{ padding: '96px 0', background: '#f8fafc' }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <Badge variant="success" pill>Pricing</Badge>
            <h2
              style={{
                fontSize: '36px',
                fontWeight: 800,
                margin: '12px 0 8px',
                letterSpacing: '-0.03em',
                color: '#0f172a',
              }}
            >
              Free. Forever.
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>MIT licensed, no catch.</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            <Card title="Community" description="Everything you need to get started." elevated padding="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>$0</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#64748b' }}>
                  <div>{'✓ '}Unlimited components</div>
                  <div>{'✓ '}All control types</div>
                  <div>{'✓ '}Fixture plugins</div>
                  <div>{'✓ '}Watch mode</div>
                  <div>{'✓ '}Theme + viewport</div>
                </div>
                <IconButton icon={Download} variant="outline">
                  Install
                </IconButton>
              </div>
            </Card>

            <Card title="Enterprise" description="For teams that need more." elevated padding="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>
                  $0
                  <span style={{ fontSize: '14px', fontWeight: 400, color: '#94a3b8' }}> still free</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#64748b' }}>
                  <div>{'✓ '}Everything in Community</div>
                  <div>{'✓ '}Wrapper prop for providers</div>
                  <div>{'✓ '}URL state sharing</div>
                  <div>{'✓ '}Custom path aliases</div>
                  <div>{'✓ '}CI integration</div>
                </div>
                <IconButton icon={Zap} variant="primary">
                  Get Started
                </IconButton>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ━━ Team / Social proof ━━ */}
      <section id="team" style={{ padding: '96px 0', background: '#fff' }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <Badge pill>Testimonials</Badge>
            <h2
              style={{
                fontSize: '36px',
                fontWeight: 800,
                margin: '12px 0 0',
                letterSpacing: '-0.03em',
                color: '#0f172a',
              }}
            >
              Loved by developers
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            {[
              {
                name: 'Sarah Chen',
                role: 'Frontend Lead at Vercel',
                quote:
                  'Replaced Storybook with jc in 10 minutes. The TypeScript prop detection is genuinely magic — no stories to write, ever.',
              },
              {
                name: 'Marcus Rivera',
                role: 'Design Engineer at Linear',
                quote:
                  'The Lucide fixture plugin is brilliant. Icon props get a visual picker instead of a text input. Our designers love it.',
              },
              {
                name: 'Anya Patel',
                role: 'Staff Eng at Stripe',
                quote:
                  'We integrated jc into our CI — extract runs on every PR. New components get a playground page automatically.',
              },
            ].map((t) => (
              <Card key={t.name} padding="md" elevated>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: 1.7,
                      color: '#334155',
                      fontStyle: 'italic',
                    }}
                  >
                    "{t.quote}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar name={t.name} size="md" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{t.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
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
            This entire page is built with 8 React components. jc auto-discovered all of them.
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
            The Buttons, Cards, Alerts, Badges, Avatars, Inputs, IconButtons, and StatCards you just
            scrolled past are all available in the interactive showcase — with prop controls,
            Lucide icon fixtures, and live code preview.
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
