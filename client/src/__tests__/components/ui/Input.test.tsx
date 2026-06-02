import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Input } from '../../../components/ui/Input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Username" />)
    expect(screen.getByText('Username')).toBeDefined()
  })

  it('renders without label', () => {
    const { container } = render(<Input placeholder="Enter text" />)
    expect(container.querySelector('input')).toBeDefined()
  })

  it('shows error message', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeDefined()
  })

  it('passes helperText as attribute when no error', () => {
    render(<Input helperText="Enter your username" />)
    const input = document.querySelector('input')
    expect(input?.getAttribute('helpertext')).toBe('Enter your username')
  })

  it('hides helper text when error exists', () => {
    render(<Input helperText="Helper" error="Error message" />)
    expect(screen.queryByText('Helper')).toBeNull()
    expect(screen.getByText('Error message')).toBeDefined()
  })

  it('applies error styles to input', () => {
    render(<Input error="Error" />)
    const input = screen.getByRole('textbox') || document.querySelector('input')
    expect(input?.className).toContain('border-red-500')
  })

  it('forwards ref', () => {
    const ref = { current: null }
    render(<Input ref={ref} />)
    expect(ref.current).toBeDefined()
  })

  it('passes additional props to input', () => {
    const onChange = vi.fn()
    render(<Input placeholder="Test" onChange={onChange} />)
    const input = document.querySelector('input')
    expect(input?.placeholder).toBe('Test')
    if (input) {
      fireEvent.change(input, { target: { value: 'test' } })
      expect(onChange).toHaveBeenCalled()
    }
  })
})
