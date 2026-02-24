/**
 * just-components (jc) — public API
 *
 * Components: ShowcaseApp (root showcase UI) + sub-components
 * Fixtures:   defineFixtures (type-safe plugin builder)
 * State:      useShowcaseState (central hook)
 * Types:      JcMeta, JcComponentMeta, JcFixture, JcFixturePlugin, etc.
 */

export { ComponentFixtureEditor, FixturePicker, ShowcaseField } from './components/field/index.js'
export type { ShowcaseRenderContext } from './components/showcase-app.js'
// Root app
export { ShowcaseApp } from './components/showcase-app.js'
export { ShowcaseControls } from './components/showcase-controls.js'
// Sub-components
export { ShowcasePreview } from './components/showcase-preview.js'
export { ShowcaseSidebar } from './components/showcase-sidebar.js'
export { ThemeToggle } from './components/theme-toggle.js'
export { ViewportPicker } from './components/viewport-picker.js'
// Utilities
export { defineFixtures, resolveFixturePlugins, resolveFixtureValue } from './lib/fixtures.js'
export { useResolvedComponent } from './lib/use-resolved-component.jsx'
export type { FixtureOverride, ShowcaseState } from './lib/use-showcase-state.js'
// State
export { useShowcaseState } from './lib/use-showcase-state.js'

// Theme
export type { JcTheme } from './lib/use-theme.js'

// Types
export type {
  ChildItem,
  JcComponentMeta,
  JcConfig,
  JcControlType,
  JcFixture,
  JcFixturePlugin,
  JcMeta,
  JcPropMeta,
  JcResolvedFixture,
} from './types.js'
