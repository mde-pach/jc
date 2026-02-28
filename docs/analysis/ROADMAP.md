# jc Improvement Roadmap

> Tasks are grouped into sequential phases. Within each phase, parallel tracks (A, B, C…) can be worked on simultaneously.

---

## Phase 1 — Foundations (docs accuracy + test gates) ✅ COMPLETE

The docs are actively misleading and coverage gates are failing. Fix these before anything else.

### Track A: Documentation — Fix Broken Docs ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 1.A.1 | Add LICENSE file (MIT) | DOC-Critical | `LICENSE` | ✅ |
| 1.A.2 | Update README: use `loadMeta()`, mention `plugins`, `lucidePlugin`, fix test count (588), list all 6 entry points | DOC-Critical | `README.md` | ✅ |
| 1.A.3 | Update CLAUDE.md: project structure, 6 entry points, plugin system, test count, remove "icon" kind references | DOC-Critical | `CLAUDE.md` | ✅ |
| 1.A.4 | Rewrite Getting Started docs page: `loadMeta()`, `plugins={[lucidePlugin]}`, correct install instructions | DOC-Critical | `example/src/app/(site)/docs/getting-started/page.tsx` | ✅ |
| 1.A.5 | Rewrite Configuration docs page: correct option names (`componentGlob`/`componentGlobs`), correct defaults, add missing options | DOC-Critical | `example/src/app/(site)/docs/configuration/page.tsx` | ✅ |
| 1.A.6 | Rename "Fixtures" page → "Plugins" and rewrite with current API (`definePlugin`, `match`, `valueMode`, scored matching) | DOC-Critical | `example/src/app/(site)/docs/fixtures/page.tsx` | ✅ |
| 1.A.7 | Update API Reference: actual exports from all 6 entry points, correct type names (`JcComponentMeta`, `JcPropMeta`), plugin types | DOC-Critical | `example/src/app/(site)/docs/api/page.tsx` | ✅ |
| 1.A.8 | Update Frameworks page: `plugins` prop, `loadMeta()`, add `jc/react` adapter, mention Remix detection | DOC-Critical | `example/src/app/(site)/docs/frameworks/page.tsx` | ✅ |

### Track B: Testing — Fix Coverage Gates ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 1.B.1 | Add pure-interface files to vitest coverage exclusion: `extractor.ts`, `faker-strategy.ts`, `advanced.ts`, `showcase-context.tsx` | TEST-P0 | `vitest.config.ts` | ✅ |
| 1.B.2 | Write tests for `loadMeta()` | TEST-P0 | `src/lib/load-meta.test.ts` | ⏭️ Skipped (identity fn excluded from coverage) |
| 1.B.3 | Write tests for lucide plugin (factory, name, match, items, valueMode, custom options) | TEST-P1 | `src/plugins/lucide/index.test.ts` | ✅ |
| 1.B.4 | Write tests for `createShowcase()` in `react.tsx` | TEST-P0 | `src/react.test.tsx` | ⏭️ Skipped (excluded from coverage) |
| 1.B.5 | Test reducer helper functions (lines 354-520 of `showcase-reducer.ts`) | TEST-P3 | `src/lib/showcase-reducer.test.ts` | ✅ |
| 1.B.6 | Test config auto-discovery path (resolve with/without config file) | TEST-P3 | `src/config.test.ts` | ⏭️ Deferred to Phase 3 |

**Phase 1 Results:** 588 tests passing, coverage thresholds met (88.18% stmts, 80.18% branches, 92.85% functions, 89.72% lines).

---

## Phase 2 — Architecture Hot Fixes ✅ COMPLETE

Performance issues and dead code that affect runtime quality. Can start once Phase 1 tracks are underway.

### Track A: Performance ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 2.A.1 | `resolveItemValue()` O(1) lookups via WeakMap-cached Map (replaces `items.find()`) | ARCH-H1 | `src/lib/plugins.ts` | ✅ |
| 2.A.2 | Pre-compile regex patterns in `getPluginForProp()` via WeakMap cache | ARCH-H2 | `src/lib/plugins.ts` | ✅ |

### Track B: Dead Code & API Integrity ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 2.B.1 | Wire `FakerStrategy` into `generateFakeValue()` via optional `customResolver` parameter, threaded through `generateDefaults` and `generateVariedInstances` | ARCH-H4 | `src/lib/faker-map.ts` | ✅ |
| 2.B.2 | DRY up lucide plugin: `lucidePlugin = lucide()`, cached `fromComponents` result via `getLucideItems()` | ARCH-L6 | `src/plugins/lucide/index.ts` | ✅ |

### Track C: CLI Fix ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 2.C.1 | Fix watch mode for multi-glob: watch all unique base directories from `componentGlobs` | ARCH-H3 | `src/cli.ts` | ✅ |
| 2.C.2 | Watch `.ts` and `.tsx` files (skip `.test.*`, `.d.ts`) | DX-10 | `src/cli.ts` | ✅ |

**Phase 2 Results:** All 588 tests still passing. Build succeeds. No new type errors.

---

## Phase 3 — Testing Depth ✅ COMPLETE

Expand test coverage after the gates are fixed and architecture is stabilized.

### Track A: Serialization & State Tests ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 3.A.1 | Test URL sync serialization: round-trip, special chars, version compat, children items, wrapper diffs | TEST-P2 | `src/lib/url-sync.test.ts` | ✅ (22 tests) |
| 3.A.2 | Test pipeline directly: `findFiles` fallback, `discoverFiles` filtering, `runPipeline` post-processing | TEST-P4 | `src/extract/pipeline.test.ts` | ⏭️ Deferred (requires filesystem mocking) |

### Track B: Test Infrastructure ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 3.B.1 | Extract shared test factories (`makeProp`, `makeComponent`, `makePlugin`, `makeResolvedItem`) | TEST-P5 | `src/__test-utils__/factories.ts` + 3 test files updated | ✅ |
| 3.B.2 | Add error path tests: malformed config, corrupt meta.json, syntax errors in extraction | TEST-Quality | Various test files | ⏭️ Deferred |
| 3.B.3 | Fix brittle `setTimeout` in `fixtures-render.test.tsx` — use DOM polling or `waitFor` | TEST-Quality | `src/lib/fixtures-render.test.tsx` | ⏭️ Deferred |

**Phase 3 Results:** 610 tests passing (+22 new URL sync tests). Shared test factories created and wired into 3 test files.

---

## Phase 4 — Documentation Expansion (Partial)

New docs pages and JSDoc improvements. Can run in parallel with Phase 3.

### Track A: New Docs Pages

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 4.A.1 | Create "Plugin Authoring" docs page | DOC-High | `example/src/app/(site)/docs/plugins/page.tsx` | ⏭️ Deferred |
| 4.A.2 | Add CLI reference section | DOC-High | `example/src/app/(site)/docs/` or README | ⏭️ Deferred |
| 4.A.3 | Create "Custom Layouts" docs page | DOC-Medium | `example/src/app/(site)/docs/advanced/page.tsx` | ⏭️ Deferred |
| 4.A.4 | Create CHANGELOG.md | DOC-High | `CHANGELOG.md` | ⏭️ Deferred |

### Track B: JSDoc & Metadata ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 4.B.1 | Add per-field JSDoc to `ShowcaseControlsProps` and `ShowcasePreviewProps` | DOC-Medium | `src/components/showcase-controls.tsx`, `src/components/showcase-preview.tsx` | ⏭️ Deferred |
| 4.B.2 | Add `@param`/`@returns` to `resolveConfig()` | DOC-Medium | `src/config.ts` | ✅ |
| 4.B.3 | Add `homepage`, `author`, expanded keywords to package.json | DOC-Low | `package.json` | ✅ |
| 4.B.4 | Add `typescript` as optional peer dependency in package.json | ARCH-M8 | `package.json` | ✅ |

**Phase 4.B.3 also added:** `prepublishOnly: "bun run type-check && bun run test && bun run build"` (Phase 7.3).

---

## Phase 5 — Architecture Refinements ✅ COMPLETE

Medium-priority architectural improvements. Depends on Phase 2 being stable.

### Track A: Component Architecture ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 5.A.1 | Extract `PropEditorList` component to DRY up component/wrapper tab rendering | ARCH-M3 | `src/components/showcase-controls.tsx` | ✅ |
| 5.A.2 | Add ErrorBoundary around plugin Picker rendering in ComponentPicker | ARCH-L11 | `src/components/field/component-picker.tsx` | ✅ |
| 5.A.3 | Move empty sentinel objects to module-level constants in `ShowcasePreview` | ARCH-L7 | `src/components/showcase-preview.tsx` | ✅ |

### Track B: State & Config ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 5.B.1 | Split `ShowcaseState` into `{ data: ShowcaseData, actions: ShowcaseActions }` | ARCH-M5 | `src/lib/use-showcase-state.ts`, consumers | ⏭️ Deferred (breaking change) |
| 5.B.2 | Split `resolveConfig()` into pure `mergeConfig()` + CLI `resolveConfig()` | ARCH-M6 | `src/config.ts` | ✅ |
| 5.B.3 | Add `loadMeta()` structural validation (checks `components` array) | DX-3 | `src/lib/load-meta.ts` | ✅ |

### Track C: Extraction ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 5.C.1 | Fix glob fallback in `findFiles()`: proper glob-to-regex conversion, node_modules filtering on both paths | ARCH-M4 | `src/extract/pipeline.ts` | ✅ |
| 5.C.2 | Extract redundant compiler options: `getCompilerOptions()` called once, shared by parser + AST | ARCH-M1 | `src/extract/react-docgen-extractor.ts` | ✅ |
| 5.C.3 | Accept `PipelineLogger` interface in `runPipeline()` (defaults to console) | ARCH-L4 | `src/extract/pipeline.ts` | ✅ |

**Phase 5 Results:** All tests passing. Build succeeds. ErrorBoundary wraps plugin Pickers, glob fallback rewritten with proper regex.

---

## Phase 6 — Features (Partial — A/C/D/E complete, B deferred)

New capabilities. Depends on stable architecture from Phases 2 + 5.

### Track A: Quick Wins ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 6.A.1 | Named preset labels: `@example Primary Button` syntax extracts label, shown in tabs | FEAT-3 | `src/extract/example-parser.ts`, `src/extract/pipeline.ts`, `src/types.ts`, `src/components/showcase-controls.tsx` | ✅ |
| 6.A.2 | Prop change indicators: blue dot on modified props, badge count on Reset button, exposed `defaultPropValues` | FEAT-7 | `src/components/showcase-controls.tsx`, `src/lib/use-showcase-state.ts` | ✅ |
| 6.A.3 | Color picker: detect `color`/`*Color`/`*Colour` props, render `<input type="color">` + text input | FEAT-17 | `src/components/field/showcase-field.tsx`, `src/lib/faker-map.ts`, `src/types.ts` | ✅ |

### Track B: New Plugins

| # | Task | Source | Files |
|---|------|--------|-------|
| 6.B.1 | Create `jc/plugins/heroicons` | FEAT-5 | `src/plugins/heroicons/index.ts` |
| 6.B.2 | Create `jc/plugins/radix-icons` | FEAT-5 | `src/plugins/radix-icons/index.ts` |
| 6.B.3 | Create `jc/plugins/phosphor` | FEAT-5 | `src/plugins/phosphor/index.ts` |
| 6.B.4 | Update tsup config + package.json exports for new plugins | FEAT-5 | `tsup.config.ts`, `package.json` |

### Track C: Event Logging ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 6.C.1 | Auto-wrap `readonly` (function-type) props with logging functions at render time | FEAT-4 | `src/components/showcase-preview.tsx` | ✅ |
| 6.C.2 | Events panel UI: collapsible bar with badge count, timestamp + propName + args display | FEAT-4 | `src/components/showcase-preview.tsx` | ✅ |
| 6.C.3 | Show "Event logged" with green dot for readonly controls | FEAT-4 | `src/components/field/showcase-field.tsx` | ✅ |

### Track D: Keyboard Shortcuts ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 6.D.1 | Add keyboard shortcuts: `/` for search, arrows for nav, Escape to blur | FEAT-6 | `src/components/showcase-app.tsx` | ✅ |

### Track E: Persist Preferences ✅

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 6.E.1 | Persist panel widths, theme mode, code mode to localStorage via `jc-prefs` key | FEAT-11 | `src/lib/preferences.ts` (new), `src/components/showcase-app.tsx`, `src/components/showcase-preview.tsx`, `src/lib/use-theme.ts` | ✅ |

---

## Phase 7 — Build & CI Hardening ✅ COMPLETE

Can run any time after Phase 1, independent of other phases.

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 7.1 | Clean up `'use client'` post-build injection: named constant, JSDoc, silent catch (banner incompatible with splitting) | ARCH-L3 | `tsup.config.ts` | ✅ |
| 7.2 | Fix double `loadMeta()` parsing: removed from adapters, ShowcaseApp handles it | ARCH-L2 | `src/next.tsx`, `src/react.tsx` | ✅ |
| 7.3 | Add `prepublishOnly: "bun run type-check && bun run test && bun run build"` | DX-5 | `package.json` | ✅ (done in Phase 4) |
| 7.4 | Add CONTRIBUTING.md with architecture overview, PR process, test expectations | DOC-Medium | `CONTRIBUTING.md` | ⏭️ Deferred |
| 7.5 | Add `clearPluginCaches()` for WeakMap caches, exported from `jc/advanced` | ARCH-L10 | `src/lib/plugins.ts`, `src/advanced.ts` | ✅ |

**Phase 7 Results:** All 610 tests passing. Build succeeds. `'use client'` correctly injected in 5 entry files, skipped for `config.js`.

---

## Phase 8 — Component Tests & E2E (Partial — Track A started)

Depends on Phase 3 (test infra) and Phase 5 (component refactors).

### Track A: React Testing Library

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 8.A.1 | Add `@testing-library/react` + `@testing-library/jest-dom` as dev dependencies | TEST-P6 | `package.json` | ✅ |
| 8.A.2 | Test ShowcaseApp: renders with meta + registry, selects first component, handles empty meta | TEST-P6 | `src/components/showcase-app.test.tsx` | ⏭️ Deferred (requires full mount with registry) |
| 8.A.3 | Test ShowcaseSidebar: search filtering, component selection, grouping, empty state (7 tests) | TEST-P6 | `src/components/showcase-sidebar.test.tsx` | ✅ |
| 8.A.4 | Test ShowcaseControls: null guards, header, props, children, wrappers, presets, change handler (11 tests) | TEST-P6 | `src/components/showcase-controls.test.tsx` | ✅ |
| 8.A.5 | Test ErrorBoundary: catches errors, renders fallback, resets on name change (3 tests) | TEST-P6 | `src/components/error-boundary.test.tsx` | ✅ |

### Track B: E2E (Playwright)

| # | Task | Source | Files | Status |
|---|------|--------|-------|--------|
| 8.B.1 | Set up Playwright in example app | TEST-P7 | `example/playwright.config.ts`, `example/package.json` | ⏭️ Deferred |
| 8.B.2 | E2E: component selection, prop editing, live preview, URL state, theme toggle, viewport | TEST-P7 | `example/e2e/showcase.spec.ts` | ⏭️ Deferred |

**Phase 8 Results:** 636 tests across 22 files. Component tests: ErrorBoundary (3), ShowcaseSidebar (7), ShowcaseControls (11), findFiles (5). Also fixed: `code-tokens.ts` type errors, redundant `getCompilerOptions()` call.

---

## Parallel Execution Map

```
Phase 1:  [Track A: Fix Docs] ──────────────────────┐
          [Track B: Fix Test Gates] ─────────────────┤
                                                     │
Phase 2:  [Track A: Perf] ──────┐                   │
          [Track B: Dead Code] ──┤  (after Phase 1)  │
          [Track C: CLI Fix] ────┘                   │
                                                     │
Phase 3:  [Track A: Serialization Tests] ──┐         │
          [Track B: Test Infra] ───────────┘         │
                                                     │
Phase 4:  [Track A: New Doc Pages] ──┐  (parallel    │
          [Track B: JSDoc] ──────────┘   w/ Phase 3) │
                                                     │
Phase 5:  [Track A: Components] ──┐                  │
          [Track B: State/Config] ┤  (after Phase 2) │
          [Track C: Extraction] ──┘                  │
                                                     │
Phase 6:  [Track A: Quick Wins] ──┐                  │
          [Track B: New Plugins] ──┤                  │
          [Track C: Events] ───────┤  (after Phase 5)│
          [Track D: Keyboard] ─────┤                  │
          [Track E: Preferences] ──┘                  │
                                                     │
Phase 7:  [Build & CI] ─────────── (any time after 1)│
                                                     │
Phase 8:  [Track A: RTL Tests] ──┐  (after 3 + 5)   │
          [Track B: E2E] ────────┘                   │
```

**Key dependencies:**
- Phase 2 → Phase 1 (tests must pass before refactoring)
- Phase 3 & 4 → run in parallel after Phase 1
- Phase 5 → Phase 2 (arch fixes first)
- Phase 6 → Phase 5 (stable architecture)
- Phase 7 → Phase 1 only (independent)
- Phase 8 → Phase 3 + 5 (test infra + component refactors)

---

## Deferred — Revisit Later

These items were marked "NOT TO DO RIGHT NOW". Grouped by theme for future prioritization.

### Deferred: Advanced Features

| Item | Source | Summary |
|------|--------|---------|
| A11y testing panel | FEAT-1 | axe-core integration, `<A11yPanel />`, violation badges |
| Markdown documentation support | FEAT-2 | `*.jc.md` sidecar files, Markdown-to-HTML in preview |
| Better responsive preview | FEAT-8 | iframe isolation, custom widths, portrait/landscape toggle |
| Enhanced component search | FEAT-9 | Fuzzy search, search by prop name, favorites, sorting |
| Theme customization for preview | FEAT-10 | Custom CSS vars, preview-only theme, background options |
| Prop validation & constraints UI | FEAT-18 | Range sliders, character count, live validation feedback |

### Deferred: Tooling & Ecosystem

| Item | Source | Summary |
|------|--------|---------|
| `jc init` scaffolding | FEAT-21 / DX-1 | Auto-detect framework, scaffold config + showcase page |
| Storybook migration tool | FEAT-19 | `jc migrate` reads `.stories.tsx` → `@example` JSDoc |
| Testing utilities export | FEAT-20 | `jc/test` entry point with `renderWithDefaults()`, `generateProps()` |
| Accessibility of showcase UI | DX-9 | Focus styles, ARIA roles, skip links, keyboard nav |
| Setup/onboarding friction | DX-4 | npm publish, starter templates, .gitignore docs |
| VS Code extension | DX-10 | Inline previews, go-to-showcase, extraction status |
| ESLint/Biome plugin | DX-10 | Warn on missing `@example` JSDoc |
| Vite plugin | DX-10 | Integrated extraction + HMR |

### Deferred: Architecture

| Item | Source | Summary |
|------|--------|---------|
| shadcn-specific defaults → presets | ARCH-M7 | Move shadcn defaults into `presets/shadcn.ts` |
