/**
 * Tests for component fixture rendering — specifically verifying that
 * fixtures work correctly when used with Radix UI's asChild / Slot pattern,
 * which uses cloneElement to merge event handlers onto the child.
 *
 * @vitest-environment jsdom
 */

import {
  type ComponentType,
  act,
  cloneElement,
  createElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { JcMeta, JcPlugin, JcResolvedPluginItem } from '../types.js'
import {
  buildComponentFixturesPlugin,
  renderComponentFixture,
  resolveComponentFixtureItems,
} from './fixtures.js'
import { resolvePluginItems } from './plugins.js'

// ── Test helpers ─────────────────────────────────────────────

/** Simple Button component that renders a <button> and forwards ref + props */
// biome-ignore lint/suspicious/noExplicitAny: test component accepts arbitrary props
const TestButton = forwardRef<HTMLButtonElement, any>((props, ref) => {
  const { children, ...rest } = props
  return createElement('button', { ...rest, ref, type: 'button' }, children as ReactNode)
})
TestButton.displayName = 'TestButton'

/**
 * "Strict" Button — mimics the real example components that do NOT forward
 * arbitrary props (no `...rest` spread). Only accepts `children` and `variant`.
 * This reproduces the bug: Radix asChild adds onClick via cloneElement,
 * but the component ignores it, so the dialog never opens.
 */
const StrictButton = ({
  children,
  variant: _variant,
}: {
  children?: ReactNode
  variant?: string
}) => {
  return createElement('button', { type: 'button' }, children)
}
StrictButton.displayName = 'StrictButton'

const meta: JcMeta = {
  generatedAt: '2026-01-01',
  componentDir: 'src/components',
  components: [
    {
      displayName: 'TestButton',
      filePath: 'src/components/test-button.tsx',
      description: '',
      acceptsChildren: true,
      props: {
        label: {
          name: 'label',
          type: 'string',
          required: false,
          description: '',
          isChildren: false,
        },
      },
    },
  ],
}

// biome-ignore lint/suspicious/noExplicitAny: test registry
const registry: Record<string, () => Promise<ComponentType<any>>> = {
  TestButton: () => Promise.resolve(TestButton),
}

const basePlugins: JcPlugin[] = []
const baseItems: JcResolvedPluginItem[] = resolvePluginItems(basePlugins)

let container: HTMLDivElement
let root: Root

afterEach(() => {
  root?.unmount()
  if (container?.parentNode) container.parentNode.removeChild(container)
})

/** Mount a React element in jsdom, wait for async loading to complete */
async function mount(element: ReactElement): Promise<HTMLDivElement> {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)

  // Initial render
  await act(async () => {
    root.render(element)
  })

  // Allow microtasks (Promise.resolve in registry loader) + useEffect to flush
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  return container
}

// ── Radix asChild simulation ─────────────────────────────────
//
// Radix's Slot component does: cloneElement(child, mergedProps)
// We simulate this to test that event handlers are forwarded through
// the component fixture wrappers to the actual DOM element.

/**
 * Simulates Radix UI's asChild / Slot pattern.
 * Takes a ReactNode child, clones it with extra props (like onClick),
 * and renders the result — exactly what DialogPrimitive.Trigger does.
 */
function SlotSimulator({ children, onClick }: { children?: ReactNode; onClick: () => void }) {
  if (!isValidElement(children)) return null
  return cloneElement(children as ReactElement, { onClick } as Record<string, unknown>)
}

// ── Tests ────────────────────────────────────────────────────

describe('component fixture + cloneElement (asChild simulation)', () => {
  it('renderComponentFixture returns a valid React element', () => {
    const override = { props: { label: 'Go' }, childrenText: 'Click me' }
    const node = renderComponentFixture(
      'components/TestButton',
      override,
      meta,
      registry,
      basePlugins,
      baseItems,
    )
    expect(isValidElement(node)).toBe(true)
  })

  it('resolveComponentFixtureItems render() returns a valid React element', () => {
    const items = resolveComponentFixtureItems(meta, registry, basePlugins, baseItems)
    const item = items.find((f) => f.key === 'TestButton')
    expect(item).toBeDefined()
    const node = item!.render()
    expect(isValidElement(node)).toBe(true)
  })

  it('fixture element renders a real <button> after async load', async () => {
    const override = { props: { label: 'Go' }, childrenText: 'Click me' }
    const node = renderComponentFixture(
      'components/TestButton',
      override,
      meta,
      registry,
      basePlugins,
      baseItems,
    )

    const el = await mount(node as ReactElement)
    const button = el.querySelector('button')
    expect(button).not.toBeNull()
    expect(button!.textContent).toBe('Click me')
  })

  it('cloneElement onClick reaches the real <button> (asChild simulation)', async () => {
    const onClick = vi.fn()
    const override = { props: { label: 'Go' }, childrenText: 'Click me' }
    const node = renderComponentFixture(
      'components/TestButton',
      override,
      meta,
      registry,
      basePlugins,
      baseItems,
    ) as ReactElement

    // Simulate what Radix's <Slot> / asChild does
    const slotted = createElement(SlotSimulator, { onClick }, node)
    const el = await mount(slotted)

    const button = el.querySelector('button')
    expect(button).not.toBeNull()

    // Click the button — this is the critical test
    button!.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('resolveComponentFixtureItems render() + cloneElement onClick works', async () => {
    const onClick = vi.fn()
    const items = resolveComponentFixtureItems(meta, registry, basePlugins, baseItems)
    const item = items.find((f) => f.key === 'TestButton')!
    const node = item.render() as ReactElement

    const slotted = createElement(SlotSimulator, { onClick }, node)
    const el = await mount(slotted)

    const button = el.querySelector('button')
    expect(button).not.toBeNull()

    button!.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('BUG REPRO: strict component (no prop forwarding) + cloneElement loses onClick', async () => {
    const strictMeta: JcMeta = {
      generatedAt: '2026-01-01',
      componentDir: 'src/components',
      components: [
        {
          displayName: 'StrictButton',
          filePath: 'src/components/strict-button.tsx',
          description: '',
          acceptsChildren: true,
          props: {
            variant: {
              name: 'variant',
              type: 'string',
              required: false,
              description: '',
              isChildren: false,
            },
          },
        },
      ],
    }

    // biome-ignore lint/suspicious/noExplicitAny: test registry
    const strictRegistry: Record<string, () => Promise<ComponentType<any>>> = {
      StrictButton: () => Promise.resolve(StrictButton),
    }

    const onClick = vi.fn()
    const override = { props: { variant: 'primary' }, childrenText: 'Click me' }
    const node = renderComponentFixture(
      'components/StrictButton',
      override,
      strictMeta,
      strictRegistry,
      [],
      [],
    ) as ReactElement

    // Simulate what Radix's <Slot> / asChild does
    const slotted = createElement(SlotSimulator, { onClick }, node)
    const el = await mount(slotted)

    const button = el.querySelector('button')
    expect(button).not.toBeNull()

    button!.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('fixture click works with a slow-loading component (not pre-cached)', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test component
    const SlowButton = forwardRef<HTMLButtonElement, any>((props, ref) => {
      const { children, ...rest } = props
      return createElement('button', { ...rest, ref, type: 'button' }, children as ReactNode)
    })
    SlowButton.displayName = 'SlowButton'

    const slowMeta: JcMeta = {
      generatedAt: '2026-01-01',
      componentDir: 'src/components',
      components: [
        {
          displayName: 'SlowButton',
          filePath: 'src/components/slow-button.tsx',
          description: '',
          acceptsChildren: true,
          props: {},
        },
      ],
    }

    // 100ms delay to simulate slow network load
    // biome-ignore lint/suspicious/noExplicitAny: test registry
    const slowRegistry: Record<string, () => Promise<ComponentType<any>>> = {
      SlowButton: () => new Promise((resolve) => setTimeout(() => resolve(SlowButton), 100)),
    }

    const onClick = vi.fn()
    const items = resolveComponentFixtureItems(slowMeta, slowRegistry, [], [])
    const item = items.find((f) => f.key === 'SlowButton')!
    const node = item.render() as ReactElement

    const slotted = createElement(SlotSimulator, { onClick }, node)
    const el = await mount(slotted)

    // Wait for slow component to load + flush React updates
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
    })

    const button = el.querySelector('button')
    expect(button).not.toBeNull()

    button!.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
