import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Skeleton } from '../../../components/ui/Skeleton'

describe('Skeleton', () => {
  it('renders single skeleton by default', () => {
    const { container } = render(<Skeleton />)
    const elements = container.querySelectorAll('.animate-pulse')
    expect(elements).toHaveLength(1)
  })

  it('renders multiple skeletons with count', () => {
    const { container } = render(<Skeleton count={3} />)
    const elements = container.querySelectorAll('.animate-pulse')
    expect(elements).toHaveLength(3)
  })

  it('renders zero count gracefully', () => {
    const { container } = render(<Skeleton count={0} />)
    const elements = container.querySelectorAll('.animate-pulse')
    expect(elements).toHaveLength(0)
  })

  it('applies custom height', () => {
    const { container } = render(<Skeleton height={40} />)
    const element = container.querySelector('.animate-pulse') as HTMLElement
    expect(element?.style.height).toBe('40px')
  })

  it('applies custom rounded via inline style', () => {
    const { container } = render(<Skeleton rounded="full" />)
    const element = container.querySelector('.animate-pulse') as HTMLElement
    expect(element?.style.borderRadius).toBe('0.375rem')
  })

  it('defaults to rounded class', () => {
    const { container } = render(<Skeleton />)
    const element = container.querySelector('.animate-pulse')
    expect(element?.className).toContain('rounded')
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="bg-red-500" />)
    const element = container.querySelector('.animate-pulse')
    expect(element?.className).toContain('bg-red-500')
  })
})
