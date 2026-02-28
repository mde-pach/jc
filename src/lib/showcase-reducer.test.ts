import { describe, expect, it } from 'vitest'
import type { ChildItem, JcComponentMeta, JcExamplePreset, JcPlugin, JcPropMeta, JcResolvedPluginItem } from '../types.js'
import {
  type FixtureOverride,
  type ShowcaseDefaults,
  type ShowcaseReducerState,
  computeDefaults,
  computeFixtureInit,
  computePresetDefaults,
  createInitialState,
  showcaseReducer,
} from './showcase-reducer.js'

// ── Helpers ─────────────────────────────────────────────────

function makeDefaults(overrides?: Partial<ShowcaseDefaults>): ShowcaseDefaults {
  return {
    propValues: { variant: 'default', size: 'md' },
    childrenItems: [{ type: 'text', value: 'Hello' }],
    wrapperPropsMap: {},
    ...overrides,
  }
}

function makeState(overrides?: Partial<ShowcaseReducerState>): ShowcaseReducerState {
  return {
    ...createInitialState('Button'),
    initialized: true,
    defaults: makeDefaults(),
    propValues: { variant: 'default', size: 'md' },
    childrenItems: [{ type: 'text', value: 'Hello' }],
    ...overrides,
  }
}

// ── createInitialState ──────────────────────────────────────

describe('createInitialState', () => {
  it('creates uninitialized state with the given component name', () => {
    const state = createInitialState('Button')
    expect(state.selectedName).toBe('Button')
    expect(state.initialized).toBe(false)
    expect(state.propValues).toEqual({})
    expect(state.childrenItems).toEqual([])
    expect(state.fixtureOverrides).toEqual({})
    expect(state.presetMode).toBe('generated')
    expect(state.instanceCount).toBe(1)
  })

  it('handles null component name', () => {
    const state = createInitialState(null)
    expect(state.selectedName).toBeNull()
  })
})

// ── INITIALIZE ──────────────────────────────────────────────

describe('INITIALIZE', () => {
  it('sets defaults and marks initialized without URL restore', () => {
    const state = createInitialState('Button')
    const defaults = makeDefaults()
    const next = showcaseReducer(state, {
      type: 'INITIALIZE',
      selectedName: 'Button',
      defaults,
      urlRestore: null,
    })

    expect(next.initialized).toBe(true)
    expect(next.selectedName).toBe('Button')
    expect(next.propValues).toEqual(defaults.propValues)
    expect(next.childrenItems).toEqual(defaults.childrenItems)
    expect(next.defaults).toBe(defaults)
  })

  it('merges URL-restored state with defaults', () => {
    const state = createInitialState('Button')
    const defaults = makeDefaults()
    const next = showcaseReducer(state, {
      type: 'INITIALIZE',
      selectedName: 'Button',
      defaults,
      urlRestore: {
        props: { variant: 'destructive' },
        wrappers: { Theme: { mode: 'dark' } },
      },
    })

    expect(next.propValues).toEqual({ variant: 'destructive', size: 'md' })
    expect(next.wrapperPropsMap).toEqual({ Theme: { mode: 'dark' } })
  })

  it('restores children and fixture overrides from URL', () => {
    const state = createInitialState('Button')
    const defaults = makeDefaults()
    const override: FixtureOverride = { props: { size: 'sm' }, childrenText: 'test' }

    const next = showcaseReducer(state, {
      type: 'INITIALIZE',
      selectedName: 'Button',
      defaults,
      urlRestore: {
        children: [{ type: 'fixture', value: 'lucide/star' }],
        fixtureOverrides: { 'children:0': override },
      },
    })

    expect(next.childrenItems).toEqual([{ type: 'fixture', value: 'lucide/star' }])
    expect(next.fixtureOverrides).toEqual({ 'children:0': override })
  })
})

// ── SELECT_COMPONENT ────────────────────────────────────────

describe('SELECT_COMPONENT', () => {
  it('resets all state to defaults for the new component', () => {
    const state = makeState({
      fixtureOverrides: { 'prop:icon': { props: {}, childrenText: '' } },
      presetMode: 2,
      instanceCount: 3,
    })
    const newDefaults = makeDefaults({ propValues: { label: 'Submit' } })

    const next = showcaseReducer(state, {
      type: 'SELECT_COMPONENT',
      name: 'Badge',
      defaults: newDefaults,
    })

    expect(next.selectedName).toBe('Badge')
    expect(next.propValues).toEqual(newDefaults.propValues)
    expect(next.fixtureOverrides).toEqual({})
    expect(next.presetMode).toBe('generated')
    expect(next.instanceCount).toBe(1)
    expect(next.defaults).toBe(newDefaults)
  })
})

// ── SET_SEARCH ──────────────────────────────────────────────

describe('SET_SEARCH', () => {
  it('updates search string', () => {
    const state = makeState()
    const next = showcaseReducer(state, { type: 'SET_SEARCH', search: 'btn' })
    expect(next.search).toBe('btn')
  })
})

// ── SET_PROP ────────────────────────────────────────────────

describe('SET_PROP', () => {
  it('updates a prop value', () => {
    const state = makeState()
    const next = showcaseReducer(state, {
      type: 'SET_PROP',
      propName: 'variant',
      value: 'destructive',
    })
    expect(next.propValues.variant).toBe('destructive')
    expect(next.propValues.size).toBe('md') // unchanged
  })

  it('auto-initializes fixture override when fixtureInit is provided', () => {
    const state = makeState()
    const next = showcaseReducer(state, {
      type: 'SET_PROP',
      propName: 'icon',
      value: 'components/Star',
      fixtureInit: {
        slotKey: 'prop:icon',
        props: { size: 16 },
        childrenText: '',
      },
    })

    expect(next.propValues.icon).toBe('components/Star')
    expect(next.fixtureOverrides['prop:icon']).toEqual({
      props: { size: 16 },
      childrenText: '',
    })
  })

  it('clears fixture override when switching away from component fixture', () => {
    const state = makeState({
      fixtureOverrides: { 'prop:icon': { props: { size: 16 }, childrenText: '' } },
    })
    const next = showcaseReducer(state, {
      type: 'SET_PROP',
      propName: 'icon',
      value: 'lucide/heart',
    })

    expect(next.fixtureOverrides['prop:icon']).toBeUndefined()
  })

  it('does not clear unrelated fixture overrides', () => {
    const override: FixtureOverride = { props: {}, childrenText: 'test' }
    const state = makeState({
      fixtureOverrides: { 'children:0': override },
    })
    const next = showcaseReducer(state, {
      type: 'SET_PROP',
      propName: 'variant',
      value: 'outline',
    })

    expect(next.fixtureOverrides['children:0']).toBe(override)
  })
})

// ── ADD_CHILD ───────────────────────────────────────────────

describe('ADD_CHILD', () => {
  it('appends a child item', () => {
    const state = makeState({ childrenItems: [{ type: 'text', value: 'A' }] })
    const next = showcaseReducer(state, {
      type: 'ADD_CHILD',
      item: { type: 'text', value: 'B' },
    })
    expect(next.childrenItems).toEqual([
      { type: 'text', value: 'A' },
      { type: 'text', value: 'B' },
    ])
  })

  it('initializes fixture override when fixtureInit is provided', () => {
    const state = makeState()
    const next = showcaseReducer(state, {
      type: 'ADD_CHILD',
      item: { type: 'fixture', value: 'components/Badge' },
      fixtureInit: {
        slotKey: 'children:1',
        props: { variant: 'default' },
        childrenText: 'New',
      },
    })

    expect(next.fixtureOverrides['children:1']).toEqual({
      props: { variant: 'default' },
      childrenText: 'New',
    })
  })
})

// ── REMOVE_CHILD ────────────────────────────────────────────

describe('REMOVE_CHILD', () => {
  it('removes child at the given index', () => {
    const state = makeState({
      childrenItems: [
        { type: 'text', value: 'A' },
        { type: 'text', value: 'B' },
        { type: 'text', value: 'C' },
      ],
    })
    const next = showcaseReducer(state, { type: 'REMOVE_CHILD', index: 1 })
    expect(next.childrenItems).toEqual([
      { type: 'text', value: 'A' },
      { type: 'text', value: 'C' },
    ])
  })

  it('shifts fixture override indices after removal', () => {
    const override0: FixtureOverride = { props: { a: 1 }, childrenText: '' }
    const override1: FixtureOverride = { props: { b: 2 }, childrenText: '' }
    const override2: FixtureOverride = { props: { c: 3 }, childrenText: '' }
    const state = makeState({
      childrenItems: [
        { type: 'fixture', value: 'x' },
        { type: 'fixture', value: 'y' },
        { type: 'fixture', value: 'z' },
      ],
      fixtureOverrides: {
        'children:0': override0,
        'children:1': override1,
        'children:2': override2,
      },
    })

    const next = showcaseReducer(state, { type: 'REMOVE_CHILD', index: 1 })

    expect(next.fixtureOverrides).toEqual({
      'children:0': override0,
      'children:1': override2, // was children:2, shifted down
    })
  })

  it('preserves prop-keyed fixture overrides during child removal', () => {
    const propOverride: FixtureOverride = { props: { size: 16 }, childrenText: '' }
    const state = makeState({
      childrenItems: [
        { type: 'text', value: 'A' },
        { type: 'text', value: 'B' },
      ],
      fixtureOverrides: { 'prop:icon': propOverride },
    })

    const next = showcaseReducer(state, { type: 'REMOVE_CHILD', index: 0 })
    expect(next.fixtureOverrides['prop:icon']).toBe(propOverride)
  })
})

// ── UPDATE_CHILD ────────────────────────────────────────────

describe('UPDATE_CHILD', () => {
  it('replaces child at the given index', () => {
    const state = makeState({
      childrenItems: [{ type: 'text', value: 'old' }],
    })
    const next = showcaseReducer(state, {
      type: 'UPDATE_CHILD',
      index: 0,
      item: { type: 'text', value: 'new' },
    })
    expect(next.childrenItems[0]).toEqual({ type: 'text', value: 'new' })
  })

  it('initializes fixture override on component fixture update', () => {
    const state = makeState({
      childrenItems: [{ type: 'text', value: 'old' }],
    })
    const next = showcaseReducer(state, {
      type: 'UPDATE_CHILD',
      index: 0,
      item: { type: 'fixture', value: 'components/Badge' },
      fixtureInit: {
        slotKey: 'children:0',
        props: { variant: 'default' },
        childrenText: 'New',
      },
    })

    expect(next.fixtureOverrides['children:0']).toEqual({
      props: { variant: 'default' },
      childrenText: 'New',
    })
  })

  it('clears fixture override when switching from fixture to text', () => {
    const state = makeState({
      childrenItems: [{ type: 'fixture', value: 'components/Badge' }],
      fixtureOverrides: {
        'children:0': { props: {}, childrenText: '' },
      },
    })
    const next = showcaseReducer(state, {
      type: 'UPDATE_CHILD',
      index: 0,
      item: { type: 'text', value: 'plain text' },
    })

    expect(next.fixtureOverrides['children:0']).toBeUndefined()
  })
})

// ── SET_FIXTURE_PROP ────────────────────────────────────────

describe('SET_FIXTURE_PROP', () => {
  it('updates a prop inside a fixture override', () => {
    const state = makeState({
      fixtureOverrides: {
        'prop:icon': { props: { size: 16, color: 'red' }, childrenText: '' },
      },
    })
    const next = showcaseReducer(state, {
      type: 'SET_FIXTURE_PROP',
      slotKey: 'prop:icon',
      propName: 'size',
      value: 24,
    })

    expect(next.fixtureOverrides['prop:icon'].props.size).toBe(24)
    expect(next.fixtureOverrides['prop:icon'].props.color).toBe('red')
  })

  it('returns unchanged state if slot key does not exist', () => {
    const state = makeState()
    const next = showcaseReducer(state, {
      type: 'SET_FIXTURE_PROP',
      slotKey: 'prop:nonexistent',
      propName: 'size',
      value: 24,
    })
    expect(next).toBe(state)
  })
})

// ── SET_FIXTURE_CHILDREN ────────────────────────────────────

describe('SET_FIXTURE_CHILDREN', () => {
  it('updates children text of a fixture override', () => {
    const state = makeState({
      fixtureOverrides: {
        'children:0': { props: {}, childrenText: 'old' },
      },
    })
    const next = showcaseReducer(state, {
      type: 'SET_FIXTURE_CHILDREN',
      slotKey: 'children:0',
      text: 'new text',
    })
    expect(next.fixtureOverrides['children:0'].childrenText).toBe('new text')
  })

  it('returns unchanged state if slot key does not exist', () => {
    const state = makeState()
    const next = showcaseReducer(state, {
      type: 'SET_FIXTURE_CHILDREN',
      slotKey: 'children:99',
      text: 'x',
    })
    expect(next).toBe(state)
  })
})

// ── SET_WRAPPER_PROP ────────────────────────────────────────

describe('SET_WRAPPER_PROP', () => {
  it('sets a wrapper prop value', () => {
    const state = makeState()
    const next = showcaseReducer(state, {
      type: 'SET_WRAPPER_PROP',
      wrapperName: 'ThemeProvider',
      propName: 'mode',
      value: 'dark',
    })
    expect(next.wrapperPropsMap.ThemeProvider).toEqual({ mode: 'dark' })
  })

  it('preserves existing wrapper props', () => {
    const state = makeState({
      wrapperPropsMap: { ThemeProvider: { mode: 'light', accent: 'blue' } },
    })
    const next = showcaseReducer(state, {
      type: 'SET_WRAPPER_PROP',
      wrapperName: 'ThemeProvider',
      propName: 'mode',
      value: 'dark',
    })
    expect(next.wrapperPropsMap.ThemeProvider).toEqual({ mode: 'dark', accent: 'blue' })
  })
})

// ── SET_PRESET ──────────────────────────────────────────────

describe('SET_PRESET', () => {
  it('applies preset defaults and clears fixture overrides', () => {
    const state = makeState({
      fixtureOverrides: { 'prop:icon': { props: {}, childrenText: '' } },
      instanceCount: 3,
    })
    const applied = makeDefaults({ propValues: { variant: 'outline' } })

    const next = showcaseReducer(state, { type: 'SET_PRESET', mode: 0, applied })

    expect(next.presetMode).toBe(0)
    expect(next.propValues).toEqual(applied.propValues)
    expect(next.fixtureOverrides).toEqual({})
    expect(next.instanceCount).toBe(1) // Reset when switching to preset
  })

  it('restoring generated mode updates defaults ref', () => {
    const state = makeState({ presetMode: 0 })
    const applied = makeDefaults()

    const next = showcaseReducer(state, { type: 'SET_PRESET', mode: 'generated', applied })

    expect(next.presetMode).toBe('generated')
    expect(next.defaults).toBe(applied)
  })

  it('switching to preset does not update defaults ref', () => {
    const originalDefaults = makeDefaults()
    const state = makeState({ defaults: originalDefaults })
    const applied = makeDefaults({ propValues: { variant: 'outline' } })

    const next = showcaseReducer(state, { type: 'SET_PRESET', mode: 1, applied })
    expect(next.defaults).toBe(originalDefaults) // unchanged
  })
})

// ── SET_INSTANCE_COUNT ──────────────────────────────────────

describe('SET_INSTANCE_COUNT', () => {
  it('updates instance count', () => {
    const state = makeState()
    const next = showcaseReducer(state, { type: 'SET_INSTANCE_COUNT', count: 5 })
    expect(next.instanceCount).toBe(5)
  })
})

// ── RESET ───────────────────────────────────────────────────

describe('RESET', () => {
  it('restores all values to defaults', () => {
    const state = makeState({
      propValues: { variant: 'destructive' },
      childrenItems: [{ type: 'fixture', value: 'lucide/star' }],
      fixtureOverrides: { 'children:0': { props: {}, childrenText: '' } },
      presetMode: 2,
      instanceCount: 5,
    })
    const defaults = makeDefaults()

    const next = showcaseReducer(state, { type: 'RESET', defaults })

    expect(next.propValues).toEqual(defaults.propValues)
    expect(next.childrenItems).toEqual(defaults.childrenItems)
    expect(next.fixtureOverrides).toEqual({})
    expect(next.presetMode).toBe('generated')
    expect(next.instanceCount).toBe(1)
    expect(next.defaults).toBe(defaults)
  })
})

// ── Edge cases ──────────────────────────────────────────────

describe('edge cases', () => {
  it('unknown action type returns state unchanged', () => {
    const state = makeState()
    // biome-ignore lint/suspicious/noExplicitAny: testing unknown action type
    const next = showcaseReducer(state, { type: 'UNKNOWN' } as any)
    expect(next).toBe(state)
  })
})

// ── Helper builders for compute* tests ──────────────────────

function makePropMeta(overrides?: Partial<JcPropMeta>): JcPropMeta {
  return {
    name: 'test',
    type: 'string',
    required: false,
    defaultValue: undefined,
    description: '',
    isChildren: false,
    ...overrides,
  }
}

function makeComponentMeta(overrides?: Partial<JcComponentMeta>): JcComponentMeta {
  return {
    displayName: 'Button',
    filePath: 'src/components/button.tsx',
    description: '',
    props: {
      variant: makePropMeta({ name: 'variant', type: "'default' | 'primary'", values: ['default', 'primary'] }),
      disabled: makePropMeta({ name: 'disabled', type: 'boolean' }),
    },
    acceptsChildren: true,
    ...overrides,
  }
}

// ── computeDefaults ─────────────────────────────────────────

describe('computeDefaults', () => {
  it('generates prop values for a simple component', () => {
    const comp = makeComponentMeta()
    const result = computeDefaults(comp, [], [])
    expect(result.propValues).toBeDefined()
    expect(typeof result.propValues).toBe('object')
  })

  it('creates a text child when component accepts children', () => {
    const comp = makeComponentMeta({ acceptsChildren: true })
    const result = computeDefaults(comp, [], [])
    expect(result.childrenItems.length).toBe(1)
    expect(result.childrenItems[0].type).toBe('text')
  })

  it('creates no children when component does not accept children', () => {
    const comp = makeComponentMeta({ acceptsChildren: false })
    const result = computeDefaults(comp, [], [])
    expect(result.childrenItems).toEqual([])
  })

  it('returns empty wrapperPropsMap when no wrappers', () => {
    const comp = makeComponentMeta()
    const result = computeDefaults(comp, [], [])
    expect(result.wrapperPropsMap).toEqual({})
  })

  it('computes wrapper props from allComponents', () => {
    const wrapper = makeComponentMeta({
      displayName: 'Tooltip',
      props: { content: makePropMeta({ name: 'content', type: 'string' }) },
      acceptsChildren: false,
    })
    const comp = makeComponentMeta({
      wrapperComponents: [{ displayName: 'Tooltip', defaultProps: { side: 'top' } as Record<string, string> }],
    })
    const result = computeDefaults(comp, [], [], [comp, wrapper])
    expect(result.wrapperPropsMap.Tooltip).toBeDefined()
    expect(result.wrapperPropsMap.Tooltip.side).toBe('top')
  })

  it('uses defaultProps when wrapper not found in allComponents', () => {
    const comp = makeComponentMeta({
      wrapperComponents: [{ displayName: 'Missing', defaultProps: { x: '1' } }],
    })
    const result = computeDefaults(comp, [], [], [comp])
    expect(result.wrapperPropsMap.Missing).toEqual({ x: '1' })
  })
})

// ── computePresetDefaults ───────────────────────────────────

describe('computePresetDefaults', () => {
  const basePreset: JcExamplePreset = {
    index: 0,
    propValues: {},
    childrenText: '',
    parsedChildren: [],
    wrapperProps: {},
  }

  it('overlays string prop values from preset', () => {
    const comp = makeComponentMeta()
    const preset: JcExamplePreset = { ...basePreset, propValues: { variant: 'primary' } }
    const result = computePresetDefaults(comp, preset, [], [])
    expect(result.propValues.variant).toBe('primary')
  })

  it('coerces boolean string to boolean', () => {
    const comp = makeComponentMeta()
    const preset: JcExamplePreset = { ...basePreset, propValues: { disabled: 'true' } }
    const result = computePresetDefaults(comp, preset, [], [])
    expect(result.propValues.disabled).toBe(true)
  })

  it('coerces "false" to boolean false', () => {
    const comp = makeComponentMeta()
    const preset: JcExamplePreset = { ...basePreset, propValues: { disabled: 'false' } }
    const result = computePresetDefaults(comp, preset, [], [])
    expect(result.propValues.disabled).toBe(false)
  })

  it('coerces number string to number', () => {
    const comp = makeComponentMeta({
      props: { count: makePropMeta({ name: 'count', type: 'number' }) },
    })
    const preset: JcExamplePreset = { ...basePreset, propValues: { count: '42' } }
    const result = computePresetDefaults(comp, preset, [], [])
    expect(result.propValues.count).toBe(42)
  })

  it('skips unknown props', () => {
    const comp = makeComponentMeta()
    const preset: JcExamplePreset = { ...basePreset, propValues: { nonexistent: 'val' } }
    const result = computePresetDefaults(comp, preset, [], [])
    expect(result.propValues.nonexistent).toBeUndefined()
  })

  it('parses array string values for array type props', () => {
    const comp = makeComponentMeta({
      props: { items: makePropMeta({ name: 'items', type: 'string[]' }) },
    })
    const preset: JcExamplePreset = { ...basePreset, propValues: { items: '["a","b"]' } }
    const result = computePresetDefaults(comp, preset, [], [])
    expect(result.propValues.items).toEqual(['a', 'b'])
  })

  it('falls back to string for unparseable array value', () => {
    const comp = makeComponentMeta({
      props: { items: makePropMeta({ name: 'items', type: 'string[]' }) },
    })
    const preset: JcExamplePreset = { ...basePreset, propValues: { items: 'not-an-array' } }
    const result = computePresetDefaults(comp, preset, [], [])
    expect(result.propValues.items).toBe('not-an-array')
  })

  it('parses structured object from JS literal', () => {
    const comp = makeComponentMeta({
      props: {
        contact: makePropMeta({
          name: 'contact',
          type: 'ContactInfo',
          structuredFields: [{ name: 'email', type: 'string', optional: false, isComponent: false }],
        }),
      },
    })
    const preset: JcExamplePreset = {
      ...basePreset,
      propValues: { contact: '{ email: "test@test.com" }' },
    }
    const result = computePresetDefaults(comp, preset, [], [])
    expect(result.propValues.contact).toEqual({ email: 'test@test.com' })
  })

  it('uses childrenText when no parsedChildren', () => {
    const comp = makeComponentMeta({ acceptsChildren: true })
    const preset: JcExamplePreset = { ...basePreset, childrenText: 'Click me' }
    const result = computePresetDefaults(comp, preset, [], [])
    expect(result.childrenItems).toEqual([{ type: 'text', value: 'Click me' }])
  })

  it('uses parsedChildren text items', () => {
    const comp = makeComponentMeta({ acceptsChildren: true })
    const preset: JcExamplePreset = {
      ...basePreset,
      parsedChildren: [{ type: 'text', value: 'Hello world' }],
    }
    const result = computePresetDefaults(comp, preset, [], [])
    expect(result.childrenItems).toEqual([{ type: 'text', value: 'Hello world' }])
  })

  it('resolves PascalCase element children as fixture references', () => {
    const resolvedItems: JcResolvedPluginItem[] = [
      {
        key: 'star',
        label: 'Star',
        value: () => null,
        pluginName: 'lucide',
        qualifiedKey: 'lucide/star',
        render: () => null,
        renderPreview: () => null,
        getValue: () => null,
      },
    ]
    const comp = makeComponentMeta({ acceptsChildren: true })
    const preset: JcExamplePreset = {
      ...basePreset,
      parsedChildren: [{ type: 'element', value: 'Star' }],
    }
    const result = computePresetDefaults(comp, preset, [], resolvedItems)
    expect(result.childrenItems).toEqual([{ type: 'fixture', value: 'lucide/star' }])
  })

  it('converts lowercase element children to element ChildItem', () => {
    const comp = makeComponentMeta({ acceptsChildren: true })
    const preset: JcExamplePreset = {
      ...basePreset,
      parsedChildren: [{ type: 'element', value: 'span', innerText: 'hello', props: { className: 'bold' } }],
    }
    const result = computePresetDefaults(comp, preset, [], [])
    expect(result.childrenItems[0].type).toBe('element')
    expect(result.childrenItems[0].value).toBe('span')
  })

  it('merges wrapper props from preset', () => {
    const comp = makeComponentMeta()
    const preset: JcExamplePreset = {
      ...basePreset,
      wrapperProps: { Tooltip: { content: 'Help text' } },
    }
    const result = computePresetDefaults(comp, preset, [], [])
    expect(result.wrapperPropsMap.Tooltip).toEqual({ content: 'Help text' })
  })
})

// ── computeFixtureInit ──────────────────────────────────────

describe('computeFixtureInit', () => {
  it('returns init data for a known component', () => {
    const comp = makeComponentMeta({ displayName: 'Badge', acceptsChildren: true })
    const result = computeFixtureInit('prop:icon', 'Badge', [comp], [], [])
    expect(result).toBeDefined()
    expect(result?.slotKey).toBe('prop:icon')
    expect(typeof result?.props).toBe('object')
    expect(typeof result?.childrenText).toBe('string')
    expect(result?.childrenText.length).toBeGreaterThan(0)
  })

  it('returns undefined for unknown component', () => {
    const result = computeFixtureInit('prop:icon', 'NonExistent', [], [], [])
    expect(result).toBeUndefined()
  })

  it('returns empty childrenText when component does not accept children', () => {
    const comp = makeComponentMeta({ displayName: 'Icon', acceptsChildren: false })
    const result = computeFixtureInit('prop:icon', 'Icon', [comp], [], [])
    expect(result).toBeDefined()
    expect(result?.childrenText).toBe('')
  })
})
