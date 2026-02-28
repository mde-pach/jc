// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './error-boundary.js'

afterEach(cleanup)

function ThrowingComponent({ msg }: { msg: string }): never {
  throw new Error(msg)
}

function GoodComponent() {
  return <div>OK</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    const { container } = render(
      <ErrorBoundary componentName="Test">
        <GoodComponent />
      </ErrorBoundary>,
    )
    expect(within(container).getByText('OK')).toBeTruthy()
  })

  it('catches render errors and shows fallback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(
      <ErrorBoundary componentName="Test">
        <ThrowingComponent msg="boom" />
      </ErrorBoundary>,
    )
    expect(within(container).getByText('Render error')).toBeTruthy()
    expect(within(container).getByText('boom')).toBeTruthy()
    spy.mockRestore()
  })

  it('resets error when componentName changes', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container, rerender } = render(
      <ErrorBoundary componentName="Broken">
        <ThrowingComponent msg="fail" />
      </ErrorBoundary>,
    )
    expect(within(container).getByText('Render error')).toBeTruthy()

    rerender(
      <ErrorBoundary componentName="Fixed">
        <GoodComponent />
      </ErrorBoundary>,
    )
    expect(within(container).getByText('OK')).toBeTruthy()
    spy.mockRestore()
  })
})
