import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Spinner } from '../../../components/ui/Spinner'

describe('Spinner', () => {
  function getSpinner(container: HTMLElement): HTMLElement | null {
    return container.querySelector('.border-amber-500')
  }

  it('renders with default size', () => {
    const { container } = render(<Spinner />)
    const spinner = getSpinner(container) as HTMLElement
    expect(spinner.style.width).toBe('24px')
    expect(spinner.style.height).toBe('24px')
  })

  it('renders with custom size', () => {
    const { container } = render(<Spinner size={16} />)
    const spinner = getSpinner(container) as HTMLElement
    expect(spinner.style.width).toBe('16px')
    expect(spinner.style.height).toBe('16px')
  })

  it('renders with large size', () => {
    const { container } = render(<Spinner size={48} />)
    const spinner = getSpinner(container) as HTMLElement
    expect(spinner.style.width).toBe('48px')
    expect(spinner.style.height).toBe('48px')
  })

  it('renders with custom className', () => {
    const { container } = render(<Spinner className="custom-spinner" />)
    const outer = container.firstElementChild as HTMLElement
    expect(outer.className).toContain('custom-spinner')
  })

  it('has animate-spin class', () => {
    const { container } = render(<Spinner />)
    const spinner = getSpinner(container) as HTMLElement
    expect(spinner.className).toContain('animate-spin')
  })
})
