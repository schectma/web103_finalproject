import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudyPlanForm from './StudyPlanForm'

describe('StudyPlanForm', () => {
  it('disables saving when user identification is unavailable', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, course_name: 'Web Development' }
      ]
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<StudyPlanForm />)

    expect(
      screen.getByText(/study plan saving is temporarily unavailable/i)
    ).toBeInTheDocument()

    const saveButton = screen.getByRole('button', {
      name: /save study plan/i
    })

    expect(saveButton).toBeDisabled()

    expect(
      await screen.findByRole('option', { name: 'Web Development' })
    ).toBeInTheDocument()

    expect(saveButton).toBeDisabled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/courses',
      expect.objectContaining({
        signal: expect.any(AbortSignal)
      })
    )
  })

  it('submits a valid study plan and resets the form', async () => {
    const user = userEvent.setup()

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, course_name: 'Web Development' }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 42 })
      })

    vi.stubGlobal('fetch', fetchMock)

    const onCreated = vi.fn()
    render(<StudyPlanForm creatorId={7} onCreated={onCreated} />)

    await screen.findByRole('option', {
      name: 'Web Development'
    })

    await user.selectOptions(
      screen.getByLabelText('Course'),
      '1'
    )

    await user.type(
      screen.getByLabelText('Title'),
      'Exam Preparation'
    )

    await user.type(
      screen.getByLabelText('Study Plan Content'),
      'Review React and Express'
    )

    await user.click(
      screen.getByRole('button', { name: 'Save Study Plan' })
    )

    expect(
      await screen.findByText('Study plan saved successfully!')
    ).toBeInTheDocument()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(onCreated).toHaveBeenCalledTimes(1)

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/study-plans',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: 1,
          topic_id: null,
          created_by: 7,
          title: 'Exam Preparation',
          content: 'Review React and Express'
        })
      })
    )

    expect(screen.getByLabelText('Course')).toHaveValue('')
    expect(screen.getByLabelText('Title')).toHaveValue('')
    expect(screen.getByLabelText('Study Plan Content')).toHaveValue('')
  })


  it('rejects missing required fields without submitting', async () => {
    const user = userEvent.setup()

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, course_name: 'Web Development' }
      ]
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<StudyPlanForm creatorId={7} />)

    await screen.findByRole('option', {
      name: 'Web Development'
    })

    await user.click(
      screen.getByRole('button', { name: 'Save Study Plan' })
    )

    expect(
      screen.getByText('Please select a valid course.')
    ).toBeInTheDocument()

    expect(
      screen.getByText('Please enter a study plan title.')
    ).toBeInTheDocument()

    expect(
      screen.getByText('Please enter study plan content.')
    ).toBeInTheDocument()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })


  it('displays API validation errors and preserves form input', async () => {
    const user = userEvent.setup()

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, course_name: 'Web Development' }
        ]
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          errors: ['The selected course is unavailable.']
        })
      })

    vi.stubGlobal('fetch', fetchMock)

    const onCreated = vi.fn()
    render(<StudyPlanForm creatorId={7} onCreated={onCreated} />)

    await screen.findByRole('option', {
      name: 'Web Development'
    })

    await user.selectOptions(screen.getByLabelText('Course'), '1')
    await user.type(screen.getByLabelText('Title'), 'Exam Preparation')
    await user.type(
      screen.getByLabelText('Study Plan Content'),
      'Review React and Express'
    )

    await user.click(
      screen.getByRole('button', { name: 'Save Study Plan' })
    )

    expect(
      await screen.findByText('The selected course is unavailable.')
    ).toBeInTheDocument()

    expect(screen.getByLabelText('Course')).toHaveValue('1')
    expect(screen.getByLabelText('Title')).toHaveValue('Exam Preparation')
    expect(screen.getByLabelText('Study Plan Content')).toHaveValue(
      'Review React and Express'
    )

    expect(
      screen.queryByText('Study plan saved successfully!')
    ).not.toBeInTheDocument()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(onCreated).not.toHaveBeenCalled()
  })


  it('prevents duplicate submissions while saving', async () => {
    const user = userEvent.setup()

    let resolveSubmission
    const pendingSubmission = new Promise((resolve) => {
      resolveSubmission = resolve
    })

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, course_name: 'Web Development' }
        ]
      })
      .mockImplementationOnce(() => pendingSubmission)

    vi.stubGlobal('fetch', fetchMock)

    render(<StudyPlanForm creatorId={7} />)

    await screen.findByRole('option', {
      name: 'Web Development'
    })

    await user.selectOptions(screen.getByLabelText('Course'), '1')
    await user.type(screen.getByLabelText('Title'), 'Exam Preparation')
    await user.type(
      screen.getByLabelText('Study Plan Content'),
      'Review React and Express'
    )

    const saveButton = screen.getByRole('button', {
      name: 'Save Study Plan'
    })

    await user.click(saveButton)

    expect(
      screen.getByRole('button', { name: 'Saving Study Plan...' })
    ).toBeDisabled()

    expect(fetchMock).toHaveBeenCalledTimes(2)

    await user.click(
      screen.getByRole('button', { name: 'Saving Study Plan...' })
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)

    resolveSubmission({
      ok: true,
      status: 201,
      json: async () => ({ id: 42 })
    })

    expect(
      await screen.findByText('Study plan saved successfully!')
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: 'Save Study Plan' })
    ).toBeEnabled()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })


  it('does not report success for an unexpected server response', async () => {
    const user = userEvent.setup()

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, course_name: 'Web Development' }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'OK' })
      })

    vi.stubGlobal('fetch', fetchMock)

    render(<StudyPlanForm creatorId={7} />)

    await screen.findByRole('option', {
      name: 'Web Development'
    })

    await user.selectOptions(screen.getByLabelText('Course'), '1')
    await user.type(screen.getByLabelText('Title'), 'Exam Preparation')
    await user.type(
      screen.getByLabelText('Study Plan Content'),
      'Review React and Express'
    )

    await user.click(
      screen.getByRole('button', { name: 'Save Study Plan' })
    )

    expect(
      await screen.findByText(/unexpected response from server/i)
    ).toBeInTheDocument()

    expect(
      screen.queryByText('Study plan saved successfully!')
    ).not.toBeInTheDocument()

    expect(screen.getByLabelText('Title')).toHaveValue(
      'Exam Preparation'
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

})
