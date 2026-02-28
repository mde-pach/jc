import { CodeBlock } from '@/components/ui/data-display/code-block'
import { DataTable } from '@/components/ui/data-display/data-table'
import { Callout } from '@/components/ui/feedback/callout'

export default function PluginsPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-fg mb-2">Plugins</h1>
      <p className="text-fg-muted text-lg mb-12 leading-relaxed">
        Plugins teach jc how to handle component-type props — icons, React elements, or any
        renderable value — by providing a visual picker and a set of items to choose from.
      </p>

      <Section title="How plugins work">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          When jc encounters a prop it cannot control with a primitive input (text, number, boolean),
          it looks for a plugin that claims that prop type. A plugin declares what types or prop
          names it handles via a <CodeBlock code="match" inline /> descriptor. When a match is found,
          the plugin's items appear in a visual picker and the selected value is passed as the prop
          at runtime.
        </p>
        <p className="text-sm text-fg-muted leading-relaxed">
          The extraction pipeline is type-agnostic — it only reports raw TypeScript types and
          React-native kinds (<CodeBlock code="element" inline /> / <CodeBlock code="node" inline />).
          Library-specific classification (e.g. treating <CodeBlock code="LucideIcon" inline /> as an
          icon) is entirely handled by plugins via <CodeBlock code="match.types" inline />.
        </p>
      </Section>

      <Section title="Zero-config: the lucide plugin">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          If your components use Lucide icons, jc ships a ready-made plugin. Install{' '}
          <CodeBlock code="lucide-react" inline /> and add one line:
        </p>
        <CodeBlock
          language="tsx"
          code={`import { lucidePlugin } from 'jc/plugins/lucide'

<ShowcaseApp
  meta={meta}
  plugins={[lucidePlugin]}
/>`}
        />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          The plugin matches any prop typed as <CodeBlock code="LucideIcon" inline />, imports the
          full icon set from <CodeBlock code="lucide-react" inline />, and renders them in a
          searchable grid picker. No configuration needed.
        </p>
        <div className="mt-4">
          <Callout intent="info" title="Custom size">
            Use <CodeBlock code="lucide({ size: 24 })" inline /> (imported alongside{' '}
            <CodeBlock code="lucidePlugin" inline />) to override the render size. The default is
            20px in preview and 14px in thumbnails.
          </Callout>
        </div>
      </Section>

      <Section title="Define a custom plugin">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Use <CodeBlock code="definePlugin" inline /> and <CodeBlock code="fromComponents" inline />{' '}
          from <CodeBlock code="jc" inline /> to build your own plugin. Both are re-exported from the
          main package:
        </p>
        <CodeBlock
          language="tsx"
          code={`import { definePlugin, fromComponents } from 'jc'
import { GridPicker } from 'jc/advanced'
import * as icons from 'my-icon-library'

export const myIconPlugin = definePlugin({
  name: 'my-icons',
  match: { types: ['IconType'] },
  importPath: 'my-icon-library',
  valueMode: 'constructor',
  renderProps: { size: 20 },
  previewProps: { size: 14 },
  items: fromComponents(icons),
  Picker: GridPicker,
})`}
        />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          <CodeBlock code="definePlugin" inline /> returns a factory function{' '}
          (<CodeBlock code="() => JcPlugin" inline />) so you can use it directly in the{' '}
          <CodeBlock code="plugins" inline /> prop array:{' '}
          <CodeBlock code="plugins={[myIconPlugin]}" inline />.
        </p>
      </Section>

      <Section title="fromComponents helper">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          <CodeBlock code="fromComponents(module)" inline /> auto-generates plugin items from a
          module's exports. It filters for PascalCase exports (React component convention), converts
          the name to a kebab-case key, and deduplicates aliases:
        </p>
        <CodeBlock
          language="ts"
          code={`import * as icons from 'lucide-react'
import { fromComponents } from 'jc'

const items = fromComponents(icons)
// → [{ key: 'star', label: 'Star', value: Star }, ...]`}
        />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          Pass an optional filter function as the second argument to exclude specific exports:
        </p>
        <CodeBlock
          language="ts"
          code={`const items = fromComponents(icons, (key) => !key.endsWith('Outline'))`}
        />
      </Section>

      <Section title="JcPlugin interface">
        <DataTable
          columns={['Field', 'Type', 'Required', 'Description']}
          rows={[
            ['name', 'string', 'Yes', 'Unique plugin name, used to qualify item keys (e.g. "lucide/star")'],
            ['match', 'JcPluginMatch', 'Yes', 'Scoring descriptor — determines which props this plugin handles'],
            ['items', 'JcPluginItem[]', 'Yes', 'The available values to show in the picker'],
            ['importPath', 'string', 'No', 'Module path used in generated code output (e.g. "lucide-react")'],
            ['valueMode', "'render' | 'constructor' | 'element'", 'No', "How values are passed as props (default: 'render')"],
            ['renderProps', 'Record<string, unknown>', 'No', 'Props forwarded when rendering items in the preview'],
            ['previewProps', 'Record<string, unknown>', 'No', 'Props forwarded when rendering item thumbnails (merged on top of renderProps)'],
            ['Picker', 'ComponentType<JcPluginPickerProps>', 'No', 'Custom picker UI component (e.g. GridPicker from jc/advanced)'],
            ['priority', 'number', 'No', 'Tiebreaker added to the match score — higher wins'],
          ]}
          monoFirstCol
          striped
        />
      </Section>

      <Section title="Match scoring">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          When a prop needs a plugin, jc scores every loaded plugin against the prop and picks the
          winner. Scores are additive — a plugin can win on multiple signals at once:
        </p>
        <DataTable
          columns={['Match field', 'Score', 'How it matches']}
          rows={[
            ['match.types', '+100', "Checks prop's rawType string for any of the listed type names"],
            ['match.kinds', '+50', "Checks prop's componentKind ('element' | 'node')"],
            ['match.propNames', '+25', 'Tests prop name against each entry as a case-insensitive regex'],
            ['plugin.priority', '+N', 'Added to the total — use to break ties between equally-matching plugins'],
          ]}
          monoFirstCol
          striped
        />
        <div className="mt-4">
          <Callout intent="info">
            <CodeBlock code="match.types" inline /> is the strongest signal. If you know the exact
            TypeScript type name used in your component props, always prefer it over kind or name
            matching.
          </Callout>
        </div>
      </Section>

      <Section title="valueMode">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          <CodeBlock code="valueMode" inline /> controls how the selected item's{' '}
          <CodeBlock code="value" inline /> is passed when rendering the component:
        </p>
        <DataTable
          columns={['Mode', 'Behavior', 'Use when']}
          rows={[
            ['render (default)', 'Calls value as JSX: <value {...renderProps} />', 'value is a component and you want it rendered before passing'],
            ['constructor', 'Passes value as the component constructor: icon={Star}', 'Prop expects a component class/function, not an element'],
            ['element', 'Passes value as-is: icon={<Star />}', 'value is already a React element'],
          ]}
          monoFirstCol
          striped
        />
        <div className="mt-4">
          <CodeBlock
            language="tsx"
            code={`// 'constructor' — prop receives the component itself
definePlugin({
  valueMode: 'constructor',
  // icon={Star} is generated — the component renders it with its own props
})

// 'render' — prop receives a rendered element
definePlugin({
  valueMode: 'render',
  renderProps: { size: 20 },
  // icon={<Star size={20} />} is generated
})`}
          />
        </div>
      </Section>

      <Section title="JcPluginItem interface">
        <DataTable
          columns={['Field', 'Type', 'Required', 'Description']}
          rows={[
            ['key', 'string', 'Yes', 'Unique within the plugin — becomes the qualified key "pluginName/key"'],
            ['label', 'string', 'Yes', 'Display name shown in the picker UI'],
            ['value', 'unknown', 'Yes', 'The actual value (component, element, etc.)'],
            ['keywords', 'string[]', 'No', 'Additional search terms for the picker filter'],
          ]}
          monoFirstCol
          striped
        />
      </Section>

      <Section title="Multiple plugins">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Pass an array of plugins. Each plugin is matched independently per prop. Item keys are
          automatically qualified with the plugin name to prevent collisions:
        </p>
        <CodeBlock
          language="tsx"
          code={`<ShowcaseApp
  meta={meta}
  plugins={[lucidePlugin, myIconPlugin, nodePlugin]}
/>`}
        />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          If two plugins could match the same prop, the one with the higher cumulative score wins.
          Use <CodeBlock code="priority" inline /> to force a specific plugin when scores are equal.
        </p>
      </Section>

      <Section title="Custom Picker UI">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          By default, jc renders a simple list for plugin items. For large item sets (icons, etc.),
          use <CodeBlock code="GridPicker" inline /> from <CodeBlock code="jc/advanced" inline /> for
          a searchable grid layout:
        </p>
        <CodeBlock
          language="tsx"
          code={`import { GridPicker } from 'jc/advanced'

definePlugin({
  name: 'my-icons',
  match: { types: ['MyIconType'] },
  items: fromComponents(icons),
  Picker: GridPicker,
})`}
        />
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          For React node slots, use <CodeBlock code="NodePicker" inline /> from{' '}
          <CodeBlock code="jc/advanced" inline />. It renders items as full-size blocks rather than
          compact thumbnails.
        </p>
        <p className="text-sm text-fg-muted mt-4 leading-relaxed">
          You can also provide a completely custom picker by passing any component that satisfies{' '}
          <CodeBlock code="JcPluginPickerProps" inline /> (exported from <CodeBlock code="jc" inline />).
        </p>
      </Section>

      <Section title="Component kinds (extraction)">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          The extractor classifies component-type props into two kinds based on React-native types
          only. Library-specific types are NOT classified during extraction — plugins handle them via{' '}
          <CodeBlock code="match.types" inline />.
        </p>
        <DataTable
          columns={['TypeScript type', 'componentKind']}
          rows={[
            ['ReactNode', 'node'],
            ['ReactElement, JSX.Element', 'element'],
            ['ComponentType<T>, FC<T>', 'element'],
            ['LucideIcon, IconType, etc.', '(none — matched by plugin match.types)'],
          ]}
          monoFirstCol
          striped
        />
        <div className="mt-4">
          <Callout intent="info">
            To override the extracted kind for a custom type, use{' '}
            <CodeBlock code="componentTypeMap" inline /> in your{' '}
            <CodeBlock code="jc.config.ts" inline />. See the Configuration page for details.
          </Callout>
        </div>
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
