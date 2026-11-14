import { useEffect, useRef, useState } from 'react'
import CommentList from './CommentList.jsx'
import CommentForm from './CommentForm.jsx'
import { useCurrentUser } from '../useCurrentUser.js'

export default function StudyPlanComments({ studyPlanId }) {
  const { id: currentUserId } = useCurrentUser()
  const postController = useRef(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadComments = async () => {
      setLoading(true)
      setError('')
      setComments([])

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

  const handleSubmit = async (content) => {
    if (!currentUserId) {
      throw new Error('Please select a user')
    }

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
            content
          })
        }
      )

      if (!response.ok) {
        throw new Error('Could not post comment')
      }

      const newComment = await response.json()

      if (!controller.signal.aborted) {
        setComments((previous) => [...previous, newComment])
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        throw err
      }
    } finally {
      if (postController.current === controller) {
        postController.current = null
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

      <CommentForm
        key={studyPlanId}
        onSubmit={handleSubmit}
        disabled={loading || !currentUserId}
      />
    </section>
  )
}
