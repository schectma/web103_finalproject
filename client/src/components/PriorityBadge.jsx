// Priority scale matches feature/issue-47-triage: 3 = High, 2 = Medium, 1 = Low.
const LEVELS = {
  3: { label: 'High', className: 'priority-high' },
  2: { label: 'Medium', className: 'priority-medium' },
  1: { label: 'Low', className: 'priority-low' }
}

export default function PriorityBadge({ priority = null }) {
  const level = LEVELS[priority]

  if (!level) {
    return <span className="priority-badge priority-none">No priority</span>
  }

  return (
    <span className={`priority-badge ${level.className}`}>
      {level.label}
    </span>
  )
}
