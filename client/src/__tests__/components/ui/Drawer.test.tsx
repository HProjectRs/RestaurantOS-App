import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Drawer from '../../../components/ui/Drawer'

describe('Drawer', () => {
  it('renders when open', () => {
    render(<Drawer open={true} onClose={() => {}} title="Test Drawer">Content</Drawer>)
    expect(screen.getByText('Test Drawer')).toBeDefined()
    expect(screen.getByText('Content')).toBeDefined()
  })

  it('does not show content when closed', () => {
    const { container } = render(<Drawer open={false} onClose={() => {}} title="Test Drawer">Content</Drawer>)
    const overlay = container.querySelector('.fixed.inset-0')
    expect(overlay?.className).toContain('invisible')
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<Drawer open={true} onClose={onClose} title="Drawer">Content</Drawer>)
    fireEvent.click(screen.getByText('\u00D7'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<Drawer open={true} onClose={onClose} title="Drawer">Content</Drawer>)
    const backdrop = container.querySelector('.bg-black\\/60')
    if (backdrop) fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('renders with right side by default', () => {
    render(<Drawer open={true} onClose={() => {}} title="Drawer">Content</Drawer>)
    const panel = screen.getByText('Content').closest('.fixed.top-0')
    expect(panel?.className).toContain('right-0')
  })

  it('renders with left side', () => {
    render(<Drawer open={true} onClose={() => {}} title="Drawer" side="left">Content</Drawer>)
  })
})
