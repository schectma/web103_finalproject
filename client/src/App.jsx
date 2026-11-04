import React, { useEffect, useState } from 'react'

const emptyForm = {
  course_id: '',
  priority: '',
  title: '',
  description: '',
  due_date: ''
}

const formatDue = (due) => new Date(due).toLocaleDateString()

function App() {
  const [health, setHealth] = useState('checking...')
  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState([])
  const [success, setSuccess] = useState('')
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(`${data.status} (db: ${data.db})`))
      .catch(() => setHealth('unreachable'))
  }, [])

  // Load real courses, then the assignments belonging to each
  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then(async (rows) => {
        setCourses(rows)
        const lists = await Promise.all(
          rows.map((course) =>
            fetch(`/api/courses/${course.id}/assignments`).then((res) => res.json())
          )
        )
        setAssignments(lists.flat().sort((a, b) => new Date(a.due_date) - new Date(b.due_date)))
      })
      .catch(() => setErrors(['Could not load courses']))
  }, [])

  const courseName = (id) => courses.find((course) => course.id === id)?.course_name

  const updateField = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value })

  const submitAssignment = async (event) => {
    event.preventDefault()
    setErrors([])
    setSuccess('')

    // The course's TA is the creator until auth exists
    const course = courses.find((c) => c.id === Number(form.course_id))

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: course ? course.id : null,
          created_by: course ? course.ta_id : null,
          priority: form.priority === '' ? null : Number(form.priority),
          title: form.title,
          description: form.description === '' ? null : form.description,
          due_date: form.due_date
        })
      })
      const data = await res.json()

      if (!res.ok) {
        setErrors(data.errors ?? [data.error ?? 'Could not create assignment'])
        return
      }

      setAssignments(
        [...assignments, data].sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      )
      setForm(emptyForm)
      setSuccess(`Created "${data.title}"`)
    } catch {
      setErrors(['Server unreachable'])
    }
  }

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
            className={page === 'dashboard' ? 'nav-link active' : 'nav-link'}
            onClick={() => setPage('dashboard')}
          >
            Dashboard
          </button>
          <span className="nav-link">Courses</span>
          <button
            type="button"
            className={page === 'assignments' ? 'nav-link active' : 'nav-link'}
            onClick={() => setPage('assignments')}
          >
            Assignments
          </button>
          <span className="nav-link">Study Plans</span>
        </nav>

        <div className="profile-avatar" aria-label="Demo user">
          ME
        </div>
      </header>

      <main className="dashboard">
        {page === 'dashboard' && (
          <>
        <section className="welcome-section">
          <div>
            <h1>Good morning!</h1>
            <p>Here is your coursework at a glance.</p>
          </div>
        </section>

        <section className="summary-grid" aria-label="Dashboard summary">
          <article className="summary-card purple">
            <div className="summary-icon" aria-hidden="true">📚</div>
            <div>
              <p>My courses</p>
              <strong>{courses.length}</strong>
            </div>
          </article>

          <article className="summary-card peach">
            <div className="summary-icon" aria-hidden="true">✓</div>
            <div>
              <p>Upcoming assignments</p>
              <strong>{assignments.length}</strong>
            </div>
          </article>

          <article className="summary-card green">
            <div className="summary-icon" aria-hidden="true">📝</div>
            <div>
              <p>Study plans</p>
              <strong>0</strong>
            </div>
          </article>
        </section>

        <section className="content-grid">
          <article className="content-card">
            <h2>My courses</h2>
            <ul className="item-list">
              {courses.map((course) => (
                <li key={course.id}>
                  <span className="item-name">{course.course_name}</span>
                  <span className="item-tag">Course</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="content-card">
            <h2>Due soon</h2>
            <ul className="item-list">
              {assignments.map((assignment) => (
                <li key={assignment.id}>
                  <div className="assignment-info">
                    <span className="item-name">{assignment.title}</span>
                    <small>{courseName(assignment.course_id)}</small>
                  </div>
                  <span className="item-tag due-tag">
                    {formatDue(assignment.due_date)}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </section>
          </>
        )}

        {page === 'assignments' && (
          <>
        <section className="welcome-section">
          <div>
            <h1>Assignments</h1>
            <p>Create assignments and see what is due.</p>
          </div>
        </section>

        <section className="content-card">
          <h2>All assignments</h2>
          <ul className="item-list">
            {assignments.map((assignment) => (
              <li key={assignment.id}>
                <div className="assignment-info">
                  <span className="item-name">{assignment.title}</span>
                  <small>{courseName(assignment.course_id)}</small>
                </div>
                <span className="item-tag due-tag">
                  {formatDue(assignment.due_date)}
                </span>
              </li>
            ))}
          </ul>
        </section>

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

            {errors.length > 0 && (
              <ul className="form-errors wide" role="alert">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
            {success && <p className="form-success wide" role="status">{success}</p>}

            <button type="submit" className="wide">Create assignment</button>
          </form>
        </section>
          </>
        )}

        <p className="api-status" role="status">
          API status: {health}
        </p>
      </main>
    </div>
  )
}

export default App
