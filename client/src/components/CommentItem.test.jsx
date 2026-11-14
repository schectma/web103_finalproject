import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CommentItem from './CommentItem'

const base = {
  id: 1,
  study_plan_id: 3,
  created_by: 7,
  content: 'Review chapter 4 first.',
  created_at: '2026-11-10T15:30:00.000Z'
}

describe('CommentItem', () => {
  it('renders content and author name', () => {
    render(<CommentItem comment={{ ...base, author_name: 'Ada Lovelace' }} />)

    expect(screen.getByText('Review chapter 4 first.')).toBeInTheDocument()
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
  })

  it('falls back to user id when author name is missing', () => {
    render(<CommentItem comment={base} />)

    expect(screen.getByText('User #7')).toBeInTheDocument()
  })

  it('renders a machine-readable timestamp', () => {
    const { container } = render(<CommentItem comment={base} />)

    expect(container.querySelector('time')).toHaveAttribute(
      'datetime',
      base.created_at
    )
  })

  it('omits the timestamp when the date is invalid', () => {
    const { container } = render(
      <CommentItem comment={{ ...base, created_at: 'nope' }} />
    )

    expect(container.querySelector('time')).toBeNull()
  })

  it('renders markup in content as plain text', () => {
    render(<CommentItem comment={{ ...base, content: '<b>bold</b>' }} />)

    expect(screen.getByText('<b>bold</b>')).toBeInTheDocument()
  })
})
