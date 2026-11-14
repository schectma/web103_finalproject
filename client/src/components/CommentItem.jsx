import './CommentItem.css'

function formatTimestamp(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

// comment: { id, created_by, content, created_at, author_name? }
export default function CommentItem({ comment }) {
  const author = comment.author_name || `User #${comment.created_by}`
  const timestamp = formatTimestamp(comment.created_at)

  return (
    <article className="comment-item">
      <header className="comment-meta">
        <strong className="comment-author">{author}</strong>
        {timestamp && (
          <time className="comment-time" dateTime={comment.created_at}>
            {timestamp}
          </time>
        )}
      </header>
      <p className="comment-content">{comment.content}</p>
    </article>
  )
}
