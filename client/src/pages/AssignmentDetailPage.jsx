import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import PriorityBadge from '../components/PriorityBadge.jsx'
import { formatDue } from '../formatDue.js'

const statusLabel = (status) =>
  status === 'completed' ? 'Completed' : 'In progress'

function AssignmentDetailPage({ courses, assignments, loading }) {
  const { assignmentId } = useParams()
  const [submissions, setSubmissions] = useState([])
  const [submissionsLoading, setSubmissionsLoading] = useState(true)
  const [submissionsError, setSubmissionsError] = useState('')

  const assignment = assignments.find(
    (item) => String(item.id) === assignmentId
  )
  const course = courses.find((item) => item.id === assignment?.course_id)

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
            {submissions.map((submission) => (
              <li key={submission.user_id}>
                <div className="assignment-info">
                  <span className="item-name">{submission.student_name}</span>
                  {submission.notes && <small>{submission.notes}</small>}
                </div>
                <span className="item-tag">{statusLabel(submission.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default AssignmentDetailPage
