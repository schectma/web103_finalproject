import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import DashboardPage from './DashboardPage.jsx'

afterEach(() => {
  vi.useRealTimers()
})

test.each([
  [9, 'Good morning!'],
  [12, 'Good afternoon!'],
  [18, 'Good evening!']
])('displays the correct Dashboard greeting at hour %i', (hour, expected) => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 17, hour, 0, 0))

  render(
    <DashboardPage
      courses={[]}
      studyPlans={[]}
      loading={false}
      error={null}
      selectedCourse={null}
      setSelectedCourse={vi.fn()}
      visibleAssignments={[]}
      courseName={() => 'Unknown course'}
    />
  )

  expect(
    screen.getByRole('heading', { name: expected })
  ).toBeInTheDocument()
})
