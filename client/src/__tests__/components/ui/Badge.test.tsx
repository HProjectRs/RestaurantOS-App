import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '../../../components/ui/Badge'

describe('Badge', () => {
  it('renders with text', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeDefined()
  })

  it('applies default variant styles', () => {
    render(<Badge>Info</Badge>)
    const badge = screen.getByText('Info')
    expect(badge.className).toContain('rounded-full')
    expect(badge.className).toContain('text-xs')
  })

  it('applies variant specific styles', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>)
    expect(screen.getByText('Success').className).toContain('text-green-400')

    rerender(<Badge variant="danger">Danger</Badge>)
    expect(screen.getByText('Danger').className).toContain('text-red-400')

    rerender(<Badge variant="warning">Warning</Badge>)
    expect(screen.getByText('Warning').className).toContain('text-yellow-400')

    rerender(<Badge variant="info">Info</Badge>)
    expect(screen.getByText('Info').className).toContain('text-blue-400')
  })

  it('applies amber variant correctly', () => {
    render(<Badge variant="amber">Amber</Badge>)
    expect(screen.getByText('Amber').className).toContain('text-amber-400')
  })

  it('applies custom className', () => {
    render(<Badge className="extra-class">Custom</Badge>)
    expect(screen.getByText('Custom').className).toContain('extra-class')
  })

  it('uses default variant when variant is not provided', () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText('Default').className).toContain('text-gray-300')
  })
})
