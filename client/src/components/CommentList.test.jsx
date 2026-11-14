import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CommentList from './CommentList'

const comments = [
  { id: 1, created_by: 1, content: 'First', created_at: '2026-11-10T10:00:00Z' },
  { id: 2, created_by: 2, content: 'Second', created_at: '2026-11-10T11:00:00Z' }
]

describe('CommentList', () => {
  it('renders one item per comment in given order', () => {
    render(<CommentList comments={comments} />)

    const items = screen.getAllByRole('listitem')

    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('First')
    expect(items[1]).toHaveTextContent('Second')
  })

  it('shows empty state when there are no comments', () => {
    render(<CommentList comments={[]} />)

    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('shows loading state instead of the list', () => {
    render(<CommentList comments={comments} loading />)

    expect(screen.getByRole('status')).toHaveTextContent(/loading comments/i)
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('shows error state as an alert', () => {
    render(<CommentList comments={comments} error="Could not load comments" />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load comments'
    )
    expect(screen.queryByRole('list')).toBeNull()
  })
})
