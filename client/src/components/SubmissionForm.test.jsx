import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SubmissionForm from './SubmissionForm'

const submitButton = () =>
  screen.getByRole('button', { name: /submit/i })

describe('SubmissionForm', () => {
  it('submits the selected status and notes', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true)

    render(
      <SubmissionForm
        onSubmit={onSubmit}
        submitting={false}
        errors={[]}
      />
    )

    await userEvent.selectOptions(
      screen.getByLabelText(/status/i),
      'completed'
    )
    await userEvent.type(screen.getByLabelText(/notes/i), 'Finished')
    await userEvent.click(submitButton())

    expect(onSubmit).toHaveBeenCalledWith({
      status: 'completed',
      notes: 'Finished'
    })
  })

  it('prevents duplicate submissions while a request is pending', async () => {
    let resolveRequest

    const onSubmit = vi.fn(
      () => new Promise((resolve) => {
        resolveRequest = resolve
      })
    )

    render(
      <SubmissionForm
        onSubmit={onSubmit}
        submitting={false}
        errors={[]}
      />
    )

    const form = submitButton().closest('form')

    fireEvent.submit(form)
    fireEvent.submit(form)

    expect(onSubmit).toHaveBeenCalledTimes(1)

    resolveRequest(true)

    await waitFor(() => {
      expect(screen.getByLabelText(/notes/i)).toHaveValue('')
    })
  })

  it('allows retrying after a failed request', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onSubmit = vi.fn()
      .mockRejectedValueOnce(new Error('Server unavailable'))
      .mockResolvedValueOnce(true)

    render(
      <SubmissionForm
        onSubmit={onSubmit}
        submitting={false}
        errors={[]}
      />
    )

    const form = submitButton().closest('form')

    fireEvent.submit(form)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'Submission failed:',
        expect.any(Error)
      )
    })

    fireEvent.submit(form)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(2)
    })

    expect(errorSpy).toHaveBeenCalledWith(
      'Submission failed:',
      expect.any(Error)
    )
    errorSpy.mockRestore()
  })
})
