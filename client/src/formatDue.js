export const formatDue = (due) => {
  if (!due) return 'No due date'

  const date = new Date(due)

  if (Number.isNaN(date.getTime())) return 'Invalid date'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
