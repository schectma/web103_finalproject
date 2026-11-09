import { render, screen } from '@testing-library/react'
import { vi, test, expect } from 'vitest'
import App from './App.jsx'
import { CurrentUserProvider } from './CurrentUserContext.jsx'

vi.mock('./components/StudyPlanForm.jsx', () => ({
  default: ({ creatorId, onCreated }) => (
    <div data-testid="study-plan-creator">
      {creatorId ?? "no creator"}
      <button type="button" onClick={onCreated}>
        Simulate Successful Study Plan Save
      </button>
    </div>
  )
}))

test('renders the Course Tracking navigation', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

  render(<CurrentUserProvider><App /></CurrentUserProvider>)

  expect(
    screen.getByRole('button', { name: 'Courses' })
  ).toBeInTheDocument()

  expect(
    screen.getByRole('button', { name: 'Dashboard' })
  ).toBeInTheDocument()

})

test('opens the Courses page and displays its loading state', async () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

  const user = (await import('@testing-library/user-event')).default.setup()

  render(<CurrentUserProvider><App /></CurrentUserProvider>)

  await user.click(
    screen.getByRole('button', { name: 'Courses' })
  )

  expect(
    screen.getByRole('heading', { name: 'My Courses' })
  ).toBeInTheDocument()

  expect(
    screen.getByText('Loading courses...')
  ).toHaveTextContent('Loading courses...')

})

test('displays courses and their assignment counts', async () => {
  const courses = [
  { id: 1, course_name: 'Web Development', ta_id: 1 },
  { id: 2, course_name: 'Database Systems', ta_id: 1 }
  ]

  const assignments = {
  1: [
    { id: 101, course_id: 1, title: 'React Project', due_date: '2026-12-01' },
    { id: 102, course_id: 1, title: 'API Project', due_date: '2026-12-05' }
  ],
  2: [
    { id: 103, course_id: 2, title: 'SQL Project', due_date: '2026-12-10' }
  ]
  }

  vi.stubGlobal('fetch', vi.fn(async (url) => {
  const data =
    url === '/api/health'
      ? { status: 'ok', db: 'connected' }
      : url === '/api/courses'
        ? courses
        : url === '/api/study-plans'
          ? []
        : url === '/api/courses/1/assignments'
          ? assignments[1]
          : url === '/api/courses/2/assignments'
            ? assignments[2]
            : url === '/api/study-plans'
              ? []
              : null

  if (data === null) {
    throw new Error(`Unexpected API request: ${url}`)
  }

  return {
    ok: true,
    json: async () => data
  }
  }))

  const user = (await import('@testing-library/user-event')).default.setup()

  render(<CurrentUserProvider><App /></CurrentUserProvider>)

  await user.click(screen.getByRole('button', { name: 'Courses' }))

  expect(
    await screen.findByRole('heading', { name: 'Courses (2)' })
  ).toBeInTheDocument()

  expect(screen.getByRole('button', { name: 'Web Development' }))
    .toBeInTheDocument()

  expect(screen.getByRole('button', { name: 'Database Systems' }))
    .toBeInTheDocument()

  expect(screen.getByText('2 assignments')).toBeInTheDocument()
  expect(screen.getByText('1 assignment')).toBeInTheDocument()

  await user.click(
    screen.getByRole('button', { name: 'Web Development' })
  )

  expect(screen.getByText('React Project')).toBeInTheDocument()
  expect(screen.getByText('API Project')).toBeInTheDocument()
  expect(screen.queryByText('SQL Project')).not.toBeInTheDocument()

  await user.click(
    screen.getByRole('button', { name: 'Database Systems' })
  )

  expect(screen.getByText('SQL Project')).toBeInTheDocument()
  expect(screen.queryByText('React Project')).not.toBeInTheDocument()
  expect(screen.queryByText('API Project')).not.toBeInTheDocument()

})

test('displays an empty state when a course has no assignments', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
  const data = {
    '/api/health': { status: 'ok', db: 'connected' },
    '/api/courses': [
      { id: 1, course_name: 'Empty Course', ta_id: 1 }
    ],
    '/api/courses/1/assignments': [],
    '/api/study-plans': []
  }[url]

  if (data === undefined) {
    throw new Error(`Unexpected API request: ${url}`)
  }

  return {
    ok: true,
    json: async () => data
  }
  }))

  const user = (await import('@testing-library/user-event')).default.setup()

  render(<CurrentUserProvider><App /></CurrentUserProvider>)

  await user.click(screen.getByRole('button', { name: 'Courses' }))

  expect(
    await screen.findByRole('heading', { name: 'Courses (1)' })
  ).toBeInTheDocument()

  expect(screen.getByText('0 assignments')).toBeInTheDocument()

  await user.click(
    screen.getByRole('button', { name: 'Empty Course' })
  )

  expect(
    screen.getByText('No assignments for this course.')
  ).toBeInTheDocument()

})

test('displays an empty state when no courses exist', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
  const data = {
    '/api/health': { status: 'ok', db: 'connected' },
    '/api/courses': [],
    '/api/study-plans': []
  }[url]

  if (data === undefined) {
    throw new Error(`Unexpected API request: ${url}`)
  }

  return {
    ok: true,
    json: async () => data
  }
  }))

  const user = (await import('@testing-library/user-event')).default.setup()

  render(<CurrentUserProvider><App /></CurrentUserProvider>)

  await user.click(screen.getByRole('button', { name: 'Courses' }))

  expect(
    await screen.findByRole('heading', { name: 'Courses (0)' })
  ).toBeInTheDocument()

  expect(
    screen.getByText('No courses available.')
  ).toBeInTheDocument()

  expect(
    screen.queryByText('Select a course to view its assignments.')
  ).not.toBeInTheDocument()

})

test('displays an error when the courses API fails', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
  if (url === '/api/health') {
    return {
      ok: true,
      json: async () => ({ status: 'ok', db: 'connected' })
    }
  }

  if (url === '/api/courses') {
    return {
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' })
    }
  }

  throw new Error(`Unexpected API request: ${url}`)
  }))

  const user = (await import('@testing-library/user-event')).default.setup()

  render(<CurrentUserProvider><App /></CurrentUserProvider>)

  await user.click(screen.getByRole('button', { name: 'Courses' }))

  expect(
    await screen.findByRole('alert')
  ).toHaveTextContent('Could not load courses')

  expect(
    screen.queryByText('Loading courses...')
  ).not.toBeInTheDocument()

})

test('rejects an invalid courses API response', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
  if (url === '/api/health') {
    return {
      ok: true,
      json: async () => ({ status: 'ok', db: 'connected' })
    }
  }

  if (url === '/api/courses') {
    return {
      ok: true,
      json: async () => ({ courses: [] })
    }
  }

  throw new Error(`Unexpected API request: ${url}`)
  }))

  const user = (await import('@testing-library/user-event')).default.setup()

  render(<CurrentUserProvider><App /></CurrentUserProvider>)

  await user.click(screen.getByRole('button', { name: 'Courses' }))

  expect(
    await screen.findByRole('alert')
  ).toHaveTextContent('Invalid courses response')

  expect(
    screen.queryByText('Loading courses...')
  ).not.toBeInTheDocument()

})

test('displays an error when course assignments cannot load', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
  if (url === '/api/health') {
    return {
      ok: true,
      json: async () => ({ status: 'ok', db: 'connected' })
    }
  }

  if (url === '/api/courses') {
    return {
      ok: true,
      json: async () => [
        { id: 1, course_name: 'Web Development', ta_id: 1 }
      ]
    }
  }

  if (url === '/api/study-plans') {
    return { ok: true, json: async () => [] }
  }

  if (url === '/api/courses/1/assignments') {
    return {
      ok: false,
      status: 500,
      json: async () => ({ error: 'Database unavailable' })
    }
  }

  throw new Error(`Unexpected API request: ${url}`)
  }))

  const user = (await import('@testing-library/user-event')).default.setup()

  render(<CurrentUserProvider><App /></CurrentUserProvider>)

  await user.click(screen.getByRole('button', { name: 'Courses' }))

  expect(
    await screen.findByRole('alert')
  ).toHaveTextContent('Could not load assignments for Web Development')

  expect(
    screen.queryByText('Loading courses...')
  ).not.toBeInTheDocument()

})

test('passes the selected TA ID to the Study Plan form', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === '/api/users') {
      return {
        ok: true,
        json: async () => [
          { id: 7, first_name: 'Test', last_name: 'TA', role: 'ta' }
        ]
      }
    }

    return {
      ok: true,
      json: async () => url === '/api/health'
        ? { status: 'ok', db: 'connected' }
        : []
    }
  }))

  const user = (await import('@testing-library/user-event')).default.setup()

  render(<CurrentUserProvider><App /></CurrentUserProvider>)

  await user.click(screen.getByRole('button', { name: /study plans/i }))

  expect(
    await screen.findByTestId('study-plan-creator')
  ).toHaveTextContent('7')
})

test('refreshes the study plan list after a successful save', async () => {
  let studyPlanRequests = 0

  const fetchMock = vi.fn(async (url) => {
    if (url === '/api/users') {
      return {
        ok: true,
        json: async () => [
          { id: 7, first_name: 'Test', last_name: 'TA', role: 'ta' }
        ]
      }
    }

    if (url === '/api/health') {
      return {
        ok: true,
        json: async () => ({ status: 'ok', db: 'connected' })
      }
    }

    if (url === '/api/study-plans') {
      studyPlanRequests += 1

      return {
        ok: true,
        json: async () => studyPlanRequests === 1
          ? []
          : [{
              id: 42,
              course_id: 1,
              course_name: 'Web Development',
              topic_name: null,
              creator_name: 'Test TA',
              title: 'New Study Plan',
              content: 'Review React and Express'
            }]
      }
    }

    if (url === '/api/courses') {
      return {
        ok: true,
        json: async () => [
          { id: 1, course_name: 'Web Development', ta_id: 7 }
        ]
      }
    }

    if (url === '/api/courses/1/assignments') {
      return { ok: true, json: async () => [] }
    }

    throw new Error(`Unexpected API request: ${url}`)
  })

  vi.stubGlobal('fetch', fetchMock)

  const user = (await import('@testing-library/user-event')).default.setup()

  render(<CurrentUserProvider><App /></CurrentUserProvider>)

  await user.click(screen.getByRole('button', { name: 'Study Plans' }))

  expect(
    await screen.findByRole('heading', { name: 'Available Study Plans (0)' })
  ).toBeInTheDocument()

  await user.click(
    screen.getByRole('button', {
      name: 'Simulate Successful Study Plan Save'
    })
  )

  expect(
    await screen.findByRole('heading', { name: 'Available Study Plans (1)' })
  ).toBeInTheDocument()

  expect(screen.getByText('New Study Plan')).toBeInTheDocument()
  expect(studyPlanRequests).toBe(2)
})
