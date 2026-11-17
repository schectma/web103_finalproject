import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import CoursesPage from './CoursesPage.jsx'

test('links course assignments to their detail pages', () => {
  const courses = [
    { id: 1, course_name: 'Web Development' }
  ]

  const assignments = [
    {
      id: 101,
      course_id: 1,
      title: 'React Project',
      due_date: '2026-12-01',
      priority: 3
    }
  ]

  render(
    <MemoryRouter initialEntries={['/courses/1']}>
      <Routes>
        <Route
          path="/courses/:courseId"
          element={
            <CoursesPage
              courses={courses}
              assignments={assignments}
              loading={false}
              error=""
            />
          }
        />
      </Routes>
    </MemoryRouter>
  )

  const assignmentLink = screen.getByRole('link', {
    name: 'React Project'
  })

  expect(assignmentLink).toHaveAttribute(
    'href',
    '/assignments/101'
  )
})
