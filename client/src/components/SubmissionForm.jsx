import { useRef, useState } from 'react'

// Used for both creating (defaults) and editing (initial values + onCancel)
function SubmissionForm({
  onSubmit,
  submitting,
  errors,
  initialStatus = 'in_progress',
  initialNotes = '',
  title = 'Submit your work',
  submitLabel = 'Submit',
  onCancel
}) {
  const [status, setStatus] = useState(initialStatus)
  const [notes, setNotes] = useState(initialNotes)

  const submittingRef = useRef(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (submittingRef.current || submitting) return

    submittingRef.current = true

    try {
      const saved = await onSubmit({ status, notes })

      if (saved && !onCancel) {
        setStatus('in_progress')
        setNotes('')
      }
    } catch (error) {
      console.error('Submission failed:', error)
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <form className="assignment-form" onSubmit={handleSubmit}>
      <h3>{title}</h3>

      <label>
        Status
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          disabled={submitting}
        >
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </label>

      <label>
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={submitting}
          rows={3}
        />
      </label>

      {errors.length > 0 && (
        <ul role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : submitLabel}
      </button>

      {onCancel && (
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      )}
    </form>
  )
}

export default SubmissionForm
