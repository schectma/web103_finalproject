import { useEffect, useRef, useState } from 'react'
import CommentList from './CommentList.jsx'
import { useCurrentUser } from '../useCurrentUser.js'

export default function StudyPlanComments({ studyPlanId }) {
  const { id: currentUserId } = useCurrentUser()
  const postController = useRef(null)
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadComments = async () => {
      setLoading(true)
      setError('')
      setComments([])
      setSubmitting(false)
      setSubmitError('')
      setContent('')

      try {
        const response = await fetch(
          `/api/study-plans/${studyPlanId}/comments`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Could not load comments')
        }

        const data = await response.json()

        if (!Array.isArray(data)) {
          throw new Error('Invalid comments response')
        }

        if (!controller.signal.aborted) {
          setComments(data)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadComments()

    return () => {
      controller.abort()
      postController.current?.abort()
    }
  }, [studyPlanId])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedContent = content.trim()

    if (submitting) return

    if (!trimmedContent) {
      setSubmitError('Please enter a comment')
      return
    }

    if (!currentUserId) {
      setSubmitError('Please select a user')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    const controller = new AbortController()
    postController.current = controller

    try {
      const response = await fetch(
        `/api/study-plans/${studyPlanId}/comments`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            created_by: currentUserId,
            content: trimmedContent
          })
        }
      )

      if (!response.ok) {
        throw new Error('Could not post comment')
      }

      const newComment = await response.json()

      if (controller.signal.aborted) return

      setComments((previous) => [...previous, newComment])
      setContent('')
    } catch (err) {
      if (!controller.signal.aborted) {
        setSubmitError(err.message)
      }
    } finally {
      if (postController.current === controller) {
        postController.current = null
      }
      if (!controller.signal.aborted) {
        setSubmitting(false)
      }
    }
  }

  return (
    <section
      className="study-plan-comments"
      aria-label="Study plan comments"
    >
      <h4>Comments</h4>

      <CommentList
        comments={comments}
        loading={loading}
        error={error}
      />

      <form onSubmit={handleSubmit} className="comment-form">
        <label htmlFor={`comment-${studyPlanId}`}>
          Add a comment
        </label>
        <textarea
          id={`comment-${studyPlanId}`}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a comment..."
          rows={3}
          disabled={submitting}
        />

        {submitError && <p role="alert">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting || loading || !currentUserId}
        >
          {submitting ? 'Posting...' : 'Post comment'}
        </button>
      </form>
    </section>
  )
}
