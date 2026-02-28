# Developer Experience & Ecosystem Analysis

## 1. CLI Experience

### Pain Points

**A. No `init` command** — Biggest onboarding gap. Users must manually create config, showcase page, know to run `jc extract`, and wire up imports. A `jc init` could scaffold everything in seconds using the existing `detectEnvironment()`.

**B. Manual argument parsing** — `args.indexOf('--config')` with no typo detection, no flag validation, no tab-completion. `jc --conifg` silently does nothing.

**C. Unhelpful unknown command error** — `[jc] Unknown command: ${command}` with no "Did you mean `extract`?" suggestion.

**D. Watch mode limitations:**

- Only observes `.tsx` files (ignores `.ts` type changes that affect props)
- Uses `fs.watch` (known cross-platform reliability issues)
- No `--clear` flag for terminal clearing between rebuilds
- Watch directory derived from `componentGlob.split('*')[0]` — breaks for complex patterns

**E. Missing flags:** No `--dry-run`, `--version`, `--silent`.

**F. No colored output** — All plain `console.log('[jc] ...')`. No spinner, no color differentiation between warnings/errors/success.

### Suggestions

- Add `jc init` (scaffold config + showcase page based on detected environment)
- Add `jc doctor` (validate config, check component files exist, verify output dir)
- Add `--dry-run`, `--version`, `--silent` flags
- Add flag validation with typo suggestions
- Add colored output (detect TTY with `process.stderr.isTTY`)
- Watch `.ts` + `.tsx` files, add `--clear` flag

---

## 2. Configuration Experience

### Pain Points

**A. No runtime config validation** — `resolveConfig()` accepts `Partial<JcConfig>` with no Zod/schema validation. `componentGlob: 123` passes silently, fails later with obscure error.

**B. `defineConfig()` provides zero value** — Literally `return config`. Could validate at definition time, check for common mistakes.

**C. Array union merge is one-way** — No way to *replace* default arrays, only extend. If user wants to remove a default filtered prop pattern, no mechanism exists.

**D. `componentGlob` vs `componentGlobs` ambiguity** — Both exist, precedence documented in JSDoc only.

**E. No glob pattern validation** — `componentGlob: 'src/components'` (missing `/**/*.tsx`) gets zero matches with no warning.

### Suggestions

- Add Zod validation in `resolveConfig()` with helpful error messages
- Validate glob patterns (warn if no wildcard, warn if path doesn't exist)
- Support array override semantics (not just union merge)
- Log warning when both `componentGlob` and `componentGlobs` are set
- `defineConfig()` could validate at definition time

---

## 3. Error Handling

### Pain Points

**A. Silent `catch` blocks** — Config swallows environment detection failures silently. CLI catches errors without stack traces.

**B. Unhelpful extraction errors** — `[jc] Extraction failed: ${err}` — could be missing TypeScript dep, malformed tsconfig, or permissions. No classification or remediation.

**C. Minimal ErrorBoundary** — Shows error message only. No stack trace, retry button, component name, or copy-to-clipboard.

**D. Missing TypeScript peer dep errors** — CLI externalizes `typescript` but doesn't check availability at startup. Users get cryptic Node module resolution failure.

**E. Warnings hidden by default** — Extraction warnings require `--verbose`. Parse errors (data loss) should always be visible.

**F. `loadMeta()` is unchecked cast** — No structural validation. Stale/corrupt meta.json causes unhelpful property-access errors instead of clear "re-run `jc extract`" message.

### Suggestions

- Always show FILE_PARSE_ERROR warnings (not just verbose mode)
- Add structural validation to `loadMeta()` with version checking
- Add `--debug` flag with stack traces
- Improve ErrorBoundary with retry, stack trace, component file path
- Check `typescript` availability at CLI startup
- Classify errors (config, dependency, parse, runtime) with remediation hints

---

## 4. Setup/Onboarding Friction - NOT TO DO RIGHT NOW

### Pain Points

**A. Not published to npm** — GitHub-based install means no semver, no changelog, lock file complications.

**B. README shows outdated pattern** — `meta as unknown as JcMeta` instead of `loadMeta(meta)`.

**C. No minimal reproduction template** — No `create-jc-app`, no degit template, no GitHub template repo.

**D. 6 entry points to learn** — `jc`, `jc/advanced`, `jc/config`, `jc/next`, `jc/react`, `jc/plugins/lucide`. Distinction between `jc` and `jc/advanced` is unclear.

**E. Generated files need `.gitignore`** — Not documented.

**F. Next.js adapter vs direct usage confusion** — `createShowcasePage()` exists but example app uses `ShowcaseApp` directly.

### Suggestions

- Publish to npm (even 0.x for pre-release)
- `jc init` command
- Update README to use `loadMeta()` consistently
- Add `.gitignore` recommendation for generated directory
- Create standalone starter template
- Document when to use `jc/next` vs `jc` directly

---

## 5. Build & CI Workflow

### Pain Points

**A. Fragile `'use client'` injection** — Hardcodes file names. New entry point = silent broken client build. CI only checks `index.js` and `next.js`, not `advanced.js`, `react.js`, `plugins/lucide.js`.

**B. CI uses `npm install` despite Bun project** — Inconsistency with `bun`-based scripts. `bun.lockb` is deleted from git.

**C. No bundle size budget** — No checks for size regression.

**D. Weak `prepublishOnly`** — Only builds, doesn't run tests or type-check. Could ship broken code.

**E. No changelog automation** — No changesets, semantic-release, or conventional-changelog.

**F. Missing explicit `react`/`react-dom` in devDependencies** — Relies on monorepo workspace resolution.

### Suggestions

- Auto-detect `'use client'` files instead of hardcoding
- CI verify all `'use client'` directives
- Switch CI to `bun install`
- Add `prepublishOnly: "bun run type-check && bun run test && bun run build"`
- Add bundle size tracking (e.g., `size-limit`)
- Add changesets or similar release automation

---

## 6. TypeScript Experience

### Pain Points

**A. `biome-ignore lint/suspicious/noExplicitAny`** appears 10+ times — All `registry` types use `ComponentType<any>`.

**B. `loadMeta()` unsafe cast** — Returns `JcMeta` via `as`, no type narrowing benefit.

**C. `ShowcaseState` mixes data + callbacks** — Hard to type "just data" or "just actions" separately.

**D. No generic `definePlugin<T>()`** — Plugin authors can't get type-safe access to their item values.

**E. Missing JSDoc on union type members** — `JcControlType` values like `'multiline'`, `'json'`, `'readonly'` undocumented.

**F. Plain `string` for qualified keys** — `'lucide/star'` could use template literal type `${string}/${string}`.

### Suggestions

- Separate `ShowcaseData` and `ShowcaseActions` types
- JSDoc on all union members
- Generic `definePlugin<T>()` for type-safe items
- Branded/template literal type for qualified keys
- `JcMeta` type guard for runtime validation

---

## 7. Package Distribution

### Pain Points

- No `main`/`types` top-level fields (some tools need them)
- `typescript` not listed as peer dependency
- No `homepage` or `author` fields
- `engines` only specifies Node, no Bun mention
- No CJS fallback for library entries (ESM-only may break ts-jest, older SSR)

### Suggestions

- Add `"main": "./dist/index.js"` and `"types": "./dist/index.d.ts"` top-level
- Add `typescript` as optional peer dependency
- Add homepage, author fields
- Consider `require` conditions in exports for broader compatibility

---

## 8. Integration Patterns

### Pain Points

- `next.tsx` and `react.tsx` are 95% identical — shared factory would reduce duplication
- No Remix adapter despite detecting Remix in `detectEnvironment()`
- No Vite plugin — extraction is CLI-only, could integrate with dev server HMR
- `wrapper` prop is single component — needs manual composition for multiple providers

### Suggestions

- Extract shared adapter logic into a factory
- Add Vite plugin (`vite-plugin-jc`) for integrated dev experience
- `wrappers: ComponentType[]` array prop with auto-composition
- Add Remix adapter at minimum

---

## 9. Accessibility of the Showcase UI - NOT TO DO RIGHT NOW

### Issues

- No keyboard navigation — sidebar buttons have no focus styles
- Search input has `outline: none` removing default focus indicator
- No ARIA roles (`role="listbox"`, `aria-selected`, `role="separator"`)
- No skip links (sidebar → preview)
- Custom scrollbar hiding removes accessibility affordance
- Hardcoded error color `#ef4444` not themeable

### Suggestions

- Add focus styles to all interactive elements
- Add proper ARIA attributes
- Add skip links
- Make all colors use CSS variables

---

## 10. Missing Ecosystem Integrations - NOT TO DO RIGHT NOW


| Integration         | Value                                                   | Effort |
| ------------------- | ------------------------------------------------------- | ------ |
| VS Code extension   | Inline prop previews, go-to-showcase, extraction status | High   |
| ESLint/Biome plugin | Warn on missing `@example` JSDoc                        | Medium |
| Vite plugin         | Integrated extraction + HMR                             | Medium |
| Monorepo docs       | Guidance for Turborepo/monorepo consumers               | Low    |


---

## Top 10 Highest-Impact Improvements


| #   | Improvement                                   | Category                |
| --- | --------------------------------------------- | ----------------------- |
| 1   | `jc init` command                             | CLI / Onboarding        |
| 2   | Config validation with Zod                    | Config / Error handling |
| 3   | `loadMeta()` structural validation            | Error handling          |
| 4   | Publish to npm                                | Distribution            |
| 5   | Vite plugin                                   | Ecosystem               |
| 6   | Surface plugin suggestions in UI              | DX / Error handling     |
| 7   | Incremental watch mode                        | Performance             |
| 8   | Accessibility audit of showcase UI            | A11y                    |
| 9   | CI alignment (bun install, verify use client) | Build                   |
| 10  | README consistency (match current API)        | Documentation           |


