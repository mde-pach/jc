// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { JcComponentMeta } from '../types.js'
import { ShowcaseSidebar } from './showcase-sidebar.js'

afterEach(cleanup)

function makeComp(name: string, filePath = `src/components/ui/${name.toLowerCase()}.tsx`, propCount = 2): JcComponentMeta {
  const props: Record<string, any> = {}
  for (let i = 0; i < propCount; i++) {
    props[`prop${i}`] = { name: `prop${i}`, type: 'string', required: false, description: '', isChildren: false }
  }
  return { displayName: name, filePath, description: '', props, acceptsChildren: false }
}

describe('ShowcaseSidebar', () => {
  it('renders component list', () => {
    const { container } = render(
      <ShowcaseSidebar
        components={[makeComp('Button'), makeComp('Card')]}
        selectedName={null}
        search=""
        onSearch={vi.fn()}
        onSelect={vi.fn()}
      />,
    )
    expect(within(container).getByText('Button')).toBeTruthy()
    expect(within(container).getByText('Card')).toBeTruthy()
  })

  it('highlights selected component', () => {
    const { container } = render(
      <ShowcaseSidebar
        components={[makeComp('Button'), makeComp('Card')]}
        selectedName="Button"
        search=""
        onSearch={vi.fn()}
        onSelect={vi.fn()}
      />,
    )
    const btn = within(container).getByText('Button').closest('button')!
    expect(btn.style.fontWeight).toBe('500')
  })

  it('calls onSelect when component is clicked', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <ShowcaseSidebar
        components={[makeComp('Button'), makeComp('Card')]}
        selectedName={null}
        search=""
        onSearch={vi.fn()}
        onSelect={onSelect}
      />,
    )
    fireEvent.click(within(container).getByText('Card'))
    expect(onSelect).toHaveBeenCalledWith('Card')
  })

  it('calls onSearch when typing in search input', () => {
    const onSearch = vi.fn()
    const { container } = render(
      <ShowcaseSidebar
        components={[makeComp('Button')]}
        selectedName={null}
        search=""
        onSearch={onSearch}
        onSelect={vi.fn()}
      />,
    )
    const input = within(container).getByPlaceholderText('Search components...')
    fireEvent.change(input, { target: { value: 'btn' } })
    expect(onSearch).toHaveBeenCalledWith('btn')
  })

  it('shows empty state when no components', () => {
    const { container } = render(
      <ShowcaseSidebar
        components={[]}
        selectedName={null}
        search=""
        onSearch={vi.fn()}
        onSelect={vi.fn()}
      />,
    )
    expect(within(container).getByText('No components found')).toBeTruthy()
  })

  it('groups components by directory', () => {
    const { container } = render(
      <ShowcaseSidebar
        components={[
          makeComp('Button', 'src/components/ui/button.tsx'),
          makeComp('Card', 'src/components/ui/card.tsx'),
          makeComp('Header', 'src/components/layout/header.tsx'),
        ]}
        selectedName={null}
        search=""
        onSearch={vi.fn()}
        onSelect={vi.fn()}
      />,
    )
    expect(within(container).getByText('ui')).toBeTruthy()
    expect(within(container).getByText('layout')).toBeTruthy()
  })

  it('shows prop count badge', () => {
    const { container } = render(
      <ShowcaseSidebar
        components={[makeComp('Button', undefined, 5)]}
        selectedName={null}
        search=""
        onSearch={vi.fn()}
        onSelect={vi.fn()}
      />,
    )
    // 5 props → badge shows "5"
    const badge = within(container).getByText('5')
    expect(badge).toBeTruthy()
  })
})
