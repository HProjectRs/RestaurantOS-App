import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Tooltip from '../../../components/ui/Tooltip'

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders children', () => {
    render(<Tooltip text="Tooltip text"><button>Hover me</button></Tooltip>)
    expect(screen.getByText('Hover me')).toBeDefined()
  })

  it('shows tooltip on mouse enter after delay', () => {
    render(<Tooltip text="Helpful info"><button>Hover</button></Tooltip>)
    fireEvent.mouseEnter(screen.getByText('Hover'))
    expect(screen.queryByText('Helpful info')).toBeNull()
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByText('Helpful info')).toBeDefined()
  })

  it('hides tooltip on mouse leave', () => {
    render(<Tooltip text="Helpful info"><button>Hover</button></Tooltip>)
    fireEvent.mouseEnter(screen.getByText('Hover'))
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByText('Helpful info')).toBeDefined()
    fireEvent.mouseLeave(screen.getByText('Hover'))
    expect(screen.queryByText('Helpful info')).toBeNull()
  })

  it('uses custom delay', () => {
    render(<Tooltip text="Delayed" delay={500}><button>Hover</button></Tooltip>)
    fireEvent.mouseEnter(screen.getByText('Hover'))
    vi.advanceTimersByTime(200)
    expect(screen.queryByText('Delayed')).toBeNull()
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.getByText('Delayed')).toBeDefined()
  })

  it('hides tooltip when leaving before delay completes', () => {
    render(<Tooltip text="Quick" delay={300}><button>Hover</button></Tooltip>)
    fireEvent.mouseEnter(screen.getByText('Hover'))
    fireEvent.mouseLeave(screen.getByText('Hover'))
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.queryByText('Quick')).toBeNull()
  })
})
