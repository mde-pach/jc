# Feature Improvement Analysis

## Tier 1 — High Impact (would significantly differentiate jc)

### 1. Accessibility (a11y) Testing Panel - NOT TO DO RIGHT NOW

**Current:** Zero accessibility features. Preview renders in ErrorBoundary with no a11y feedback.

**Gap:** Storybook has `@storybook/addon-a11y` (axe-core) — one of its most popular addons. Ladle lacks this too, so this would be a differentiator.

**Suggestion:** Lightweight a11y panel running `axe-core` against live preview:

- New `<A11yPanel />` sub-component from `jc/advanced`
- Toggle in header bar (next to ViewportPicker and ThemeToggle)
- Runs on prop change with debouncing
- Shows violation count badge + expandable details (impact, WCAG rule, fix)
- Optional plugin: `jc/plugins/a11y` to keep core lightweight
- `axe-core` (~50KB gzipped) as optional peer dep, dynamically imported on toggle

### 2. Markdown Documentation Support - NOT TO DO RIGHT NOW

**Current:** Component descriptions from JSDoc `@description` only. No extended prose. `description` field is a single string.

**Gap:** Storybook MDX docs, Histoire Markdown, Ladle stories all support rich docs alongside components — often cited as a top reason to adopt Storybook.

**Suggestion:** `*.jc.md` sidecar file convention:

- `button.tsx` + `button.jc.md` auto-discovered at extraction time
- Parsed and stored in `JcComponentMeta.docs?: string`
- Rendered in collapsible section above/below preview
- Supports code blocks (reuse `code-tokens.ts`), headings, lists, images
- Lightweight Markdown-to-HTML (remark or custom), no full MDX runtime needed

### 3. Named Stories / Preset Labels

**Current:** `@example` blocks produce presets labeled "Ex 1", "Ex 2". No named stories, no custom render functions, no independent URLs per story.

**Gap:** Core concept in Storybook, Ladle, Histoire. jc's presets are close but lack naming and grouping.

**Suggestion:**

- `@example Primary Button` syntax → labels preset "Primary Button" instead of "Ex 1"
- Sidecar `*.jc.tsx` for complex stories with custom render logic
- Each story gets its own URL: `?component=Button&preset=primary`
- Sidebar shows stories as sub-items under each component

### 4. Interactive Event Logging / Actions Panel

**Current:** Event handler props (`onClick`, `onChange`) filtered out entirely by `filteredPropPatterns` in config. No actions panel.

**Gap:** Storybook's "Actions" addon logs all handler calls with arguments — extremely useful for understanding component behavior.

**Suggestion:**

- Stop filtering all `on`* props — inject auto-logging wrappers instead
- Collapsible "Events" panel below code preview
- Logs: handler name, timestamp, serialized arguments
- Auto-create handlers: `(...args) => log('onClick', args)`
- Injection point: `resolveProps` in `use-resolved-component.tsx`

### 5. More Built-in Plugins

**Current:** Only `jc/plugins/lucide`. Plugin system well-designed but only one first-party plugin.

**High-value plugins (each ~60 lines following the lucide pattern):**


| Plugin                     | Library                 | Icon Count | Notes                          |
| -------------------------- | ----------------------- | ---------- | ------------------------------ |
| `jc/plugins/radix-icons`   | `@radix-ui/react-icons` | ~300       | Popular with Radix UI projects |
| `jc/plugins/heroicons`     | `@heroicons/react`      | ~600       | Popular in Tailwind projects   |
| `jc/plugins/phosphor`      | `@phosphor-icons/react` | ~1200      | Weight variants                |
| `jc/plugins/react-icons`   | `react-icons`           | 25+ sets   | Needs registry approach        |
| `jc/plugins/shadcn-colors` | shadcn/ui tokens        | —          | Color/variant options          |
| `jc/plugins/images`        | Placeholder images      | —          | For src/avatar/thumbnail props |


---

## Tier 2 — Medium Impact

### 6. Keyboard Navigation and Shortcuts

**Current:** Plain `<input>` search, no keyboard shortcuts, no arrow navigation.

**Suggestion:**

- `Cmd+K` or `/` to focus sidebar search
- Up/Down arrows to navigate component list
- Enter to select
- `Cmd+Shift+C` to copy current code
- Escape to close pickers
- Number keys 1-5 to switch presets
- `R` to reset props

### 7. Prop Change Indicators

**Current:** No visual indicator when props differ from defaults. URL hash stores the diff but UI doesn't show it.

**Suggestion:**

- Subtle dot/color indicator on modified props in ShowcaseField
- "Modified (3)" badge in Controls header
- Per-prop reset button (not just global Reset)
- Data already available: `state.defaults` contains original values

### 8. Better Responsive Preview - NOT TO DO RIGHT NOW

**Current:** ViewportPicker has 4 fixed sizes. Container sets `width` only — no iframe, no CSS media query simulation.

**Gap:** Storybook provides custom sizes, orientation toggle, viewport simulation.

**Suggestion:**

- Custom viewport width input
- Portrait/landscape toggle
- Render inside iframe for true viewport isolation (CSS media queries would work)
- Current implementation only sets container width — media queries inside the component don't respond

### 9. Enhanced Component Search - NOT TO DO RIGHT NOW

**Current:** Simple `includes()` filter on `displayName`. Grouped by last directory segment.

**Suggestion:**

- Fuzzy search ("btn" matches "Button", "IconButton")
- Search by prop name ("icon" finds components with `icon` prop)
- Search by JSDoc tag (`@category`, `@group`)
- Sort options: alphabetical, by usage count (data exists), by prop count, recently viewed
- Favorites/pinning (localStorage)
- Collapsible directory groups

### 10. Theme Customization for Preview - NOT TO DO RIGHT NOW

**Current:** Hardcoded CSS variables. Two themes (light/dark). Auto-detects from host app.

**Suggestion:**

- `ShowcaseApp` accepts `theme` prop with custom CSS variable overrides
- "Preview-only" theme (change component background without affecting chrome)
- Background options: transparent, white, dark, checkerboard, custom color

### 11. Persist User Preferences

**Current:** URL sync for component selection and props. Theme/panel widths reset on reload.

**Suggestion:** Persist to `localStorage`:

- Panel widths (sidebarW, controlsW)
- Theme mode preference
- Code mode preference (jsx/full)
- Instance count preference
- Last viewed component (when `syncUrl=false`)
- Sidebar collapsed state per group

### 12. HMR for Extraction

**Current:** CLI watch mode uses `fs.watch` with 200ms debounce, re-runs full extraction on every change.

**Suggestion:**

- Incremental extraction: only re-extract changed files, merge into existing meta
- WebSocket/SSE event to running showcase for hot-reload without full page refresh
- Pipeline already knows which files were scanned — adding file-level cache makes re-extraction near-instant

---

## Tier 3 — Nice-to-Have

### 13. Visual Regression Testing

`jc snapshot` CLI command using Playwright/Puppeteer — render each component with defaults/presets, save screenshots, `--compare` for diffing, CI-friendly JSON output.

### 14. Component Dependency Graph

Usage analysis data already exists. Add a "Dependencies" panel showing which components use/are used by the selected component.

### 15. Code Generation Enhancements

- TypeScript mode with typed prop annotations
- "Copy as test" — generate testing-library render call
- Playground link (CodeSandbox/StackBlitz)
- "Export as Storybook story" — aids migration

### 16. Performance Features

- Virtualized sidebar for 100+ component projects
- Lazy plugin loading (lucide imports all 1400+ icons eagerly)
- Preview iframe isolation for CSS/JS separation
- Web Worker extraction for parallel parsing

### 17. Color Picker Control

Detect color props → render `<input type="color">` or custom picker. Show swatch. For Tailwind projects, show Tailwind tokens in a grid.

### 18. Prop Validation & Constraints UI - NOT TO DO RIGHT NOW

- Range sliders for numbers with min/max
- Character count for strings
- Visual feedback for invalid values (before ErrorBoundary catches)

### 19. Storybook Migration Tool - NOT TO DO RIGHT NOW

`jc migrate` CLI reading `.stories.tsx` → generating `@example` JSDoc blocks on source components. Dramatically lowers switching cost.

### 20. Testing Utilities Export - NOT TO DO RIGHT NOW

`jc/test` entry point with `renderWithDefaults()`, `getComponentMeta()`, `generateProps()` for snapshot testing using jc's default generation.

### 21. `jc init` Scaffolding - NOT TO DO RIGHT NOW

Auto-detect framework, create `jc.config.ts`, create showcase page, create output directory, optionally install peer deps. `jc add plugin lucide` for plugin scaffolding.

---

## Priority Summary


| #   | Feature                              | Impact                       | Effort   |
| --- | ------------------------------------ | ---------------------------- | -------- |
| 1   | A11y testing panel                   | High — unique differentiator | Medium   |
| 2   | More built-in plugins                | High — immediate user value  | Low each |
| 3   | Named stories / preset labels        | High — closes Storybook gap  | Low      |
| 4   | Event logging / Actions panel        | High — essential for DX      | Medium   |
| 5   | Keyboard shortcuts                   | Medium — polish              | Low      |
| 6   | `jc init` scaffolding                | Medium — onboarding          | Medium   |
| 7   | Markdown docs support                | High — major feature gap     | Medium   |
| 8   | Responsive iframe isolation          | Medium — correctness         | Medium   |
| 9   | Search improvements                  | Medium — UX                  | Low      |
| 10  | Per-prop reset + modified indicators | Medium — UX                  | Low      |
| 11  | Color picker control                 | Low — polish                 | Low      |
| 12  | Persist preferences                  | Low — polish                 | Low      |
| 13  | Incremental extraction (HMR)         | Medium — DX                  | High     |
| 14  | Visual regression snapshots          | Medium — CI value            | High     |
| 15  | Storybook migration tool             | Medium — adoption            | High     |


**Quick wins** (low effort, high impact): items 2, 3, 5, 10
**Biggest differentiators**: items 1 (a11y) and 4 (event logging)
**Largest feature gap** vs Storybook: item 7 (Markdown docs)