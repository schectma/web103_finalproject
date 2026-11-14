import CommentItem from './CommentItem'
import './CommentList.css'

export default function CommentList({
  comments = [],
  loading = false,
  error = ''
}) {
  if (loading) {
    return (
      <p className="comment-list-message" role="status">
        Loading comments...
      </p>
    )
  }

  if (error) {
    return (
      <p className="comment-list-message comment-list-error" role="alert">
        {error}
      </p>
    )
  }

  if (comments.length === 0) {
    return (
      <p className="empty-message">No comments yet. Start the conversation.</p>
    )
  }

  return (
    <ul className="comment-list" aria-label="Comments">
      {comments.map((comment) => (
        <li key={comment.id}>
          <CommentItem comment={comment} />
        </li>
      ))}
    </ul>
  )
}
