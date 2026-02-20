/**
 * just-components (jc) — public API
 *
 * Components: ShowcaseApp (root showcase UI)
 * Fixtures:   defineFixtures (type-safe plugin builder)
 * Types:      JcMeta, JcComponentMeta, JcFixture, JcFixturePlugin, etc.
 */

export { ShowcaseApp } from './components/showcase-app.js'
export { defineFixtures } from './lib/fixtures.js'
export type {
  JcMeta,
  JcComponentMeta,
  JcPropMeta,
  JcControl,
  JcControlType,
  JcConfig,
  JcFixture,
  JcFixturePlugin,
} from './types.js'
