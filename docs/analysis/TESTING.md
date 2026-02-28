# Testing Improvement Analysis

## Current State

- **528 tests** across 16 files, all passing
- **Coverage below thresholds** — Statements: 82.29% (goal: 85%), Branches: 73.92% (goal: 75%), Functions: 83.16% (goal: 90%), Lines: 83.44% (goal: 85%)
- Coverage gates are **failing** — this is the most immediate problem

---

## What Is Tested Well

### Extraction Engine (strongest area)
- `extract.test.ts` — simplifyType, extractValues, isTypeName, cleanValues, detectComponentKind, applyPathAlias, generateRegistry, createPropFilter, writeOutput
- `extract-integration.test.ts` — End-to-end extraction from real fixture files
- `ast-analyze.test.ts` — Component kind detection, children detection, union values, wrapped components, named interface expansion, structuredFields
- `example-parser.test.ts` — JSX parsing, wrapper detection, presets
- `usage-analysis.test.ts` — Cross-file usage counting, graph propagation, cycles
- `discover.test.ts` — Glob discovery, non-component filtering, Next.js conventions
- `detect-environment.test.ts` — Framework, icon library, design system, CSS framework, path alias detection

### Faker Map & Control Resolution
95.53% statement coverage in `faker-map.ts`. Tests cover control type resolution, array item types, fake value generation for all prop types, structured arrays/objects, varied instance generation.

### Plugin System
89.41% coverage of `plugins.ts`. Tests cover resolvePluginItems, resolveItemValue, fixtureToCodeString, getItemsForProp, getDefaultItemKey, definePlugin, fromComponents, renderComponentFixture, buildComponentFixturesPlugin, resolveComponentFixtureItems.

### Fixture Registry
96.96% statement coverage.

### Reducer
Well-structured tests covering every action type plus edge cases.

### Code Generation
`generateCodeTokens`, `formatArrayTokens`, `componentFixtureToCodeTokens` thoroughly tested.

### Render Integration
`fixtures-render.test.tsx` uses jsdom to mount React components and test Radix asChild/cloneElement with real DOM.

---

## What Is NOT Tested

### Zero-Coverage Files

| File | Notes |
|------|-------|
| `src/advanced.ts` | Re-export barrel (0% stmts) |
| `src/react.tsx` | `createShowcase()` adapter (0% stmts) |
| `src/plugins/lucide/index.ts` | Published entry point! (0% stmts) |
| `src/extract/extractor.ts` | Pure interface file (0% stmts) |
| `src/lib/faker-strategy.ts` | Interface + defineFakerStrategy (0% stmts) |
| `src/lib/showcase-context.tsx` | Context provider/hooks (0% stmts) |
| `src/lib/load-meta.ts` | Simple function (0% stmts) |

### Under-Covered Files

| File | Coverage | Issue |
|------|----------|-------|
| `src/lib/showcase-reducer.ts` | 45.25% | Lines 354-520 untested (helpers beyond reducer) |
| `src/extract/pipeline.ts` | 70.65% | findFiles fallback, post-processing untested |
| `src/config.ts` | 41.17% | Auto-discovery config resolution path untested |

### Excluded but Containing Testable Pure Logic

| File | Testable Functions |
|------|-------------------|
| `src/lib/url-sync.ts` | `serializeToHash`, `deserializeFromHash`, `encodeChildItem`, `decodeChildItem` |
| `src/lib/code-tokens.ts` | `generateImportTokens`, `buildPluginImportMap` (only tested indirectly) |
| `src/components/**` | All UI components — zero React Testing Library tests |

### Missing Test Categories
- **No component rendering tests** — Zero `@testing-library/react` usage
- **No snapshot tests** — Code generation tested by string matching only
- **No error path testing** — Malformed config, syntax errors, corrupt meta.json
- **No CLI tests** — Arg parsing, watch mode, file writing
- **No async/timeout tests** — Lazy loading uses hardcoded `setTimeout`

---

## Prioritized Recommendations

### P0: Fix Coverage Gate Failure (immediate)

**Option A:** Add 0%-covered files to vitest.config.ts exclusion list:
- `src/advanced.ts` (barrel re-export)
- `src/extract/extractor.ts` (pure interface)
- `src/lib/faker-strategy.ts` (interface file)
- `src/lib/showcase-context.tsx` (React context wiring)

**Option B (preferred):** Write quick tests for trivial files:

```typescript
// load-meta.test.ts
it('returns the input as JcMeta', () => {
  const raw = { generatedAt: 'x', componentDir: 'y', components: [] }
  expect(loadMeta(raw)).toBe(raw)
})
```

```typescript
// utils.test.ts — add to existing
describe('toPascalCase', () => {
  it('converts space-separated words', () => expect(toPascalCase('status badge')).toBe('StatusBadge'))
  it('converts hyphenated words', () => expect(toPascalCase('my-component')).toBe('MyComponent'))
})

describe('parseSlotKey', () => {
  it('parses prop key', () => expect(parseSlotKey('prop:icon')).toEqual({ type: 'prop', name: 'icon' }))
  it('parses children key', () => expect(parseSlotKey('children:2')).toEqual({ type: 'children', index: 2 }))
  it('returns null for invalid', () => expect(parseSlotKey('invalid')).toBeNull())
})
```

### P1: Test the Lucide Plugin

Published entry point with 0% coverage. Create `src/plugins/lucide/index.test.ts`:

```typescript
describe('lucidePlugin', () => {
  it('returns a factory function', () => expect(typeof lucidePlugin).toBe('function'))
  it('factory produces plugin with name "lucide"', () => {
    const plugin = lucidePlugin()
    expect(plugin.name).toBe('lucide')
    expect(plugin.match.types).toContain('LucideIcon')
  })
  it('has items from lucide-react', () => {
    expect(lucidePlugin().items.length).toBeGreaterThan(100)
  })
  it('uses constructor valueMode', () => {
    expect(lucidePlugin().valueMode).toBe('constructor')
  })
})

describe('lucide (custom options)', () => {
  it('applies custom sizes', () => {
    const plugin = lucide({ size: 32, previewSize: 18 })()
    expect(plugin.renderProps).toEqual({ size: 32 })
    expect(plugin.previewProps).toEqual({ size: 18 })
  })
})
```

### P2: Test URL Sync Serialization

Key user experience path. Round-trip tests prevent data loss bugs:

- `serializeToHash` / `deserializeFromHash` round-trip for props, children, wrapper props, fixture overrides
- Special characters in prop values
- Version compatibility (CURRENT_VERSION = 2)
- Graceful handling of malformed hash strings

### P3: Test Reducer Helpers (lines 354-520)

Close the largest coverage gap. Identify what functions exist in that range and add test cases.

### P4: Test Pipeline Directly

`pipeline.ts` at 70.65% coverage. Add tests for:
- `findFiles` fallback path (when `fs.globSync` unavailable)
- `discoverFiles` filtering logic
- `runPipeline` post-processing (deduplication, wrapper detection, preset parsing)

### P5: Shared Test Factories

`makeProp()`, `makeComp()`, `makeComponent()` are defined independently in multiple test files. Extract to `src/__test-utils__/factories.ts`.

### P6: Add React Component Tests

Add `@testing-library/react` as a dev dependency. Priority components:

1. **ShowcaseApp** — Renders with meta + registry, selects first component, handles empty meta
2. **ShowcaseSidebar** — Search filtering, component selection
3. **ShowcaseControls** — Renders controls for different prop types
4. **ErrorBoundary** — Catches errors and renders fallback
5. **ThemeToggle** — Toggles between light/dark
6. **ViewportPicker** — Selects viewport presets

### P7: Add E2E Tests

Use Playwright against the example app to verify:
- Component selection from sidebar
- Prop editing in controls panel
- Live preview updates
- URL state persistence
- Theme toggling
- Viewport switching
- Multi-instance mode

---

## Test Quality Issues

| Issue | Location | Fix |
|-------|----------|-----|
| Brittle timeout | `fixtures-render.test.tsx` uses `setTimeout(resolve, 50)` | Use `waitFor` from Testing Library or DOM polling |
| Redundant helpers | `makeProp()` defined in 4+ files | Extract to shared `__test-utils__/factories.ts` |
| Missing negatives | `generateRegistry` tested with valid meta only | Add malformed/empty component data cases |
| Over-testing constants | `discover.test.ts` has 28 individual set-membership tests | Use `it.each()` for data-driven approach |
| No error path tests | Config, pipeline, extractor error branches untested | Add tests for malformed input, missing files, syntax errors |

---

## Infrastructure Improvements

1. **Shared test factories** — `src/__test-utils__/factories.ts`
2. **Custom matchers** — `expect(tokens).toRenderAs('<Button variant="primary" />')` instead of `tokenText(tokens)`
3. **Test data isolation** — Use Vitest `test.extend` for guaranteed tmpdir cleanup
4. **Coverage config fix** — Add pure-interface files to exclusion list: `extractor.ts`, `faker-strategy.ts`, `advanced.ts`
5. **Performance benchmarks** — Benchmark `extract()` with 50+ fixtures to establish baselines
