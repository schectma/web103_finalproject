import { useState } from 'react'

function SubmissionForm({ onSubmit, submitting, errors }) {
  const [status, setStatus] = useState('in_progress')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const saved = await onSubmit({ status, notes })

    if (saved) {
      setStatus('in_progress')
      setNotes('')
    }
  }

  return (
    <form className="assignment-form" onSubmit={handleSubmit}>
      <h3>Submit your work</h3>

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
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}

export default SubmissionForm
