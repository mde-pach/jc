/**
 * jc/advanced — exports for custom layouts, state management, and internal utilities.
 *
 * Most consumers only need the main `jc` entry point (ShowcaseApp, definePlugin, etc.).
 * Import from `jc/advanced` when building custom showcase layouts with the render prop,
 * or when you need direct access to the state reducer, context, or faker system.
 */

// Sub-components for custom layouts
export { ShowcaseControls } from './components/showcase-controls.js'
export { ShowcasePreview } from './components/showcase-preview.js'
export { ShowcaseSidebar } from './components/showcase-sidebar.js'
export { ThemeToggle } from './components/theme-toggle.js'
export { ViewportPicker } from './components/viewport-picker.js'

// Field controls (for building entirely custom control panels)
export { ComponentFixtureEditor, FixturePicker, ShowcaseField } from './components/field/index.js'

// Primitives for plugin authors
export { GridPicker } from './components/field/grid-picker.js'
export { NodePicker } from './components/field/node-field-input.js'

// State hook
export { useShowcaseState } from './lib/use-showcase-state.js'
export type { FixtureOverride, ShowcaseState } from './lib/use-showcase-state.js'

// Resolved component hook
export { useResolvedComponent } from './lib/use-resolved-component.jsx'

// Pure reducer (testable without React)
export {
  showcaseReducer,
  createInitialState,
  computeDefaults,
  computePresetDefaults,
  computeFixtureInit,
} from './lib/showcase-reducer.js'
export type {
  ShowcaseAction,
  ShowcaseReducerState,
  ShowcaseDefaults,
  FixtureInitData,
  UrlRestoreData,
} from './lib/showcase-reducer.js'

// Context (eliminates prop drilling in custom layouts)
export {
  ShowcaseProvider,
  useShowcaseContext,
  useOptionalShowcaseContext,
} from './lib/showcase-context.js'
export type { ShowcaseContextValue } from './lib/showcase-context.js'

// Fixture registry (O(1) lookups, clearable for tests)
export { FixtureRegistry } from './lib/fixture-registry.js'

// Fixture rendering utilities
export { renderComponentFixture, fixtureToCodeString } from './lib/fixtures.js'

// Plugin internals
export { resolvePluginItems, resolveItemValue, resolveValueMode, getPluginForProp, getItemsForProp, suggestPluginForProp, clearPluginCaches } from './lib/plugins.js'

// Faker strategy (extensible default value generation)
export { createFakerResolver, defineFakerStrategy } from './lib/faker-strategy.js'
export type { FakerStrategy } from './lib/faker-strategy.js'
