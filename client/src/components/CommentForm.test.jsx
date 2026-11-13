import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommentForm from './CommentForm'

const box = () => screen.getByLabelText(/add a comment/i)
const post = () => screen.getByRole('button', { name: /post comment/i })

describe('CommentForm', () => {
  it('submits trimmed content and clears the field', async () => {
    const onSubmit = vi.fn().mockResolvedValue()

    render(<CommentForm onSubmit={onSubmit} />)
    await userEvent.type(box(), '  hello  ')
    await userEvent.click(post())

    expect(onSubmit).toHaveBeenCalledWith('hello')
    expect(box()).toHaveValue('')
  })

  it('rejects blank content without calling onSubmit', async () => {
    const onSubmit = vi.fn()

    render(<CommentForm onSubmit={onSubmit} />)
    await userEvent.type(box(), '   ')
    await userEvent.click(post())

    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be blank/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows the error and keeps the draft when submit fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server down'))

    render(<CommentForm onSubmit={onSubmit} />)
    await userEvent.type(box(), 'draft')
    await userEvent.click(post())

    expect(await screen.findByRole('alert')).toHaveTextContent('Server down')
    expect(box()).toHaveValue('draft')
  })

  it('blocks duplicate submissions while one is in flight', async () => {
    let resolve
    const onSubmit = vi.fn(
      () =>
        new Promise((r) => {
          resolve = r
        })
    )

    render(<CommentForm onSubmit={onSubmit} />)
    await userEvent.type(box(), 'once')
    await userEvent.click(post())

    const busy = screen.getByRole('button', { name: /posting/i })

    expect(busy).toBeDisabled()
    await userEvent.click(busy)
    expect(onSubmit).toHaveBeenCalledTimes(1)

    resolve()
    expect(
      await screen.findByRole('button', { name: /post comment/i })
    ).toBeEnabled()
  })

  it('disables input and button when disabled', () => {
    render(<CommentForm onSubmit={vi.fn()} disabled />)

    expect(box()).toBeDisabled()
    expect(post()).toBeDisabled()
  })
})
