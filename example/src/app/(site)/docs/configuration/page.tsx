import { CodeBlock } from '@/components/ui/data-display/code-block'
import { DataTable } from '@/components/ui/data-display/data-table'
import { Callout } from '@/components/ui/feedback/callout'

export default function ConfigurationPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-fg mb-2">Configuration</h1>
      <p className="text-fg-muted text-lg mb-12 leading-relaxed">
        jc works with zero config. When you need to customize, create a config file.
      </p>

      <Section title="Config file">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Create <CodeBlock code="jc.config.ts" inline /> at your project root.
          The <CodeBlock code="defineConfig" inline /> helper provides type safety and autocomplete:
        </p>
        <CodeBlock
          language="ts"
          code={`import { defineConfig } from 'jc/config'

export default defineConfig({
  componentFiles: ['src/components/ui/**/*.tsx'],
  outputDir: 'src/jc/generated',
  pathAlias: { '@/': 'src/' },
  filteredProps: ['className', 'style', 'ref'],
})`}
        />
      </Section>

      <Section title="All options">
        <DataTable
          columns={['Option', 'Type', 'Default', 'Description']}
          rows={[
            ['componentFiles', 'string[]', 'src/components/ui/**/*.tsx', 'Glob patterns for component discovery'],
            ['excludeFiles', 'string[]', '**/*.test.*, **/*.stories.*', 'Glob patterns to skip'],
            ['outputDir', 'string', 'src/jc/generated', 'Output directory for meta.json and registry.ts'],
            ['pathAlias', 'Record<string, string>', '{}', 'Path alias mapping for registry imports'],
            ['filteredProps', 'string[]', 'className, style, ref, key', 'Prop names to exclude from controls'],
            ['filteredPropPatterns', 'string[]', '[]', 'Regex patterns to exclude props (e.g. aria-.*)'],
            ['tsConfigPath', 'string', 'tsconfig.json', 'Path to tsconfig for type resolution'],
          ]}
          monoFirstCol
          striped
        />
      </Section>

      <Section title="Array merging">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Array fields use union merge with deduplication. Your values extend the defaults — they
          don&#39;t replace them.
        </p>
        <CodeBlock
          language="ts"
          code={`// Default excludeFiles: ['**/*.test.*', '**/*.stories.*']

defineConfig({
  excludeFiles: ['**/*.spec.*'],
})

// Result: ['**/*.test.*', '**/*.stories.*', '**/*.spec.*']`}
        />
        <div className="mt-4">
          <Callout intent="info">
            This applies to <CodeBlock code="componentFiles" inline />,{' '}
            <CodeBlock code="excludeFiles" inline />,{' '}
            <CodeBlock code="filteredProps" inline />, and{' '}
            <CodeBlock code="filteredPropPatterns" inline />.
          </Callout>
        </div>
      </Section>

      <Section title="Path aliases">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          If your project uses TypeScript path aliases, configure them so the generated registry
          produces correct import paths:
        </p>
        <CodeBlock
          language="ts"
          code={`defineConfig({
  pathAlias: { '@/': 'src/' },
})

// Component at: src/components/ui/button.tsx
// Registry generates: import('@/components/ui/button')`}
        />
      </Section>

      <Section title="Prop filtering">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Props like <CodeBlock code="className" inline /> and <CodeBlock code="ref" inline /> are
          filtered by default. Add more with exact names or regex patterns:
        </p>
        <CodeBlock
          language="ts"
          code={`defineConfig({
  // Exact match — these specific prop names
  filteredProps: ['testId', 'data-testid'],

  // Pattern match — any prop matching these regexes
  filteredPropPatterns: ['aria-.*', 'on[A-Z].*'],
})`}
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
