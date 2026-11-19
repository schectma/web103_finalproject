import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import AssignmentDetailPage from './AssignmentDetailPage.jsx'
import { CurrentUserContext } from '../useCurrentUser.js'

afterEach(() => {
  vi.restoreAllMocks()
})

test('does not show the submission form while submissions are loading', () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {}))
  )

  const currentUser = {
    id: 2,
    role: 'student',
    users: [
      {
        id: 2,
        first_name: 'Test',
        last_name: 'Student',
        role: 'student'
      }
    ],
    setCurrentUserId: vi.fn()
  }

  const courses = [
    { id: 1, course_name: 'Web Development' }
  ]

  const assignments = [
    {
      id: 101,
      course_id: 1,
      title: 'React Project',
      description: 'Build a React application',
      due_date: '2026-12-01T12:00:00',
      priority: 3
    }
  ]

  render(
    <CurrentUserContext.Provider value={currentUser}>
      <MemoryRouter initialEntries={['/assignments/101']}>
        <Routes>
          <Route
            path="/assignments/:assignmentId"
            element={
              <AssignmentDetailPage
                courses={courses}
                assignments={assignments}
                loading={false}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </CurrentUserContext.Provider>
  )

  expect(screen.getByText('Loading submissions...')).toBeInTheDocument()

  expect(
    screen.queryByRole('heading', { name: 'Submit your work' })
  ).not.toBeInTheDocument()
})

test('does not show the submission form when loading submissions fails', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: false,
    status: 500
  })))

  const currentUser = {
    id: 2,
    role: 'student',
    users: [
      {
        id: 2,
        first_name: 'Test',
        last_name: 'Student',
        role: 'student'
      }
    ],
    setCurrentUserId: vi.fn()
  }

  const courses = [
    { id: 1, course_name: 'Web Development' }
  ]

  const assignments = [
    {
      id: 101,
      course_id: 1,
      title: 'React Project',
      description: 'Build a React application',
      due_date: '2026-12-01T12:00:00',
      priority: 3
    }
  ]

  render(
    <CurrentUserContext.Provider value={currentUser}>
      <MemoryRouter initialEntries={['/assignments/101']}>
        <Routes>
          <Route
            path="/assignments/:assignmentId"
            element={
              <AssignmentDetailPage
                courses={courses}
                assignments={assignments}
                loading={false}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </CurrentUserContext.Provider>
  )

  expect(
    await screen.findByRole('alert')
  ).toHaveTextContent('Could not load submissions')

  expect(
    screen.queryByRole('heading', { name: 'Submit your work' })
  ).not.toBeInTheDocument()
})

test('displays assignment instructions on the detail page', () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {}))
  )

  const currentUser = {
    id: 2,
    role: 'student',
    users: [],
    setCurrentUserId: vi.fn()
  }

  const courses = [
    { id: 1, course_name: 'Web Development' }
  ]

  const assignments = [
    {
      id: 101,
      course_id: 1,
      title: 'React Project',
      description: 'Build a React application using reusable components.',
      due_date: '2026-12-01T12:00:00',
      priority: 3
    }
  ]

  render(
    <CurrentUserContext.Provider value={currentUser}>
      <MemoryRouter initialEntries={['/assignments/101']}>
        <Routes>
          <Route
            path="/assignments/:assignmentId"
            element={
              <AssignmentDetailPage
                courses={courses}
                assignments={assignments}
                loading={false}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </CurrentUserContext.Provider>
  )

  expect(
    screen.getByText('Build a React application using reusable components.')
  ).toBeInTheDocument()
})

test.each([
  {
    name: 'shows the form when the student has not submitted',
    submissions: [],
    shouldShowForm: true
  },
  {
    name: 'hides the form when the student already submitted',
    submissions: [{ id: 501, user_id: 2, assignment_id: 101 }],
    shouldShowForm: false
  }
])('$name', async ({ submissions, shouldShowForm }) => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => submissions
  })))

  const currentUser = {
    id: 2,
    role: 'student',
    users: [{ id: 2, role: 'student', first_name: 'Test', last_name: 'Student' }],
    setCurrentUserId: vi.fn()
  }

  const courses = [{ id: 1, course_name: 'Web Development' }]

  const assignments = [{
    id: 101,
    course_id: 1,
    title: 'React Project',
    description: 'Build a React application',
    due_date: '2026-12-01T12:00:00',
    priority: 3
  }]

  render(
    <CurrentUserContext.Provider value={currentUser}>
      <MemoryRouter initialEntries={['/assignments/101']}>
        <Routes>
          <Route
            path="/assignments/:assignmentId"
            element={
              <AssignmentDetailPage
                courses={courses}
                assignments={assignments}
                loading={false}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </CurrentUserContext.Provider>
  )

  await screen.findByRole('heading', { name: /Submissions/ })

  const { waitFor } = await import('@testing-library/react')

  await waitFor(() => {
    expect(screen.queryByText('Loading submissions...')).not.toBeInTheDocument()
  })

  const form = screen.queryByRole('heading', { name: 'Submit your work' })

  if (shouldShowForm) {
    expect(form).toBeInTheDocument()
  } else {
    expect(form).not.toBeInTheDocument()
  }
})

test.each([
  { name: 'missing', description: undefined },
  { name: 'empty', description: '' },
  { name: 'whitespace-only', description: '   ' }
])('hides instructions when the description is $name', ({ description }) => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

  const currentUser = {
    id: 2,
    role: 'student',
    users: [],
    setCurrentUserId: vi.fn()
  }

  const courses = [{ id: 1, course_name: 'Web Development' }]

  const assignments = [{
    id: 101,
    course_id: 1,
    title: 'React Project',
    description,
    due_date: '2026-12-01T12:00:00',
    priority: 3
  }]

  render(
    <CurrentUserContext.Provider value={currentUser}>
      <MemoryRouter initialEntries={['/assignments/101']}>
        <Routes>
          <Route
            path="/assignments/:assignmentId"
            element={
              <AssignmentDetailPage
                courses={courses}
                assignments={assignments}
                loading={false}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </CurrentUserContext.Provider>
  )

  expect(
    screen.queryByRole('heading', { name: 'Instructions' })
  ).not.toBeInTheDocument()

  expect(
    screen.getByRole('heading', { name: /Submissions/ })
  ).toBeInTheDocument()
})
