import { useState } from 'react'
import { Link } from 'react-router'
import PrioritySortControl from '../components/PrioritySortControl.jsx'
import PriorityBadge from '../components/PriorityBadge.jsx'
import { formatDue } from '../formatDue.js'

const emptyForm = {
  course_id: '',
  priority: '',
  title: '',
  description: '',
  due_date: ''
}

function AssignmentsPage({
  courses,
  assignments,
  loading,
  error,
  role,
  currentUserId,
  onAssignmentCreated
}) {
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState([])
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [assignmentCourseFilter, setAssignmentCourseFilter] = useState('all')

  const courseName = (id) =>
    courses.find((course) => course.id === id)?.course_name ??
    'Unknown course'

  const filteredPageAssignments =
    assignmentCourseFilter === 'all'
      ? assignments
      : assignments.filter(
          (assignment) => String(assignment.course_id) === assignmentCourseFilter
        )

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

      onAssignmentCreated(data)
      setForm(emptyForm)
      setSuccess(`Created "${data.title}"`)
    } catch {
      setFormErrors(['Server unreachable'])
    } finally {
      setSubmitting(false)
    }
  }

  const [assignmentSort, setAssignmentSort] = useState('due_date')

  const sortedPageAssignments = [...filteredPageAssignments].sort((a, b) => {
    if (assignmentSort === 'priority') {
      const normalizePriority = (value) =>
        value == null || value === ''
          ? 0
          : [1, 2, 3].includes(Number(value))
            ? Number(value)
            : 0

      const priorityA = normalizePriority(a.priority)
      const priorityB = normalizePriority(b.priority)

      if (priorityA !== priorityB) {
        return priorityB - priorityA
      }
    }

    const dueA = a.due_date ? new Date(a.due_date).getTime() : Infinity
    const dueB = b.due_date ? new Date(b.due_date).getTime() : Infinity

    const validDueA = Number.isNaN(dueA) ? Infinity : dueA
    const validDueB = Number.isNaN(dueB) ? Infinity : dueB

    if (validDueA !== validDueB) {
      return validDueA - validDueB
    }

    return Number(a.id) - Number(b.id)
  })

  return (
      <>
        <section className="welcome-section">
          <div>
            <h1>Assignments</h1>
            <p>Create assignments and see what is due.</p>
          </div>
        </section>

        {loading ? (
          <p role="status">
            Loading assignments...
          </p>
        ) : error ? (
          <p
            className="empty-message"
            role="alert"
          >
            {error}
          </p>
        ) : (
          <>
          <section className="content-card">
            <h2>All assignments</h2>

            <div className="course-filter">
              <label htmlFor="assignment-course-filter">
                Filter by course
              </label>
              <select
                id="assignment-course-filter"
                value={assignmentCourseFilter}
                onChange={(event) =>
                  setAssignmentCourseFilter(event.target.value)
                }
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={String(course.id)}>
                    {course.course_name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="reset-filter-button"
                onClick={() => setAssignmentCourseFilter('all')}
                disabled={assignmentCourseFilter === 'all'}
                style={{
                  visibility: assignmentCourseFilter === 'all'
                    ? 'hidden'
                    : 'visible'
                }}
              >
                Clear filter
              </button>
            </div>

            <PrioritySortControl
              options={[
                { value: 'due_date', label: 'Due date (earliest first)' },
                { value: 'priority', label: 'Priority (high to low)' }
              ]}
              value={assignmentSort}
              onChange={setAssignmentSort}
            />

            <p role="status" aria-live="polite">
              Showing {filteredPageAssignments.length}{' '}
              {filteredPageAssignments.length === 1
                ? 'assignment'
                : 'assignments'}
            </p>

            {filteredPageAssignments.length > 0 ? (
              <ul className="item-list">
                {sortedPageAssignments.map((assignment) => (
                  <li key={assignment.id}>
                    <div className="assignment-info">
                      <Link
                        className="item-name"
                        to={`/assignments/${assignment.id}`}
                      >
                        {assignment.title}
                      </Link>
                      <small>{courseName(assignment.course_id)}</small>
                    </div>
                    <PriorityBadge priority={assignment.priority} />
                    <span className="item-tag due-tag">
                      {formatDue(assignment.due_date)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-message">
                {assignmentCourseFilter === 'all'
                  ? 'No assignments available.'
                  : 'No assignments found for this course.'}
              </p>
            )}
          </section>

          {role === 'ta' && (
          <section className="content-card form-card">
            <h2>Create assignment</h2>
            <form className="assignment-form" onSubmit={submitAssignment}>
              <label>
                Course
                <select name="course_id" value={form.course_id} onChange={updateField} required>
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Title
                <input name="title" value={form.title} onChange={updateField} required />
              </label>

              <label>
                Due date
                <input
                  type="datetime-local"
                  name="due_date"
                  value={form.due_date}
                  onChange={updateField}
                  required
                />
              </label>

              <label>
                Priority
                <input
                  type="number"
                  min="1"
                  name="priority"
                  value={form.priority}
                  onChange={updateField}
                />
              </label>

              <label className="wide">
                Description
                <textarea
                  name="description"
                  rows="3"
                  value={form.description}
                  onChange={updateField}
                />
              </label>

              {formErrors.length > 0 && (
                <ul className="form-errors wide" role="alert">
                  {formErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
              {success && <p className="form-success wide" role="status">{success}</p>}

              <button type="submit" className="wide" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create assignment'}
              </button>
            </form>
          </section>
          )}
          </>
        )}
      </>
  )
}

export default AssignmentsPage
