import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, test, vi } from 'vitest'
import AssignmentsPage from './AssignmentsPage.jsx'

const courses = [
  { id: 1, course_name: 'Web Development' },
  { id: 2, course_name: 'Database Systems' }
]

const assignments = [
  { id: 101, course_id: 1, title: 'No Priority Task', priority: null, due_date: '2026-12-01' },
  { id: 102, course_id: 1, title: 'Low Task', priority: 1, due_date: '2026-12-02' },
  { id: 103, course_id: 1, title: 'High Task A', priority: 3, due_date: '2026-12-05' },
  { id: 104, course_id: 1, title: 'High Task B', priority: 3, due_date: '2026-12-05' },
  { id: 105, course_id: 2, title: 'Medium Task', priority: 2, due_date: '2026-12-03' },
  { id: 106, course_id: 2, title: 'High Task Earlier', priority: 3, due_date: '2026-12-04' }
]

function renderAssignmentsPage(overrides = {}) {
  const { filteredPageAssignments, ...rest } = overrides

  return render(
    <MemoryRouter>
      <AssignmentsPage
        courses={courses}
        assignments={filteredPageAssignments ?? assignments}
        loading={false}
        error=""
        role="student"
        currentUserId={1}
        onAssignmentCreated={vi.fn()}
        {...rest}
      />
    </MemoryRouter>
  )
}

function getAssignmentTitles() {
  const link = screen.getByRole('link', { name: 'No Priority Task' })
  const list = link.closest('ul')

  return [...list.querySelectorAll('li .item-name')]
    .map((element) => element.textContent)
}

describe('AssignmentsPage sorting', () => {
  test('sorts assignments by due date by default', () => {
    renderAssignmentsPage()

    expect(getAssignmentTitles()).toEqual([
      'No Priority Task',
      'Low Task',
      'Medium Task',
      'High Task Earlier',
      'High Task A',
      'High Task B'
    ])
  })

  test('sorts by priority from high to low', async () => {
    const user = userEvent.setup()
    renderAssignmentsPage()

    await user.selectOptions(screen.getByLabelText('Sort by'), 'priority')

    expect(getAssignmentTitles()).toEqual([
      'High Task Earlier',
      'High Task A',
      'High Task B',
      'Medium Task',
      'Low Task',
      'No Priority Task'
    ])
  })

  test('uses due date and ID to break priority ties', async () => {
    const user = userEvent.setup()
    renderAssignmentsPage()

    await user.selectOptions(screen.getByLabelText('Sort by'), 'priority')

    expect(getAssignmentTitles().slice(0, 3)).toEqual([
      'High Task Earlier',
      'High Task A',
      'High Task B'
    ])
  })

  test('preserves sorting when assignments are filtered by course', async () => {
    const user = userEvent.setup()
    renderAssignmentsPage()

    await user.selectOptions(screen.getByLabelText('Sort by'), 'priority')
    await user.selectOptions(screen.getByLabelText('Filter by course'), '1')

    expect(screen.getByText('Showing 4 assignments')).toBeInTheDocument()

    expect(getAssignmentTitles()).toEqual([
      'High Task A',
      'High Task B',
      'Low Task',
      'No Priority Task'
    ])
  })

  test('returns to due-date sorting when selected', async () => {
    const user = userEvent.setup()
    renderAssignmentsPage()

    const sort = screen.getByLabelText('Sort by')

    await user.selectOptions(sort, 'priority')
    await user.selectOptions(sort, 'due_date')

    expect(getAssignmentTitles()).toEqual([
      'No Priority Task',
      'Low Task',
      'Medium Task',
      'High Task Earlier',
      'High Task A',
      'High Task B'
    ])
  })

  test('places missing and invalid due dates last', () => {
    const testAssignments = [
      { id: 3, course_id: 1, title: 'Missing Date', priority: 1, due_date: null },
      { id: 2, course_id: 1, title: 'Invalid Date', priority: 1, due_date: 'invalid' },
      { id: 1, course_id: 1, title: 'Valid Date', priority: 1, due_date: '2026-12-01' }
    ]

    renderAssignmentsPage({
      filteredPageAssignments: testAssignments
    })

    const list = screen.getByRole('link', {
      name: 'Valid Date'
    }).closest('ul')

    expect(
      [...list.querySelectorAll('li .item-name')]
        .map((element) => element.textContent)
    ).toEqual([
      'Valid Date',
      'Invalid Date',
      'Missing Date'
    ])
  })
})
