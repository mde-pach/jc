# Documentation Improvement Analysis

## Critical Issue: API Migration Not Reflected in Docs

The most urgent problem: **every documentation page references the old fixture API that no longer exists.** A new user following the docs will write code that does not compile.

| Old API (documented everywhere) | Current API (actual) |
|---|---|
| `defineFixtures()` | `definePlugin()` |
| `fixtures={[...]}` prop | `plugins={[...]}` prop |
| `category: 'icons'` matching | `match: { types: ['LucideIcon'] }` scoring |
| `kind: 'icon'` | `JcComponentPropKind: 'element' \| 'node'` only |
| `component` field on items | `value` field + `valueMode` on plugin |
| Manual Lucide setup | `import { lucidePlugin } from 'jc/plugins/lucide'` |
| `meta as unknown as JcMeta` | `loadMeta(meta)` |

---

## README.md Analysis

**File:** `/README.md` (97 lines)

### Issues
1. **Outdated quick start** — Shows `meta as unknown as JcMeta` instead of `loadMeta(meta)`
2. **No mention of plugin system** — `plugins` prop, `definePlugin`, `fromComponents`, `lucidePlugin` all absent
3. **No mention of `jc/react` adapter** — `createShowcase()` for Vite/CRA undocumented
4. **No mention of `jc/advanced`** — Power users have no guidance
5. **Missing badges** — No CI status, npm version, or license badges
6. **Stale test count** — Says "316 tests", actual count is 528
7. **No visual** — No screenshot, GIF, or link to deployed demo
8. **Missing `loadMeta` in examples**

---

## Example App Docs Pages

All at `example/src/app/(site)/docs/`. Five pages exist.

### Getting Started (`getting-started/page.tsx`)
- Shows stale `defineFixtures()` and `fixtures={[lucideFixtures]}` pattern
- Shows `meta as unknown as JcMeta` instead of `loadMeta(meta)`
- Says `bun add jc` but README says package is NOT on npm
- No mention of zero-config `lucidePlugin`

### Configuration (`configuration/page.tsx`)
- Wrong option names: lists `componentFiles` but actual field is `componentGlob`/`componentGlobs`
- Wrong defaults: shows `**/*.test.*` but actual default is `['index.ts', 'toaster.tsx', 'form.tsx']`
- Missing options: omits `excludeComponents`, `componentTypeMap`, `extractor`
- Lists `tsConfigPath` which doesn't exist in `JcConfig`
- Shows array for `componentFiles` but type is `componentGlob: string`

### Fixtures (`fixtures/page.tsx`)
- **Entirely outdated** — Documents `defineFixtures()` with `category`, `render`, `renderPreview`
- Actual API: `definePlugin()` with `match`, `items`, `valueMode`, `renderProps`, `previewProps`, `Picker`
- Old matching: `kind: "icon"` → `category: "icons"`. Real: scored matching with types/componentKind/propName
- `"icon"` kind no longer exists — only `'element' | 'node'`

### API Reference (`api/page.tsx`)
- Lists `defineFixtures` and `FixturePlugin` which don't exist
- Missing: `jc/advanced`, `jc/react`, `jc/plugins/lucide` entry points
- Missing ShowcaseApp props: `plugins`, `wrapper`, `initialComponent`, `syncUrl`, `children`
- Type definitions wrong: shows `ComponentMeta`, `PropMeta` (actual: `JcComponentMeta`, `JcPropMeta`)
- Shows `enumValues` (actual: `values`), `kind` (actual: `componentKind`)
- No plugin system types: `JcPlugin`, `JcPluginMatch`, `JcPluginItem`, etc.

### Frameworks (`frameworks/page.tsx`)
- Shows `fixtures: [lucideFixtures]` instead of `plugins: [lucidePlugin]`
- Shows `as unknown as JcMeta` instead of `loadMeta()`
- Missing `jc/react` adapter (`createShowcase()` for Vite/CRA)
- No Remix mention despite detection in `detect-environment.ts`

---

## CLAUDE.md Analysis

**File:** `/CLAUDE.md` (~180 lines)

### Issues
1. Test count discrepancy: says "316 tests" (actual: 528)
2. Old "Fixture system" section — should describe plugin system with scored matching
3. Mentions `kind: 'icon'` which no longer exists
4. Structure section outdated — missing `src/react.tsx`, `src/plugins/`, `src/extract/extractor.ts`, `src/extract/pipeline.ts`, `src/extract/discover.ts`, etc.
5. Package exports table lists 3 entry points (actual: 6)
6. Missing key patterns: `ShowcaseProvider`/`useShowcaseContext`, `loadMeta()`, `FakerStrategy`, auto-discovery

---

## JSDoc Coverage

### Strong
- `types.ts` — Every interface/type has JSDoc, fields documented
- `plugins.ts` — All exported functions with `@example` tags
- `next.tsx`, `react.tsx` — Good JSDoc with `@example` blocks
- `faker-strategy.ts` — Excellent JSDoc with full `@example`
- `showcase-reducer.ts` — Module-level doc explaining reducer/hook separation
- `showcase-context.tsx` — All exports have JSDoc
- `extractor.ts`, `discover.ts`, `pipeline.ts`, `cli.ts` — Good coverage

### Gaps
- `showcase-sidebar.tsx` — No module-level JSDoc, no JSDoc on props interface
- `faker-map.ts` — `resolveControlType()`, `generateFakeValue()` have minimal JSDoc
- `config.ts` — `resolveConfig()` has no `@param`/`@returns`
- `url-sync.ts` — Single-line JSDoc, no `@param`/`@returns`
- `showcase-controls.tsx` — ~20 fields in props interface with no per-field JSDoc
- `showcase-preview.tsx` — ~15 fields in props interface with no per-field JSDoc

---

## package.json Metadata

- Description is informative but wordy
- Missing `homepage` field
- Missing `author` field
- Keywords could be expanded (add: "zero-config", "playground", "documentation", "design-system", "next.js", "vite")
- No `funding` field

---

## Missing Documentation Entirely

| Document | Priority | Rationale |
|----------|----------|-----------|
| **LICENSE file** | Critical | package.json says MIT but no LICENSE file exists |
| **Plugin authoring guide** | High | Main extension point, only JSDoc exists |
| **Migration guide (fixtures→plugins)** | High | Old API documented everywhere, users need migration path |
| **CHANGELOG.md** | High | No way to know what changed between commits |
| **CLI reference** | Medium | `--watch`, `--json`, `--verbose`, `--config` flags undocumented |
| **Custom layout guide** | Medium | Render prop API and `jc/advanced` exports |
| **@example JSDoc guide** | Medium | Wrapper detection and preset system |
| **CONTRIBUTING.md** | Medium | Only 5-line section in README |
| **jc/plugins/lucide docs** | Medium | Zero-config plugin has no documentation page |
| **Architecture overview** | Low | For contributors (currently only in CLAUDE.md) |

---

## Documentation Infrastructure

**Current:** Docs are TSX pages in the example app at `example/src/app/(site)/docs/`. No deployed URL, no Markdown-based docs, no auto-generated API reference, no search.

**Problems:**
- Requires running example app locally to view docs
- TSX harder to contribute to than Markdown
- No TypeDoc/TSDoc auto-generated reference
- 5-page sidebar with no search

---

## Prioritized Recommendations

### Critical (docs are currently misleading)

1. **Update all 5 example docs pages** to use current plugin API (`definePlugin`, `plugins`, `loadMeta`)
2. **Rename "Fixtures" page to "Plugins"** and rewrite with current API
3. **Update API Reference** to list actual exports from all 6 entry points with correct type definitions
4. **Update README** quick start to use `loadMeta()` and mention `lucidePlugin`
5. **Add LICENSE file**

### High (significant gaps)

6. Create **"Plugin Authoring"** docs page covering `definePlugin`, `fromComponents`, `match` scoring, `valueMode`, custom `Picker`, `priority`
7. Create **CHANGELOG.md** with current state
8. Add **CLI reference** section (flags, config resolution, watch mode, JSON output)
9. **Update Configuration docs** with correct option names, types, defaults from actual `JcConfig`
10. **Fix test count** in README and CLAUDE.md (316 → 528)

### Medium (polish)

11. Add **"Custom Layouts"** docs page (render prop, `jc/advanced` exports)
12. Add **screenshot/GIF** to README
13. **Deploy example app** so docs are accessible online
14. Add **CONTRIBUTING.md** with architecture overview, PR process, test expectations
15. **Update CLAUDE.md** project structure and entry points to current state
16. Add **per-field JSDoc** to `ShowcaseControlsProps` and `ShowcasePreviewProps`
17. Add **`@param`/`@returns`** tags to core functions in config.ts, faker-map.ts, url-sync.ts

### Low (nice-to-have)

18. Add `homepage` and `author` to package.json
19. Expand package.json keywords
20. Consider auto-generated TypeDoc API reference
21. Add `@example` JSDoc authoring guide
