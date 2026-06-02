import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../../../components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeTruthy()
  })
  it('renders with default variant and size', () => {
    render(<Button>Default</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeTruthy()
    expect(btn.getAttribute('class')).toContain('inline-flex')
  })
  it('applies custom className', () => {
    render(<Button className="custom-class">Styled</Button>)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('class')).toContain('custom-class')
  })
  it('disables when loading', () => {
    render(<Button loading>Loading</Button>)
    const btn = screen.getByRole('button')
    expect(btn.hasAttribute('disabled')).toBe(true)
  })
  it('disables when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect(btn.hasAttribute('disabled')).toBe(true)
  })
  it('calls onClick handler', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
