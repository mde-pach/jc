import { CodeBlock } from '@/components/ui/data-display/code-block'
import { DataTable } from '@/components/ui/data-display/data-table'
import { Callout } from '@/components/ui/feedback/callout'

export default function FixturesPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-fg mb-2">Fixtures</h1>
      <p className="text-fg-muted text-lg mb-12 leading-relaxed">
        Provide concrete values for component-type props — icons, badges, or any React element.
      </p>

      <Section title="What are fixtures">
        <p className="text-sm text-fg-muted leading-relaxed">
          Some props accept React components rather than primitive values. A prop typed as{' '}
          <CodeBlock code="icon?: LucideIcon" inline /> can&#39;t be controlled with a text input.
          Fixtures give jc a set of named values to offer in a visual picker.
        </p>
      </Section>

      <Section title="Create a fixture plugin">
        <CodeBlock
          language="tsx"
          code={`import { defineFixtures } from 'jc'
import { Star, Heart, Zap, Download, Trash2 } from 'lucide-react'
import { createElement } from 'react'

function icon(Comp: typeof Star, size = 20) {
  return {
    render: () => createElement(Comp, { size }),
    renderIcon: () => createElement(Comp, { size: 14 }),
    component: Comp,
  }
}

export const lucideFixtures = defineFixtures({
  name: 'lucide',
  fixtures: [
    { key: 'star', label: 'Star', category: 'icons', ...icon(Star) },
    { key: 'heart', label: 'Heart', category: 'icons', ...icon(Heart) },
    { key: 'zap', label: 'Zap', category: 'icons', ...icon(Zap) },
    { key: 'download', label: 'Download', category: 'icons', ...icon(Download) },
    { key: 'trash', label: 'Trash', category: 'icons', ...icon(Trash2) },
  ],
})`}
        />
      </Section>

      <Section title="Fields reference">
        <DataTable
          columns={['Field', 'Type', 'Description']}
          rows={[
            ['key', 'string', 'Unique identifier within the plugin'],
            ['label', 'string', 'Display name shown in the picker UI'],
            ['category', 'string', 'Group label — determines which prop kinds use this fixture'],
            ['render', '() => ReactNode', 'Full-size preview rendered in the picker grid'],
            ['renderIcon', '() => ReactNode', 'Compact preview for the selected-value thumbnail'],
            ['component', 'ComponentType', 'The actual value passed as the prop at runtime'],
          ]}
          monoFirstCol
          striped
        />
      </Section>

      <Section title="How matching works">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          jc detects the kind of each prop from its TypeScript type. A prop typed as{' '}
          <CodeBlock code="LucideIcon" inline /> gets <CodeBlock code='kind: "icon"' inline />.
          The showcase then looks for fixtures in the matching category:
        </p>
        <DataTable
          columns={['Prop Kind', 'Fixture Category']}
          rows={[
            ['icon', 'icons'],
            ['element', 'elements'],
            ['node', 'nodes'],
          ]}
          monoFirstCol
        />
        <div className="mt-4">
          <Callout intent="info">
            The kind detection uses a layered heuristic: type pattern matching first (e.g.{' '}
            <CodeBlock code="LucideIcon" inline /> → icon), then prop name heuristics (e.g.{' '}
            <CodeBlock code="leadingIcon" inline /> → icon), with source regex as a tiebreaker.
          </Callout>
        </div>
      </Section>

      <Section title="Multiple plugins">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Pass an array of plugins. All fixtures are merged and available in the controls:
        </p>
        <CodeBlock
          language="tsx"
          code={`<ShowcaseApp
  meta={meta}
  registry={registry}
  fixtures={[lucideFixtures, heroiconFixtures, customFixtures]}
/>`}
        />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          When multiple plugins define values in the same category, keys are qualified with the plugin
          name to avoid collisions: <CodeBlock code="lucide:star" inline /> vs{' '}
          <CodeBlock code="heroicon:star" inline />.
        </p>
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
