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
  componentGlob: 'src/components/ui/**/*.tsx',
  outputDir: 'src/jc/generated',
  excludeComponents: ['MyInternalComponent'],
  filteredProps: ['testId'],
})`}
        />
      </Section>

      <Section title="All options">
        <DataTable
          columns={['Option', 'Type', 'Default', 'Description']}
          rows={[
            ['componentGlob', 'string', 'src/components/ui/**/*.tsx', 'Single glob pattern for component discovery'],
            ['componentGlobs', 'string[]', '—', 'Multiple glob patterns (takes precedence over componentGlob)'],
            ['excludeFiles', 'string[]', "['index.ts', 'toaster.tsx', 'form.tsx', 'form-fields.tsx']", 'File names to skip during extraction'],
            ['excludeComponents', 'string[]', "['DialogPortal', 'DialogOverlay', 'DialogClose']", 'Component names to exclude from the showcase'],
            ['filteredProps', 'string[]', "['ref', 'key', 'dangerouslySetInnerHTML', ...]", 'Exact prop names to exclude from controls'],
            ['filteredPropPatterns', 'string[]', "['^\\ on(?!OpenChange|...)[A-Z]', '^aria-', '^data-']", 'Regex patterns to exclude props'],
            ['outputDir', 'string', 'src/jc/generated', 'Output directory for meta.json and registry.ts'],
            ['pathAlias', 'Record<string, string>', "{ '@/': 'src/' }", 'Path alias mapping — auto-detected from tsconfig.json'],
            ['componentTypeMap', 'Record<string, JcComponentPropKind>', '{}', 'Manual type → kind mapping (element | node)'],
            ['extractor', 'Extractor', '(react-docgen-typescript)', 'Custom extraction engine'],
          ]}
          monoFirstCol
          striped
        />
      </Section>

      <Section title="Multiple globs">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Use <CodeBlock code="componentGlobs" inline /> when your components live in multiple
          directories. It takes precedence over <CodeBlock code="componentGlob" inline /> when set:
        </p>
        <CodeBlock
          language="ts"
          code={`defineConfig({
  componentGlobs: [
    'src/components/ui/**/*.tsx',
    'src/components/shared/**/*.tsx',
  ],
})`}
        />
      </Section>

      <Section title="Array merging">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Array fields use union merge with deduplication. Your values extend the defaults — they
          don&#39;t replace them.
        </p>
        <CodeBlock
          language="ts"
          code={`// Default excludeFiles: ['index.ts', 'toaster.tsx', 'form.tsx', 'form-fields.tsx']

defineConfig({
  excludeFiles: ['my-internal.tsx'],
})

// Result: ['index.ts', 'toaster.tsx', 'form.tsx', 'form-fields.tsx', 'my-internal.tsx']`}
        />
        <div className="mt-4">
          <Callout intent="info">
            This applies to <CodeBlock code="excludeFiles" inline />,{' '}
            <CodeBlock code="excludeComponents" inline />,{' '}
            <CodeBlock code="filteredProps" inline />, and{' '}
            <CodeBlock code="filteredPropPatterns" inline />.
          </Callout>
        </div>
      </Section>

      <Section title="Path aliases">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Path aliases are auto-detected from your <CodeBlock code="tsconfig.json" inline /> when
          running <CodeBlock code="jc extract" inline />. The default mapping is{' '}
          <CodeBlock code="{'@/': 'src/'}" inline />. Override it in your config if your project uses
          a different structure:
        </p>
        <CodeBlock
          language="ts"
          code={`defineConfig({
  pathAlias: { '~/': 'src/' },
})

// Component at: src/components/ui/button.tsx
// Registry generates: import('~/components/ui/button')`}
        />
      </Section>

      <Section title="Prop filtering">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          HTML noise props like <CodeBlock code="ref" inline />,{' '}
          <CodeBlock code="dangerouslySetInnerHTML" inline />, and all <CodeBlock code="aria-*" inline />{' '}
          / <CodeBlock code="data-*" inline /> props are filtered by default. Add more with exact
          names or regex patterns:
        </p>
        <CodeBlock
          language="ts"
          code={`defineConfig({
  // Exact match — these specific prop names
  filteredProps: ['testId', 'data-testid'],

  // Pattern match — any prop matching these regexes
  filteredPropPatterns: ['^debug[A-Z]'],
})`}
        />
      </Section>

      <Section title="Component type map">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          For custom component prop types that jc cannot automatically classify, use{' '}
          <CodeBlock code="componentTypeMap" inline /> to manually map a type name to a kind:
        </p>
        <CodeBlock
          language="ts"
          code={`defineConfig({
  componentTypeMap: {
    // Treat props typed as 'MyIconType' as renderable elements
    MyIconType: 'element',
    // Treat props typed as 'SlotContent' as React node slots
    SlotContent: 'node',
  },
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
