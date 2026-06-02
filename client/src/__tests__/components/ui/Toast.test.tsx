import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ToastProvider } from '../../../components/ui/Toast'

describe('ToastProvider', () => {
  it('renders toaster container', () => {
    const { container } = render(<ToastProvider />)
    const toaster = container.querySelector('[data-rht-toaster]')
    expect(toaster).toBeTruthy()
  })

  it('renders with top-center position', () => {
    const { container } = render(<ToastProvider />)
    const toaster = container.querySelector('[data-rht-toaster]') as HTMLElement
    expect(toaster?.style.top).toBe('16px')
    expect(toaster?.style.left).toBe('16px')
    expect(toaster?.style.right).toBe('16px')
  })
})
