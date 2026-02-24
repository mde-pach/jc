import { CodeBlock } from '@/components/ui/data-display/code-block'
import { DataTable } from '@/components/ui/data-display/data-table'
import { Callout } from '@/components/ui/feedback/callout'

export default function ApiPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-fg mb-2">API Reference</h1>
      <p className="text-fg-muted text-lg mb-12 leading-relaxed">
        Exports, component props, and type definitions.
      </p>

      <Section title="Package exports">
        <DataTable
          columns={['Import Path', 'Export', 'Description']}
          rows={[
            ['jc', 'ShowcaseApp', 'Main showcase UI component'],
            ['jc', 'defineFixtures', 'Fixture plugin factory function'],
            ['jc', 'JcMeta', 'TypeScript type for meta.json shape'],
            ['jc', 'FixturePlugin', 'TypeScript type for fixture plugins'],
            ['jc/config', 'defineConfig', 'Config factory with autocomplete'],
            ['jc/config', 'resolveConfig', 'Merges user config with defaults'],
            ['jc/config', 'defaultConfig', 'Default configuration object'],
            ['jc/next', 'createShowcasePage', 'Next.js App Router page factory'],
          ]}
          monoFirstCol
          striped
        />
      </Section>

      <Section title="ShowcaseApp props">
        <DataTable
          columns={['Prop', 'Type', 'Required', 'Description']}
          rows={[
            ['meta', 'JcMeta', 'Yes', 'Extracted component metadata from meta.json'],
            ['registry', 'Record<string, () => Promise<...>>', 'Yes', 'Lazy component import map from registry.ts'],
            ['fixtures', 'FixturePlugin[]', 'No', 'Array of fixture plugins for component-type props'],
            ['defaultTheme', "'auto' | 'light' | 'dark'", 'No', 'Initial theme (default: auto)'],
            ['defaultViewport', "'full' | '375' | '768' | '1280'", 'No', 'Initial viewport width (default: full)'],
          ]}
          monoFirstCol
          striped
        />
      </Section>

      <Section title="Wrapper detection">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Some components must render inside a parent — like AccordionItem inside Accordion.
          jc detects this from <CodeBlock code="@example" inline /> JSDoc tags on the component:
        </p>
        <CodeBlock
          language="tsx"
          code={`/**
 * A single item within an Accordion.
 *
 * @example
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="1" title="Title">Content</AccordionItem>
 * </Accordion>
 */
export function AccordionItem({ ... }: AccordionItemProps) { ... }`}
        />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          When the example JSX wraps the component in a parent element, jc extracts the wrapper
          component name and its props. The showcase renders the wrapper automatically around the
          preview.
        </p>
        <div className="mt-4">
          <Callout intent="info" title="Multiple examples">
            A component can have multiple <CodeBlock code="@example" inline /> tags. Each becomes a
            selectable preset in the showcase UI.
          </Callout>
        </div>
      </Section>

      <Section title="Type definitions">
        <CodeBlock
          language="ts"
          code={`interface JcMeta {
  components: ComponentMeta[]
}

interface ComponentMeta {
  displayName: string
  filePath: string
  description?: string
  props: PropMeta[]
  examples?: Example[]
  wrapperComponents?: WrapperComponent[]
}

interface PropMeta {
  name: string
  type: string
  required: boolean
  defaultValue?: string
  description?: string
  enumValues?: string[]
  kind?: 'text' | 'icon' | 'element' | 'node'
}

interface Example {
  name?: string
  props: Record<string, unknown>
  wrapperProps?: Record<string, unknown>
}

interface WrapperComponent {
  name: string
  props: Record<string, unknown>
}`}
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
