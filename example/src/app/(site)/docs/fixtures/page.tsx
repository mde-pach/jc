import { CodeBlock } from '@/components/ui/data-display/code-block'
import { PropsTable } from '@/components/ui/data-display/props-table'
import { Alert } from '@/components/ui/feedback/alert'
import { LinkCard } from '@/components/ui/navigation/link-card'
import { Settings, FileCode } from 'lucide-react'

export default function FixturesPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">Fixtures</h1>
      <p className="text-gray-500 text-lg mb-12 leading-relaxed">
        Fixture plugins let you provide real components for component-type props — icons, badges, or
        any custom element — so the showcase renders actual UI instead of placeholder text.
      </p>

      <Section title="Why fixtures?">
        <p className="text-sm text-gray-600 leading-relaxed">
          By default, component-type props (like{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">LucideIcon</code> or{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">ReactNode</code>) show a plain
          text input. Fixture plugins replace that with a visual picker — click to choose a real icon,
          badge, or any custom element.
        </p>
      </Section>

      <Section title="Defining fixtures">
        <CodeBlock
          code={`import { defineFixtures } from 'jc'
import { Star, Heart, Zap, Bell, Search } from 'lucide-react'
import { createElement } from 'react'

export const lucideFixtures = defineFixtures({
  name: 'lucide',
  fixtures: [
    {
      key: 'star',
      label: 'Star',
      category: 'icons',
      render: () => createElement(Star, { size: 20 }),
      renderIcon: () => createElement(Star, { size: 14 }),
    },
    {
      key: 'heart',
      label: 'Heart',
      category: 'icons',
      render: () => createElement(Heart, { size: 20 }),
      renderIcon: () => createElement(Heart, { size: 14 }),
    },
    // ... more icons
  ],
})`}
        />
      </Section>

      <Section title="Fixture fields">
        <PropsTable
          columns={['Field', 'Type', 'Required', 'Description']}
          rows={[
            ['key', 'string', 'Yes', 'Unique identifier within the plugin'],
            ['label', 'string', 'Yes', 'Display name (shown as PascalCase in code preview)'],
            ['category', 'string', 'No', 'Filters fixtures by componentKind (e.g. "icons" → "icon")'],
            ['render()', '() => ReactNode', 'Yes', 'Full-size element for the preview'],
            ['renderIcon()', '() => ReactNode', 'No', 'Small version (14px) for the picker grid'],
            ['component', 'ComponentType', 'No', 'Raw component reference for code generation'],
          ]}
        />
      </Section>

      <Section title="Qualified keys">
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Each fixture gets a <strong>qualified key</strong> in the format{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">pluginName/key</code> (e.g.{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">lucide/star</code>). This is
          used as the internal prop value. At render time, qualified keys are resolved to real
          ReactNodes via <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">render()</code>.
        </p>
        <Alert severity="info" title="Code preview">
          The code preview shows{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{`<Star />`}</code> instead of
          raw keys like{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">lucide/star</code>.
        </Alert>
      </Section>

      <Section title="Categories and kind filtering">
        <p className="text-sm text-gray-600 leading-relaxed">
          When a prop has{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            componentKind: &apos;icon&apos;
          </code>
          , only fixtures with{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            category: &apos;icons&apos;
          </code>{' '}
          are shown in the picker. The matching rule is: category name (plural) matches kind name
          (singular) + &apos;s&apos;.
        </p>
      </Section>

      <Section title="Using fixtures with ShowcaseApp">
        <CodeBlock
          code={`import { lucideFixtures } from './fixtures'

<ShowcaseApp
  meta={meta}
  registry={registry}
  fixtures={[lucideFixtures]}
/>`}
        />
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">
          Multiple plugins merge into a single flat list:
        </p>
        <CodeBlock code={`fixtures={[lucideFixtures, badgeFixtures, customFixtures]}`} />
      </Section>

      <Section title="Children fixture mode">
        <p className="text-sm text-gray-600 leading-relaxed">
          When fixtures are available, the{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">children</code> prop gets a{' '}
          <strong>Text / Fixture</strong> toggle. In fixture mode, you can pick any fixture to render
          as children — useful for components that accept icons or other elements as children.
        </p>
      </Section>

      <div className="mt-14 flex gap-3">
        <LinkCard
          href="/docs/configuration"
          title="Configuration"
          icon={Settings}
          direction="back"
        />
        <LinkCard
          href="/docs/api"
          title="API Reference"
          description="All exports, types, and props"
          icon={FileCode}
          direction="forward"
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
