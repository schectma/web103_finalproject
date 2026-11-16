import React, { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import ResetDatabaseButton from './components/ResetDatabaseButton.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import AssignmentsPage from './pages/AssignmentsPage.jsx'
import StudyPlansPage from './pages/StudyPlansPage.jsx'
import CoursesPage from './pages/CoursesPage.jsx'
import AssignmentDetailPage from './pages/AssignmentDetailPage.jsx'
import { useCurrentUser } from './useCurrentUser.js'

const emptyForm = {
  course_id: '',
  priority: '',
  title: '',
  description: '',
  due_date: ''
}

function App() {
  const [health, setHealth] = useState('checking...')
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const page = pathname.startsWith('/courses')
    ? 'courses'
    : pathname.startsWith('/assignments')
      ? 'assignments'
      : pathname.startsWith('/study-plans')
        ? 'study-plans'
        : 'dashboard'
  const { id: currentUserId, role, users, setCurrentUserId } = useCurrentUser()
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState([])
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [studyPlans, setStudyPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentTime] = useState(() => Date.now())
  const [assignmentCourseFilter, setAssignmentCourseFilter] = useState('all')

  // Assignments page filtering
  const filteredPageAssignments =
    assignmentCourseFilter === 'all'
      ? assignments
      : assignments.filter(
          (assignment) => String(assignment.course_id) === assignmentCourseFilter
        )

  useEffect(() => {
    const controller = new AbortController()

    const loadHealth = async () => {
      try {
        const response = await fetch('/api/health', {
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error('Health check failed')
        }

        const data = await response.json()

        if (!controller.signal.aborted) {
          setHealth(`${data.status} (db: ${data.db})`)
        }
      } catch {
        if (!controller.signal.aborted) {
          setHealth('unreachable')
        }
      }
    }

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const coursesResponse = await fetch('/api/courses', {
          signal: controller.signal
        })

        if (!coursesResponse.ok) {
          throw new Error('Could not load courses')
        }

        const courseData = await coursesResponse.json()

        if (!Array.isArray(courseData)) {
          throw new Error('Invalid courses response')
        }

        const assignmentLists = await Promise.all(
          courseData.map(async (course) => {
            const response = await fetch(
              `/api/courses/${course.id}/assignments`,
              { signal: controller.signal }
            )

            if (!response.ok) {
              throw new Error(
                `Could not load assignments for ${course.course_name}`
              )
            }

            const data = await response.json()

            if (!Array.isArray(data)) {
              throw new Error('Invalid assignments response')
            }

            return data
          })
        )

        const allAssignments = assignmentLists
          .flat()
          .sort(
            (a, b) =>
              new Date(a.due_date).getTime() -
              new Date(b.due_date).getTime()
          )

        const studyPlansResponse = await fetch('/api/study-plans', {
          signal: controller.signal
        })

        if (!studyPlansResponse.ok) {
          throw new Error('Could not load study plans')
        }

        const studyPlansData = await studyPlansResponse.json()

        if (!Array.isArray(studyPlansData)) {
          throw new Error('Invalid study plans response')
        }

        if (!controller.signal.aborted) {
          setCourses(courseData)
          setAssignments(allAssignments)
          setStudyPlans(studyPlansData)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.message || 'Could not load dashboard data'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadHealth()
    loadDashboard()

    return () => controller.abort()
  }, [])

  const refreshStudyPlans = async () => {
    try {
      const response = await fetch('/api/study-plans')

      if (!response.ok) {
        throw new Error('Could not refresh study plans')
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        throw new Error('Invalid study plans response')
      }

      setStudyPlans(data)
    } catch (error) {
      console.error('Failed to refresh study plans:', error)
    }
  }

  const courseName = (id) =>
    courses.find((course) => course.id === id)?.course_name ??
    'Unknown course'

    const updateField = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value })

  const submitAssignment = async (event) => {
    event.preventDefault()
    setFormErrors([])
    setSuccess('')

    if (submitting) return
    setSubmitting(true)

    const course = courses.find((c) => c.id === Number(form.course_id))

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: course ? course.id : null,
          created_by: currentUserId,
          priority: form.priority === '' ? null : Number(form.priority),
          title: form.title,
          description: form.description === '' ? null : form.description,
          due_date: form.due_date
        })
      })
      const data = await res.json()

      if (!res.ok) {
        setFormErrors(data.errors ?? [data.error ?? 'Could not create assignment'])
        return
      }

      setAssignments((prev) =>
        [...prev, data].sort(
          (a, b) => new Date(a.due_date) - new Date(b.due_date)
        )
      )
      setForm(emptyForm)
      setSuccess(`Created "${data.title}"`)
    } catch {
      setFormErrors(['Server unreachable'])
    } finally {
      setSubmitting(false)
    }
  }

  const upcomingAssignments = assignments.filter((assignment) => {
    if (!assignment.due_date) return false

    const dueDate = new Date(assignment.due_date)

    return (
      !Number.isNaN(dueDate.getTime()) &&
      dueDate.getTime() >= currentTime
    )
  })

  const visibleAssignments =
    selectedCourse === null
      ? upcomingAssignments
      : upcomingAssignments.filter(
          (assignment) => assignment.course_id === selectedCourse
        )

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true" />
          <span>StudySync</span>
        </div>

        <nav className="navigation" aria-label="Main navigation">
          <button
            type="button"
            className={
              page === 'dashboard'
                ? 'nav-link active'
                : 'nav-link'
            }
            aria-current={
              page === 'dashboard' ? 'page' : undefined
            }
            onClick={() => navigate('/')}
          >
            Dashboard
          </button>

          <button
            type="button"
            className={page === 'courses' ? 'nav-link active' : 'nav-link'}
            aria-current={page === 'courses' ? 'page' : undefined}
            onClick={() => navigate('/courses')}
          >
            Courses
          </button>

          <button
            type="button"
            className={
              page === 'assignments'
                ? 'nav-link active'
                : 'nav-link'
            }
            aria-current={
              page === 'assignments' ? 'page' : undefined
            }
            onClick={() => navigate('/assignments')}
          >
            Assignments
          </button>

          <button
            type="button"
            className={
              page === 'study-plans'
                ? 'nav-link active'
                : 'nav-link'
            }
            aria-current={
              page === 'study-plans' ? 'page' : undefined
            }
            onClick={() => navigate('/study-plans')}
          >
            Study Plans
          </button>
        </nav>

        <select
          className="role-switcher"
          aria-label="Mock user"
          value={currentUserId ?? ''}
          disabled={users.length === 0}
          onChange={(event) => setCurrentUserId(Number(event.target.value))}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.first_name} {user.last_name} ({user.role === 'ta' ? 'TA' : 'Student'})
            </option>
          ))}
        </select>
      </header>

      <main className="dashboard">
        <Routes>
          <Route
            path="/courses/:courseId?"
            element={
              <CoursesPage
                courses={courses}
                assignments={assignments}
                loading={loading}
                error={error}
              />
            }
          />
          <Route
            path="/assignments/:assignmentId"
            element={
              <AssignmentDetailPage
                courses={courses}
                assignments={assignments}
                loading={loading}
              />
            }
          />
          <Route
            path="/study-plans"
            element={
              <StudyPlansPage
                role={role}
                currentUserId={currentUserId}
                studyPlans={studyPlans}
                refreshStudyPlans={refreshStudyPlans}
                loading={loading}
                error={error}
              />
            }
          />
          <Route
            path="/assignments"
            element={
              <AssignmentsPage
                courses={courses}
                loading={loading}
                error={error}
                role={role}
                form={form}
                formErrors={formErrors}
                success={success}
                submitting={submitting}
                updateField={updateField}
                submitAssignment={submitAssignment}
                courseName={courseName}
                assignmentCourseFilter={assignmentCourseFilter}
                setAssignmentCourseFilter={setAssignmentCourseFilter}
                filteredPageAssignments={filteredPageAssignments}
              />
            }
          />
          <Route
            path="/"
            element={
              <DashboardPage
                courses={courses}
                studyPlans={studyPlans}
                loading={loading}
                error={error}
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
                visibleAssignments={visibleAssignments}
                courseName={courseName}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <p className="api-status" role="status">
          API status: {health}
        </p>

        <ResetDatabaseButton />
      </main>
    </div>
  )
}

export default App
