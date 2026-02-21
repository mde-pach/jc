import { CodeBlock } from '@/components/ui/data-display/code-block'
import { PropsTable } from '@/components/ui/data-display/props-table'
import { LinkCard } from '@/components/ui/navigation/link-card'
import { Puzzle, Monitor } from 'lucide-react'

export default function ApiPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">API Reference</h1>
      <p className="text-gray-500 text-lg mb-12 leading-relaxed">
        Complete reference for all exports, types, and component props.
      </p>

      <Section title='Exports from "jc"'>
        <PropsTable
          columns={['Export', 'Kind', 'Description']}
          rows={[
            ['ShowcaseApp', 'Component', 'Root showcase UI — sidebar, controls, preview, code'],
            ['defineFixtures(plugin)', 'Function', 'Type-safe helper for creating fixture plugins'],
            ['JcMeta', 'Type', 'Full extraction output shape'],
            ['JcComponentMeta', 'Type', 'Single component metadata'],
            ['JcPropMeta', 'Type', 'Single prop metadata'],
            ['JcConfig', 'Type', 'Configuration shape'],
            ['JcFixture', 'Type', 'One fixture item'],
            ['JcFixturePlugin', 'Type', 'A named set of fixtures'],
            ['JcControl', 'Type', 'Resolved control definition'],
            ['JcControlType', 'Type', 'Control type union: text, number, boolean, select, component, json, readonly'],
            ['JcComponentPropKind', 'Type', 'Component prop kind: icon, node, element'],
          ]}
        />
      </Section>

      <Section title='Exports from "jc/config"'>
        <PropsTable
          columns={['Export', 'Kind', 'Description']}
          rows={[
            ['defineConfig(config)', 'Function', 'Type-safe helper for jc.config.ts'],
            ['resolveConfig(config)', 'Function', 'Merges user config with defaults (union merge)'],
            ['defaultConfig', 'Object', 'Built-in default values'],
          ]}
        />
      </Section>

      <Section title='Exports from "jc/next"'>
        <PropsTable
          columns={['Export', 'Kind', 'Description']}
          rows={[
            ['createShowcasePage(options)', 'Function', 'Creates a client component for Next.js App Router pages'],
          ]}
        />
      </Section>

      <Section title="ShowcaseApp props">
        <PropsTable
          columns={['Prop', 'Type', 'Required', 'Description']}
          rows={[
            ['meta', 'JcMeta', 'Yes', 'Component metadata from meta.json'],
            ['registry', 'Record<string, () => Promise<ComponentType>>', 'Yes', 'Lazy loaders from registry.ts'],
            ['fixtures', 'JcFixturePlugin[]', 'No', 'Fixture plugins for component-type props'],
            ['wrapper', 'ComponentType<{ children: ReactNode }>', 'No', 'Wrapper for context providers'],
          ]}
        />
      </Section>

      <Section title="Wrapper pattern">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Use the <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">wrapper</code> prop to inject context
          providers that your components need:
        </p>
        <CodeBlock
          code={`<ShowcaseApp
  meta={meta}
  registry={registry}
  wrapper={({ children }) => (
    <ThemeProvider>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </ThemeProvider>
  )}
/>`}
        />
      </Section>

      <Section title="Key types">
        <h3 className="text-base font-semibold text-gray-900 mb-3">JcMeta</h3>
        <CodeBlock
          code={`interface JcMeta {
  generatedAt: string
  components: JcComponentMeta[]
}`}
        />

        <h3 className="text-base font-semibold text-gray-900 mb-3 mt-8">JcComponentMeta</h3>
        <CodeBlock
          code={`interface JcComponentMeta {
  displayName: string
  filePath: string
  props: JcPropMeta[]
}`}
        />

        <h3 className="text-base font-semibold text-gray-900 mb-3 mt-8">JcPropMeta</h3>
        <CodeBlock
          code={`interface JcPropMeta {
  name: string
  type: string
  required: boolean
  defaultValue: string | null
  description: string
  enumValues: string[] | null
  componentKind: JcComponentPropKind | null
}`}
        />

        <h3 className="text-base font-semibold text-gray-900 mb-3 mt-8">JcFixturePlugin</h3>
        <CodeBlock
          code={`interface JcFixturePlugin {
  name: string
  fixtures: JcFixture[]
}`}
        />
      </Section>

      <div className="mt-14 flex gap-3">
        <LinkCard
          href="/docs/fixtures"
          title="Fixtures"
          icon={Puzzle}
          direction="back"
        />
        <LinkCard
          href="/docs/frameworks"
          title="Frameworks"
          description="Next.js, Vite, and other setups"
          icon={Monitor}
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
