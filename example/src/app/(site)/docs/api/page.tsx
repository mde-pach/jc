import { CodeBlock } from '@/components/ui/data-display/code-block'
import { DataTable } from '@/components/ui/data-display/data-table'
import { Callout } from '@/components/ui/feedback/callout'

export default function ApiPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-fg mb-2">API Reference</h1>
      <p className="text-fg-muted text-lg mb-12 leading-relaxed">
        Exports, component props, and type definitions across all six entry points.
      </p>

      <Section title="Package exports — jc">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          The main entry point. Import the root component, plugin utilities, the meta loader, and
          all public TypeScript types from here.
        </p>
        <DataTable
          columns={['Export', 'Kind', 'Description']}
          rows={[
            ['ShowcaseApp', 'component', 'Root showcase UI component'],
            ['definePlugin', 'function', 'Create a typed plugin factory'],
            ['fromComponents', 'function', 'Auto-generate plugin items from a module export map'],
            ['loadMeta', 'function', 'Type-safe meta.json loader — eliminates manual casts'],
            ['JcMeta', 'type', 'Shape of the extracted meta.json file'],
            ['JcComponentMeta', 'type', 'Metadata for a single component'],
            ['JcPropMeta', 'type', 'Metadata for a single prop'],
            ['JcPlugin', 'type', 'A resolved plugin object'],
            ['JcPluginItem', 'type', 'A single item inside a plugin'],
            ['JcPluginMatch', 'type', 'Match rules for routing props to a plugin'],
            ['JcPluginPickerProps', 'type', 'Props passed to a plugin picker component'],
            ['JcResolvedPluginItem', 'type', 'Plugin item after value resolution'],
            ['JcConfig', 'type', 'Full jc.config.ts configuration shape'],
            ['JcControlType', 'type', "Union of all control type strings (e.g. 'text', 'select')"],
            ['JcComponentPropKind', 'type', "Union 'element' | 'node'"],
            ['JcStructuredField', 'type', 'A field inside an object/array prop'],
            ['JcChildrenType', 'type', 'Describes how a component accepts children'],
            ['ChildItem', 'type', 'A child item definition'],
            ['ExtractionResult', 'type', 'Output from a full extraction run'],
            ['ExtractionWarning', 'type', 'Non-fatal warning produced during extraction'],
            ['JcTheme', 'type', "Theme identifier: 'light' | 'dark'"],
            ['ShowcaseRenderContext', 'type', 'Context object passed to the render prop children'],
          ]}
          monoFirstCol
          striped
        />
      </Section>

      <Section title="Package exports — jc/advanced">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Sub-components, state primitives, and plugin internals for custom layouts. Import from{' '}
          <CodeBlock code="jc/advanced" inline /> when you need to compose your own showcase shell.
        </p>
        <DataTable
          columns={['Export', 'Kind', 'Description']}
          rows={[
            ['ShowcaseControls', 'component', 'Prop editor panel'],
            ['ShowcasePreview', 'component', 'Live render + syntax-highlighted code'],
            ['ShowcaseSidebar', 'component', 'Component list with search'],
            ['ThemeToggle', 'component', 'Light / dark theme switcher'],
            ['ViewportPicker', 'component', 'Responsive viewport preset picker'],
            ['ShowcaseField', 'component', 'Dispatcher that renders the correct control for a prop'],
            ['FixturePicker', 'component', 'Picker UI for plugin-backed props'],
            ['ComponentFixtureEditor', 'component', 'Editor for component-type props'],
            ['GridPicker', 'component', 'Primitive grid-based item picker'],
            ['NodePicker', 'component', 'Primitive node/element picker'],
            ['useShowcaseState', 'hook', 'Central showcase state hook'],
            ['useResolvedComponent', 'hook', 'Resolves fixtures + props into a rendered element'],
            ['showcaseReducer', 'function', 'Pure state reducer'],
            ['createInitialState', 'function', 'Creates initial reducer state from meta + plugins'],
            ['computeDefaults', 'function', 'Computes default prop values from meta'],
            ['computePresetDefaults', 'function', 'Computes prop values from a preset'],
            ['computeFixtureInit', 'function', 'Initialises fixture overrides from plugins'],
            ['ShowcaseProvider', 'component', 'Context provider for the showcase state'],
            ['useShowcaseContext', 'hook', 'Reads showcase context (throws when absent)'],
            ['useOptionalShowcaseContext', 'hook', 'Reads showcase context (returns null when absent)'],
            ['FixtureRegistry', 'class', 'Registry that maps qualified keys to fixture items'],
            ['resolvePluginItems', 'function', 'Resolves all items for a given plugin'],
            ['resolveItemValue', 'function', 'Resolves the runtime value of a plugin item'],
            ['resolveValueMode', 'function', "Determines a plugin item's value mode"],
            ['getPluginForProp', 'function', 'Returns the best-matching plugin for a prop'],
            ['getItemsForProp', 'function', 'Returns all plugin items eligible for a prop'],
            ['suggestPluginForProp', 'function', 'Suggests a plugin for a prop without a match'],
            ['renderComponentFixture', 'function', 'Renders a component fixture to a React element'],
            ['fixtureToCodeString', 'function', 'Serialises a fixture value to a JSX code string'],
            ['createFakerResolver', 'function', 'Creates a faker-based default value resolver'],
            ['defineFakerStrategy', 'function', 'Registers a custom faker strategy for a prop pattern'],
          ]}
          monoFirstCol
          striped
        />
      </Section>

      <Section title="Package exports — jc/config">
        <DataTable
          columns={['Export', 'Kind', 'Description']}
          rows={[
            ['defineConfig', 'function', 'Type-safe config helper with autocomplete'],
            ['resolveConfig', 'function', 'Merges a user config with default values'],
            ['defaultConfig', 'object', 'Default configuration object'],
            ['Extractor', 'type', 'Interface a custom extractor must implement'],
            ['ExtractorContext', 'type', 'Context passed to an extractor at run time'],
            ['ExtractorOutput', 'type', 'Value an extractor must return'],
          ]}
          monoFirstCol
          striped
        />
      </Section>

      <Section title="Package exports — jc/next · jc/react · jc/plugins/lucide">
        <DataTable
          columns={['Import Path', 'Export', 'Description']}
          rows={[
            ['jc/next', 'createShowcasePage(options)', 'Next.js App Router page factory'],
            ['jc/react', 'createShowcase(options)', 'Vite / CRA adapter'],
            ['jc/plugins/lucide', 'lucidePlugin', 'Zero-config lucide-react plugin factory'],
            ['jc/plugins/lucide', 'lucide(options?)', 'Customisable lucide-react plugin'],
          ]}
          monoFirstCol
          striped
        />
      </Section>

      <Section title="ShowcaseApp props">
        <DataTable
          columns={['Prop', 'Type', 'Required', 'Description']}
          rows={[
            ['meta', 'JcMeta | unknown', 'Yes', 'Extracted component metadata from meta.json'],
            [
              'registry',
              "Record<string, () => Promise<ComponentType<any>>>",
              'Yes',
              'Lazy component import map (one entry per component)',
            ],
            [
              'plugins',
              "Array<JcPlugin | (() => JcPlugin)>",
              'No',
              'Plugin factories for component-type props (icon, node, element)',
            ],
            [
              'wrapper',
              'ComponentType<{ children: ReactNode }>',
              'No',
              'Global wrapper rendered around every component preview',
            ],
            ['initialComponent', 'string', 'No', 'Display name of the component selected on first render'],
            ['syncUrl', 'boolean', 'No', 'Persist state in the URL (default: true)'],
            [
              'children',
              '(ctx: ShowcaseRenderContext) => ReactNode',
              'No',
              'Render prop for fully custom layouts — receives state, theme, and sub-components',
            ],
          ]}
          monoFirstCol
          striped
        />
      </Section>

      <Section title="Type definitions">
        <CodeBlock
          language="ts"
          code={`// meta.json shape
interface JcMeta {
  components: JcComponentMeta[]
}

interface JcComponentMeta {
  displayName: string
  filePath: string
  description: string
  props: Record<string, JcPropMeta>   // keyed by prop name
  acceptsChildren: boolean
  childrenType?: JcChildrenType
  exportType?: 'named' | 'default'
  usageCount?: number
  tags?: Record<string, string>
  wrapperComponents?: WrapperComponent[]
  examples?: ComponentExample[]
}

interface JcPropMeta {
  name: string
  type: string
  rawType?: string
  values?: string[]                      // enum / literal union options
  required: boolean
  defaultValue?: string
  description: string
  isChildren: boolean
  componentKind?: JcComponentPropKind    // present when prop accepts React content
  structuredFields?: JcStructuredField[]
}

// 'element' = ComponentType / JSX.Element
// 'node'    = ReactNode (any renderable value)
type JcComponentPropKind = 'element' | 'node'

type JcControlType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiline'
  | 'json'
  | 'readonly'
  | 'component'
  | 'array'
  | 'object'`}
        />
      </Section>

      <Section title="Plugin API">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Plugins route component-type props (icons, design-system elements, etc.) to a visual
          picker. Use <CodeBlock code="definePlugin" inline /> to create a typed factory, then pass
          the factory to <CodeBlock code="ShowcaseApp" inline />.
        </p>
        <CodeBlock
          language="tsx"
          code={`import { definePlugin, fromComponents } from 'jc'
import * as Icons from 'my-icon-library'

const myIconPlugin = definePlugin({
  name: 'my-icons',
  match: {
    types: ['MyIconType'],           // prop type strings to match
    componentKind: 'element',        // 'element' | 'node'
  },
  items: fromComponents(Icons),      // auto-generate items from module exports
  Picker: MyIconPicker,              // custom picker component
})

// In your showcase page:
<ShowcaseApp
  meta={meta}
  registry={registry}
  plugins={[myIconPlugin]}
/>`}
        />

        <div className="mt-6">
          <h3 className="text-base font-semibold text-fg mb-3">JcPlugin interface</h3>
          <DataTable
            columns={['Field', 'Type', 'Description']}
            rows={[
              ['name', 'string', 'Unique plugin identifier'],
              ['match', 'JcPluginMatch', 'Rules for matching props to this plugin'],
              ['items', 'JcPluginItem[]', 'The pickable values this plugin provides'],
              ['Picker', 'ComponentType<JcPluginPickerProps>', 'Custom picker UI component'],
              ['priority', 'number?', 'Tie-break order when multiple plugins match (higher wins)'],
            ]}
            monoFirstCol
            striped
          />
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold text-fg mb-3">JcPluginMatch interface</h3>
          <DataTable
            columns={['Field', 'Type', 'Description']}
            rows={[
              ['types', 'string[]?', 'Prop type strings that trigger this plugin'],
              ['componentKind', "JcComponentPropKind?", "Match by 'element' or 'node' kind"],
              ['propName', 'RegExp | string?', 'Match by prop name pattern'],
            ]}
            monoFirstCol
            striped
          />
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold text-fg mb-3">valueMode</h3>
          <DataTable
            columns={['Mode', 'Description']}
            rows={[
              ["'render' (default)", 'Item value is a React element — rendered directly'],
              ["'constructor'", 'Item value is a ComponentType — instantiated with current props'],
              ["'element'", 'Item value is a JSX element factory — called at render time'],
            ]}
            monoFirstCol
            striped
          />
        </div>
      </Section>

      <Section title="Wrapper detection">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          Some components must render inside a parent — for example{' '}
          <CodeBlock code="AccordionItem" inline /> inside <CodeBlock code="Accordion" inline />.
          jc detects this automatically from <CodeBlock code="@example" inline /> JSDoc tags:
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
          component name and its props. The showcase renders the wrapper automatically in the
          preview, and surfaces separate controls for wrapper props.
        </p>
        <div className="mt-4">
          <Callout intent="info" title="Multiple examples">
            A component can have multiple <CodeBlock code="@example" inline /> tags. Each becomes a
            selectable one-click preset in the showcase UI, with prop values extracted from the
            example JSX.
          </Callout>
        </div>
      </Section>

      <Section title="loadMeta">
        <p className="text-sm text-fg-muted mb-4 leading-relaxed">
          <CodeBlock code="loadMeta" inline /> is a thin type-safe wrapper around a JSON import.
          Use it instead of casting manually:
        </p>
        <CodeBlock
          language="ts"
          code={`// Before
import raw from '../jc/generated/meta.json'
const meta = raw as unknown as JcMeta

// After
import { loadMeta } from 'jc'
import raw from '../jc/generated/meta.json'
const meta = loadMeta(raw)   // typed as JcMeta, no cast needed`}
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
