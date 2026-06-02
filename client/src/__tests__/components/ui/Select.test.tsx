import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Select } from '../../../components/ui/Select'

describe('Select', () => {
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ]

  it('renders with label', () => {
    render(<Select label="Choose" options={options} />)
    expect(screen.getByText('Choose')).toBeDefined()
  })

  it('renders all options', () => {
    render(<Select options={options} />)
    expect(screen.getByText('Option 1')).toBeDefined()
    expect(screen.getByText('Option 2')).toBeDefined()
    expect(screen.getByText('Option 3')).toBeDefined()
  })

  it('passes placeholder as attribute when provided', () => {
    render(<Select options={options} placeholder="Select an option" />)
    const select = document.querySelector('select')
    expect(select?.getAttribute('placeholder')).toBe('Select an option')
  })

  it('renders without placeholder', () => {
    render(<Select options={options} />)
    const selectEl = document.querySelector('select')
    expect(selectEl?.options[0].text).toBe('Option 1')
  })

  it('shows error message', () => {
    render(<Select options={options} error="Required" />)
    expect(screen.getByText('Required')).toBeDefined()
  })

  it('applies error styles', () => {
    render(<Select options={options} error="Error" />)
    const select = document.querySelector('select')
    expect(select?.className).toContain('border-red-500')
  })

  it('handles selection change', () => {
    const onChange = vi.fn()
    render(<Select options={options} onChange={onChange} />)
    const select = document.querySelector('select')!
    fireEvent.change(select, { target: { value: '2' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('forwards ref', () => {
    const ref = { current: null }
    render(<Select ref={ref} options={options} />)
    expect(ref.current).toBeDefined()
  })
})
