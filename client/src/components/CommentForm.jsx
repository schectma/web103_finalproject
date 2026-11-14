import { useRef, useState } from 'react'
import './CommentForm.css'

// onSubmit(content) may return a promise; reject to show an error.
export default function CommentForm({ onSubmit, disabled = false }) {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (submittingRef.current) return

    const trimmed = content.trim()

    if (!trimmed) {
      setError('Comment cannot be blank.')
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setError('')

    try {
      await onSubmit(trimmed)
      setContent('')
    } catch (err) {
      setError(err?.message || 'Could not post comment.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <label htmlFor="comment-content">Add a comment</label>
      <textarea
        id="comment-content"
        rows="3"
        value={content}
        disabled={disabled || submitting}
        onChange={(event) => {
          setContent(event.target.value)
          setError('')
        }}
      />
      {error && (
        <p className="comment-form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={disabled || submitting}>
        {submitting ? 'Posting...' : 'Post comment'}
      </button>
    </form>
  )
}
