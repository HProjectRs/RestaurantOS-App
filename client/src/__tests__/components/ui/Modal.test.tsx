import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '../../../components/ui/Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<Modal open={false}>Content</Modal>)
    expect(container.textContent).toBe('')
  })
  it('renders content when open', () => {
    render(<Modal open={true}>Hello Modal</Modal>)
    expect(screen.getByText('Hello Modal')).toBeTruthy()
  })
  it('renders title', () => {
    render(<Modal open={true} title="My Title">Body</Modal>)
    expect(screen.getByText('My Title')).toBeTruthy()
  })
  it('renders footer', () => {
    render(<Modal open={true} footer={<button>Save</button>}>Body</Modal>)
    expect(screen.getByText('Save')).toBeTruthy()
  })
  it('calls onClose when clicking backdrop', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Modal open={true} onClose={onClose}>Body</Modal>)
    const backdrop = screen.getByText('Body').parentElement?.parentElement
    if (backdrop) {
      await user.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    }
  })
  it('locks body scroll when open', () => {
    render(<Modal open={true}>Content</Modal>)
    expect(document.body.style.overflow).toBe('hidden')
  })
})
