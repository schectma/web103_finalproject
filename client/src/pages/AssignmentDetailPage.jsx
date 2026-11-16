import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import PriorityBadge from '../components/PriorityBadge.jsx'
import SubmissionForm from '../components/SubmissionForm.jsx'
import { useCurrentUser } from '../useCurrentUser.js'
import { formatDue } from '../formatDue.js'

const statusLabel = (status) =>
  status === 'completed' ? 'Completed' : 'In progress'

function AssignmentDetailPage({ courses, assignments, loading }) {
  const { assignmentId } = useParams()
  const { id: currentUserId, role, users } = useCurrentUser()
  const [submissions, setSubmissions] = useState([])
  const [submissionsLoading, setSubmissionsLoading] = useState(true)
  const [submissionsError, setSubmissionsError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState([])
  const [editing, setEditing] = useState(false)
  const [editErrors, setEditErrors] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const assignment = assignments.find(
    (item) => String(item.id) === assignmentId
  )
  const course = courses.find((item) => item.id === assignment?.course_id)

  const hasSubmitted = submissions.some(
    (submission) => submission.user_id === currentUserId
  )

  // Resolves true when the submission was saved so the form can clear itself
  const createSubmission = async ({ status, notes }) => {
    setSubmitting(true)
    setFormErrors([])

    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/submissions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUserId, status, notes })
        }
      )
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setFormErrors(
          data.errors ?? [data.error ?? 'Could not save submission']
        )
        return false
      }

      const me = users.find((user) => user.id === currentUserId)
      setSubmissions((current) => [
        ...current,
        {
          ...data,
          student_name: me ? `${me.first_name} ${me.last_name}` : 'You'
        }
      ])
      return true
    } catch {
      setFormErrors(['Could not reach the server'])
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const updateSubmission = async ({ status, notes }) => {
    setSubmitting(true)
    setEditErrors([])

    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/submissions/${currentUserId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, notes: notes.trim() || null })
        }
      )
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setEditErrors(
          data.errors ?? [data.error ?? 'Could not update submission']
        )
        return false
      }

      setSubmissions((current) =>
        current.map((item) =>
          item.user_id === currentUserId ? { ...item, ...data } : item
        )
      )
      setEditing(false)
      return true
    } catch {
      setEditErrors(['Could not reach the server'])
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const deleteSubmission = async () => {
    if (!window.confirm('Delete your submission?')) return

    setDeleting(true)
    setDeleteError('')

    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/submissions/${currentUserId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setDeleteError(data.error ?? 'Could not delete submission')
        return
      }

      setSubmissions((current) =>
        current.filter((item) => item.user_id !== currentUserId)
      )
    } catch {
      setDeleteError('Could not reach the server')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadSubmissions = async () => {
      setSubmissionsLoading(true)
      setSubmissionsError('')

      try {
        const response = await fetch(
          `/api/assignments/${assignmentId}/submissions`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Could not load submissions')
        }

        const data = await response.json()

        if (!controller.signal.aborted) {
          setSubmissions(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setSubmissionsError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setSubmissionsLoading(false)
        }
      }
    }

    loadSubmissions()

    return () => controller.abort()
  }, [assignmentId])

  if (loading) {
    return <p role="status">Loading assignment...</p>
  }

  if (!assignment) {
    return (
      <section className="content-card">
        <p className="empty-message" role="alert">Assignment not found.</p>
        <Link to="/assignments">Back to assignments</Link>
      </section>
    )
  }

  return (
    <>
      <section className="welcome-section">
        <div>
          <Link to="/assignments">Back to assignments</Link>
          <h1>{assignment.title}</h1>
          <p>
            {course?.course_name ?? 'Unknown course'} · Due{' '}
            {formatDue(assignment.due_date)}
          </p>
        </div>
        <PriorityBadge priority={assignment.priority} />
      </section>

      <section className="content-card">
        <h2>Submissions ({submissions.length})</h2>

        {submissionsLoading ? (
          <p role="status">Loading submissions...</p>
        ) : submissionsError ? (
          <p className="empty-message" role="alert">{submissionsError}</p>
        ) : submissions.length === 0 ? (
          <p className="empty-message">No submissions yet.</p>
        ) : (
          <ul className="item-list">
            {submissions.map((submission) => {
              const isMine = submission.user_id === currentUserId

              if (isMine && editing) {
                return (
                  <li key={submission.user_id}>
                    <SubmissionForm
                      title="Edit your submission"
                      submitLabel="Save"
                      initialStatus={submission.status}
                      initialNotes={submission.notes ?? ''}
                      onSubmit={updateSubmission}
                      onCancel={() => {
                        setEditing(false)
                        setEditErrors([])
                      }}
                      submitting={submitting}
                      errors={editErrors}
                    />
                  </li>
                )
              }

              return (
                <li key={submission.user_id}>
                  <div className="assignment-info">
                    <span className="item-name">{submission.student_name}</span>
                    {submission.notes && <small>{submission.notes}</small>}
                  </div>
                  <span className="item-tag">{statusLabel(submission.status)}</span>
                  {isMine && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        disabled={deleting}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={deleteSubmission}
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {deleteError && (
          <p className="empty-message" role="alert">{deleteError}</p>
        )}

        {role === 'student' && !hasSubmitted && (
          <SubmissionForm
            onSubmit={createSubmission}
            submitting={submitting}
            errors={formErrors}
          />
        )}
      </section>
    </>
  )
}

export default AssignmentDetailPage
