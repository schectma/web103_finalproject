export function priorityLabel(priority) {
  if (priority === 3) return 'High'
  if (priority === 2) return 'Medium'
  if (priority === 1) return 'Low'
  return 'Unassigned'
}

function isValidPriority(priority) {
  return priority === 1 || priority === 2 || priority === 3
}

export function effectivePriority(assignment, progress) {
  if (isValidPriority(progress?.priority)) return progress.priority
  if (isValidPriority(assignment.priority)) return assignment.priority
  return 0
}

export function setPersonalPriority(progressRows, userId, assignmentId, priority) {
  if (priority !== null && !isValidPriority(priority)) {
    throw new TypeError('Priority must be 1, 2, 3, or null')
  }

  const previous = progressRows.find(row =>
    String(row.user_id) === String(userId) &&
    String(row.assignment_id) === String(assignmentId)
  )
  const updatedProgress = { ...previous, user_id: userId, assignment_id: assignmentId, priority }
  const otherRows = progressRows.filter(row =>
    String(row.user_id) !== String(userId) ||
    String(row.assignment_id) !== String(assignmentId)
  )
  return [...otherRows, updatedProgress]
}

function dueTime(assignment) {
  if (!assignment.due_date) return Infinity
  const time = new Date(assignment.due_date).getTime()
  if (Number.isNaN(time)) return Infinity
  return time
}

export function rankAssignments(assignments, progressRows, userId) {
  function getPriority(assignment) {
    const progress = progressRows.find(row =>
      String(row.user_id) === String(userId) &&
      String(row.assignment_id) === String(assignment.id)
    )
    return effectivePriority(assignment, progress)
  }

  const sortedAssignments = [...assignments]
  sortedAssignments.sort((first, second) => {
    const priorityDifference = getPriority(second) - getPriority(first)
    if (priorityDifference !== 0) return priorityDifference
    if (dueTime(first) < dueTime(second)) return -1
    if (dueTime(first) > dueTime(second)) return 1
    return 0
  })
  return sortedAssignments
}
