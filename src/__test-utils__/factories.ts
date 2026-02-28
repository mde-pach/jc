/**
 * Shared test factories for jc test suites.
 * Provides consistent defaults for JcPropMeta, JcComponentMeta,
 * JcPlugin, and JcResolvedPluginItem construction.
 */

import type {
  JcComponentMeta,
  JcPlugin,
  JcPropMeta,
  JcResolvedPluginItem,
} from '../types.js'

/** Create a JcPropMeta with sensible defaults */
export function makeProp(overrides: Partial<JcPropMeta> = {}): JcPropMeta {
  return {
    name: 'test',
    type: 'string',
    required: false,
    description: '',
    isChildren: false,
    ...overrides,
  }
}

/** Create a JcComponentMeta with sensible defaults */
export function makeComponent(overrides: Partial<JcComponentMeta> = {}): JcComponentMeta {
  return {
    displayName: 'TestComponent',
    filePath: 'src/components/ui/test.tsx',
    description: '',
    props: {},
    acceptsChildren: false,
    ...overrides,
  }
}

/** Create a minimal JcPlugin */
export function makePlugin(overrides: Partial<JcPlugin> = {}): JcPlugin {
  return {
    name: 'test-plugin',
    match: { types: ['TestType'] },
    items: [],
    ...overrides,
  }
}

/** Create a JcResolvedPluginItem */
export function makeResolvedItem(
  overrides: Partial<JcResolvedPluginItem> = {},
): JcResolvedPluginItem {
  return {
    key: 'test-item',
    label: 'TestItem',
    value: () => null,
    pluginName: 'test-plugin',
    qualifiedKey: 'test-plugin/test-item',
    render: () => 'rendered',
    renderPreview: () => 'preview',
    getValue: () => overrides.value ?? (() => null),
    ...overrides,
  }
}
