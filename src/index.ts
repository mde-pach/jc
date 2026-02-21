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
  JcComponentMeta,
  JcConfig,
  JcControlType,
  JcFixture,
  JcFixturePlugin,
  JcMeta,
  JcPropMeta,
} from './types.js'
