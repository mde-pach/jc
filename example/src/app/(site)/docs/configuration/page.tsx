import { CodeBlock } from '@/components/ui/data-display/code-block'
import { Tabs } from '@/components/ui/data-display/tabs'
import { PropsTable } from '@/components/ui/data-display/props-table'
import { Alert } from '@/components/ui/feedback/alert'
import { LinkCard } from '@/components/ui/navigation/link-card'
import { BookOpen, Puzzle } from 'lucide-react'

export default function ConfigurationPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">Configuration</h1>
      <p className="text-gray-500 text-lg mb-12 leading-relaxed">
        jc works out of the box with sensible defaults. Create a config file to customize behavior.
      </p>

      <Section title="Config file">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Create a <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">jc.config.ts</code> at your project root:
        </p>
        <CodeBlock
          code={`import { defineConfig } from 'jc/config'

export default defineConfig({
  componentGlob: 'src/components/ui/**/*.tsx',
  outputDir: 'src/jc/generated',
})`}
        />
      </Section>

      <Section title="All options">
        <PropsTable
          columns={['Option', 'Type', 'Default']}
          rows={[
            ['componentGlob', 'string', "'src/components/ui/**/*.tsx'"],
            ['outputDir', 'string', "'src/jc/generated'"],
            ['pathAlias', 'Record<string, string>', "{ '@/': 'src/' }"],
            ['excludeFiles', 'string[]', "['index.ts', 'toaster.tsx', ...]"],
            ['excludeComponents', 'string[]', "['DialogPortal', ...]"],
            ['filteredProps', 'string[]', "['ref', 'key', ...]"],
            ['filteredPropPatterns', 'string[]', "['^on[A-Z]', '^aria-', '^data-']"],
          ]}
        />
      </Section>

      <Section title="Array merging">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          When you provide array options like{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">excludeFiles</code> or{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">filteredProps</code>, they are{' '}
          <strong>merged with defaults</strong> using union merge — not replaced. You only need to
          specify additions:
        </p>
        <CodeBlock
          code={`export default defineConfig({
  // Adds 'skeleton.tsx' to the default exclusion list
  excludeFiles: ['skeleton.tsx'],
})`}
        />
        <div className="mt-4">
          <Alert severity="info" title="Union merge with dedup">
            If you specify a value that already exists in the defaults, it won&apos;t be duplicated.
          </Alert>
        </div>
      </Section>

      <Section title="Path aliases">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          The <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">pathAlias</code> option
          controls how file paths are transformed in the generated registry:
        </p>
        <Tabs
          tabs={[
            {
              label: '@ alias (default)',
              content: (
                <CodeBlock code={`// src/components/ui/button.tsx → @/components/ui/button\n{ '@/': 'src/' }`} />
              ),
            },
            {
              label: '~ alias',
              content: (
                <CodeBlock code={`// src/components/ui/button.tsx → ~/components/ui/button\n{ '~/': 'src/' }`} />
              ),
            },
            {
              label: 'Scoped alias',
              content: (
                <CodeBlock code={`// src/components/ui/button.tsx → @components/ui/button\n{ '@components/': 'src/components/' }`} />
              ),
            },
          ]}
        />
      </Section>

      <Section title="Prop filtering">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Use <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">filteredProps</code> for
          exact names and{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">filteredPropPatterns</code> for
          regex patterns. Patterns support full regex syntax including negative lookahead:
        </p>
        <CodeBlock
          code={`export default defineConfig({
  // Filter all 'on' handlers except onClick and onChange
  filteredPropPatterns: ['^on(?!(Click|Change))[A-Z]'],
})`}
        />
      </Section>

      <div className="mt-14 flex gap-3">
        <LinkCard
          href="/docs/getting-started"
          title="Getting Started"
          icon={BookOpen}
          direction="back"
        />
        <LinkCard
          href="/docs/fixtures"
          title="Fixtures"
          description="Provide real icons and components"
          icon={Puzzle}
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
