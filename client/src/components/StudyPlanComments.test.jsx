import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import StudyPlanComments from './StudyPlanComments.jsx'
import { CurrentUserContext } from '../useCurrentUser.js'

const renderComments = (studyPlanId = 10) =>
  render(
    <CurrentUserContext.Provider value={{ id: 2 }}>
      <StudyPlanComments studyPlanId={studyPlanId} />
    </CurrentUserContext.Provider>
  )

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('StudyPlanComments', () => {
  it('loads and displays comments for the selected study plan', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          created_by: 2,
          author_name: 'Alex Student',
          content: 'Review chapter three',
          created_at: '2026-11-12T12:00:00Z'
        }
      ]
    })

    vi.stubGlobal('fetch', fetchMock)

    renderComments(10)

    expect(screen.getByText('Loading comments...')).toBeInTheDocument()

    expect(await screen.findByText('Review chapter three')).toBeInTheDocument()
    expect(screen.getByText('Alex Student')).toBeInTheDocument()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/study-plans/10/comments',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it('shows the empty state when there are no comments', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => []
      })
    )

    renderComments()

    expect(
      await screen.findByText(/no comments yet/i)
    ).toBeInTheDocument()
  })

  it('shows an error when comments cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      })
    )

    renderComments()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not load comments'
      )
    })
  })

  it('posts a comment using the selected user ID', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 5,
          created_by: 2,
          author_name: 'Alex Student',
          content: 'Great study plan!',
          created_at: '2026-11-12T12:00:00Z'
        })
      })

    vi.stubGlobal('fetch', fetchMock)
    renderComments()

    await screen.findByText(/no comments yet/i)

    fireEvent.change(screen.getByLabelText('Add a comment'), {
      target: { value: '  Great study plan!  ' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))

    expect(await screen.findByText('Great study plan!')).toBeInTheDocument()

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/study-plans/10/comments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          created_by: 2,
          content: 'Great study plan!'
        })
      })
    )

    expect(screen.getByLabelText('Add a comment')).toHaveValue('')
  })

  it('rejects empty comments without sending a POST request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    })

    vi.stubGlobal('fetch', fetchMock)
    renderComments()

    await screen.findByText(/no comments yet/i)

    fireEvent.change(screen.getByLabelText('Add a comment'), {
      target: { value: '   ' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Comment cannot be blank.'
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows an error and preserves the draft when posting fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      })

    vi.stubGlobal('fetch', fetchMock)
    renderComments()

    await screen.findByText(/no comments yet/i)

    fireEvent.change(screen.getByLabelText('Add a comment'), {
      target: { value: 'Please review this' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))

    expect(
      await screen.findByText('Could not post comment')
    ).toBeInTheDocument()

    expect(screen.getByLabelText('Add a comment')).toHaveValue(
      'Please review this'
    )
  })

  it('prevents duplicate submissions while posting', async () => {
    let resolvePost

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          resolvePost = resolve
        })
      )

    vi.stubGlobal('fetch', fetchMock)
    renderComments()

    await screen.findByText(/no comments yet/i)

    fireEvent.change(screen.getByLabelText('Add a comment'), {
      target: { value: 'One comment only' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))

    expect(
      screen.getByRole('button', { name: 'Posting...' })
    ).toBeDisabled()

    expect(fetchMock).toHaveBeenCalledTimes(2)

    resolvePost({
      ok: true,
      json: async () => ({
        id: 8,
        created_by: 2,
        content: 'One comment only',
        created_at: '2026-11-12T12:00:00Z'
      })
    })

    expect(await screen.findByText('One comment only')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })


  it('does not show comments from a previous study plan', async () => {
    let resolveFirstRequest

    const fetchMock = vi.fn()
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveFirstRequest = resolve
        })
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 20,
            created_by: 2,
            author_name: 'Alex Student',
            content: 'Comment for plan 20',
            created_at: '2026-11-12T12:00:00Z'
          }
        ]
      })

    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = renderComments(10)

    rerender(
      <CurrentUserContext.Provider value={{ id: 2 }}>
        <StudyPlanComments studyPlanId={20} />
      </CurrentUserContext.Provider>
    )

    expect(
      await screen.findByText('Comment for plan 20')
    ).toBeInTheDocument()

    resolveFirstRequest({
      ok: true,
      json: async () => [
        {
          id: 10,
          created_by: 2,
          content: 'Old plan comment',
          created_at: '2026-11-12T11:00:00Z'
        }
      ]
    })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    expect(screen.queryByText('Old plan comment')).not.toBeInTheDocument()
    expect(screen.getByText('Comment for plan 20')).toBeInTheDocument()
  })


  it('resets the form when switching plans during an unfinished POST', async () => {
    let resolveOldPost

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveOldPost = resolve
        })
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = renderComments(10)

    await screen.findByText(/no comments yet/i)

    fireEvent.change(screen.getByLabelText('Add a comment'), {
      target: { value: 'Old plan draft' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))

    expect(screen.getByRole('button', { name: 'Posting...' }))
      .toBeDisabled()

    rerender(
      <CurrentUserContext.Provider value={{ id: 2 }}>
        <StudyPlanComments studyPlanId={20} />
      </CurrentUserContext.Provider>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Post comment' }))
        .toBeEnabled()
    })

    expect(screen.getByLabelText('Add a comment')).toHaveValue('')

    resolveOldPost({
      ok: true,
      json: async () => ({
        id: 99,
        created_by: 2,
        content: 'Old plan draft',
        created_at: '2026-11-12T12:00:00Z'
      })
    })

    await waitFor(() => {
      expect(screen.queryByText('Old plan draft'))
        .not.toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

})
