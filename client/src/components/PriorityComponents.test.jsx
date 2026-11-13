import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PriorityBadge from './PriorityBadge'
import PrioritySortControl from './PrioritySortControl'

describe('PriorityBadge', () => {
  it.each([
    [3, 'High'],
    [2, 'Medium'],
    [1, 'Low'],
    [null, 'No priority'],
    [9, 'No priority']
  ])('renders %s as %s', (priority, label) => {
    render(<PriorityBadge priority={priority} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})

describe('PrioritySortControl', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' }
  ]

  it('renders supplied options and reports changes', async () => {
    const onChange = vi.fn()
    render(<PrioritySortControl options={options} value="a" onChange={onChange} />)

    const select = screen.getByLabelText(/sort by/i)
    expect(select).toHaveValue('a')

    await userEvent.selectOptions(select, 'b')
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
