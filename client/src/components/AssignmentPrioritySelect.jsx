import { priorityLabel } from '../utils/triage.js'

export default function AssignmentPrioritySelect({
  assignmentTitle, priority = null, defaultPriority = null, onPriorityChange, disabled = false
}) {
  function handleChange(event) {
    if (event.target.value === '') {
      onPriorityChange(null)
    } else {
      onPriorityChange(Number(event.target.value))
    }
  }

  return (
    <label>
      Priority for {assignmentTitle}
      <select value={priority ?? ''} onChange={handleChange} disabled={disabled}>
        <option value="">Use assignment priority ({priorityLabel(defaultPriority)})</option>
        <option value="3">High</option>
        <option value="2">Medium</option>
        <option value="1">Low</option>
      </select>
    </label>
  )
}
