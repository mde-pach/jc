# Architecture Improvement Analysis

## Current Strengths

- Clean 6-entry-point tiered export design with progressive disclosure
- Clear separation between CLI (CJS) and UI (ESM) builds
- `sideEffects: false` enables aggressive tree-shaking
- Small dist (~376KB) for the complexity level
- Co-located tests next to source files
- Clean `Extractor` interface (31 lines, perfectly minimal)
- Two-layer extraction (react-docgen-typescript + AST analysis) with regex fallback
- Zero-config glob probing with framework-aware filtering
- Pure reducer pattern in state management — fully testable without React
- Context-based component communication with optional provider pattern
- Inline CSS with CSS custom properties — self-contained, no external deps

---

## Weaknesses & Recommendations

### Priority: High

#### H1. `FixtureRegistry` exists but is unused in hot paths

**File:** `src/lib/fixture-registry.ts`, `src/lib/plugins.ts`, `src/lib/use-resolved-component.tsx`

The `FixtureRegistry` provides O(1) lookups via `Map`, but core resolution paths use raw array scans: `resolveItemValue()` calls `items.find()` (O(n) per call). For the Lucide plugin with 1400+ icons, this is significant.

**Fix:** Replace `resolvedItems: JcResolvedPluginItem[]` with `registry: FixtureRegistry` in the context value. Update `resolveItemValue()` calls to use `registry.resolve()`.

#### H2. Regex re-creation in `getPluginForProp()` on every call

**File:** `src/lib/plugins.ts` ~line 168

`new RegExp(pattern, 'i').test(prop.name)` is called inside a loop for every prop × every plugin. For 50 props and 3 plugins, regex objects are created and garbage-collected hundreds of times per render.

**Fix:** Pre-compile regex patterns in `resolvePluginItems()` or `normalizePlugin()`. Store compiled patterns alongside the plugin.

#### H3. Watch mode ignores multi-glob directories

**File:** `src/cli.ts` ~line 101

`config.componentGlob.split('*')[0]` only watches the first glob's base directory. When `componentGlobs` is set with multiple paths, changes to secondary directories won't trigger re-extraction.

**Fix:** When `componentGlobs` is set, watch all unique base directories with an array of `fs.watch()` instances sharing a debounced callback.

#### H4. `FakerStrategy` is dead code

**File:** `src/lib/faker-strategy.ts`, `src/lib/faker-map.ts`

`createFakerResolver()` and `defineFakerStrategy()` are exported from `jc/advanced` but never wired into `generateFakeValue()` in `faker-map.ts`. The strategy system is exported API that does nothing.

**Fix:** Wire `createFakerResolver()` into `generateFakeValue()` by accepting an optional strategies array, or add a `fakerStrategies` option to `ShowcaseApp` props.

---

### Priority: Medium

#### M1. Redundant `ts.Program` creation in extractor

**File:** `src/extract/react-docgen-extractor.ts`

`ts.createProgram(files, compilerOptions)` at ~line 229 creates a program, while `createParser()` internally creates its own via `withCompilerOptions()`. This is O(n) TypeScript compilation happening twice. Additionally, `getCompilerOptions()` is called twice.

**Fix:** Extract the resolved compiler options into a local variable. Investigate whether `react-docgen-typescript` can share the program.

#### M2. `ShowcaseControls` has an 18-prop dual-mode interface

**File:** `src/components/showcase-controls.tsx` ~lines 28-49

All 18 optional props have `?? ctx?.state.xxx` fallbacks. This "props or context" pattern creates an excessive interface.

**Fix:** Make `ShowcaseControls` context-only for the common case. Export a separate `ControlsRenderer` for the standalone/custom layout use case.

#### M3. Duplicated prop editor rendering for component/wrapper tabs

**File:** `src/components/showcase-controls.tsx` ~lines 234-337

The same prop editor logic appears twice — once for the component tab and once for wrapper tabs, differing only in data source and onChange handler.

**Fix:** Extract a `PropEditorList` component accepting `{ props, propValues, onChange }`.

#### M4. Buggy glob fallback in `findFiles()`

**File:** `src/extract/pipeline.ts` ~lines 44-62

The fallback glob matcher assumes patterns always contain `*`*. The regex `ext?.replace('*', '.*')` only replaces the first `*`. May miss files or match incorrectly.

**Fix:** Replace hand-rolled fallback with `picomatch` (already a transitive dep), or add proper test coverage for the fallback path.

#### M5. `ShowcaseState` mixes data with callbacks

**File:** `src/lib/use-showcase-state.ts`

The return interface has 16 data fields and 12 callback functions in a flat object. Every consumer re-renders when any callback identity changes.

**Fix:** Split into `{ data: ShowcaseData, actions: ShowcaseActions }`. The `actions` object can be a stable `useMemo` reference.

#### M6. `require()` in ESM-exported config function

**File:** `src/config.ts` ~line 52

`require('./extract/detect-environment.js')` works in the CLI (CJS) build but would break if someone used `resolveConfig()` from ESM context.

**Fix:** Split into `resolveConfig()` (pure, no IO) and `resolveConfigWithDetection()` (CLI-only, with dynamic import).

#### M7. shadcn-specific defaults in generic tool - NOT TO DO RIGHT NOW

**File:** `src/config.ts`

Default `excludeFiles` includes `toaster.tsx`, `form.tsx`, and `filteredProps` includes `DialogPortal`, `DialogOverlay`, `DialogClose` — all shadcn-specific.

**Fix:** Move shadcn-specific defaults into a `presets/shadcn.ts`. Make base `defaultConfig` generic. Users would `import { shadcnPreset } from 'jc/config'`.

#### M8. TypeScript not listed as peer dependency for CLI

**File:** `package.json`, `tsup.config.ts`

TypeScript is externalized in the CLI build but not declared as a peer dependency. Users without TypeScript installed get opaque errors.

**Fix:** Add `typescript` to `peerDependencies` (or document the requirement clearly).

---

### Priority: Low

#### L1. Backward-compat re-exports in `extract.ts`

8 internal functions re-exported purely for test backward compatibility. Should live in a shared `extract/type-utils.ts`.

#### L2. Triple `loadMeta()` parsing

Both adapters call `loadMeta()` at module init, then `ShowcaseApp` calls it again in `useMemo`. Wasted work.

#### L3. Fragile `'use client'` post-build injection

`addUseClientDirective()` reads and rewrites files after build. If filenames change, this silently fails. Consider tsup's `banner` option instead.

#### L4. Hard-coded `console.log` in pipeline

`pipeline.ts` uses `console.log`/`console.warn` directly. Accept a `Logger` interface for testability and suppression.

#### L5. Linear scan in `resolveItemValue()` (subsumed by H1)

#### L6. Duplicate lucide plugin definition

`lucidePlugin` and `lucide()` define the same plugin with slightly different paths. `fromComponents(icons)` (1400+ entries) runs in both.

#### L7. Empty sentinel objects created on every render

`ShowcasePreview` creates fallback `JcMeta` and `JcComponentMeta` objects in `useMemo`. Should be module-level constants.

#### L8. No `jc init` command

No scaffolding to create config or showcase page. Users write everything from scratch.

#### L9. Eager faker import

`@faker-js/faker` (~5MB) is a top-level import in `faker-map.ts`. In Vite dev mode (no tree-shaking), this adds startup time.

#### L10. Module-level caches without HMR cleanup

`resolvedCompCache`, `eagerLoaderCache`, `directLoaderCache` persist across HMR cycles, potentially causing stale references.

#### L11. No error boundaries in controls panel

`ShowcasePreview` has `<ErrorBoundary>` but `ShowcaseControls` does not. A misbehaving plugin `Picker` could crash the entire controls.

---

## Cross-Cutting Patterns to Address


| Pattern               | Current               | Recommended                        |
| --------------------- | --------------------- | ---------------------------------- |
| Plugin item lookup    | O(n) array scan       | O(1) FixtureRegistry               |
| Regex matching        | Created per call      | Pre-compiled at init               |
| State shape           | Flat data + callbacks | Split data/actions                 |
| Config defaults       | shadcn-specific       | Generic + presets                  |
| CLI peer deps         | Implicit typescript   | Explicit peer dep                  |
| Post-build directives | File rewriting        | tsup banner option                 |
| Error handling        | Silent catch blocks   | Classified errors with remediation |


