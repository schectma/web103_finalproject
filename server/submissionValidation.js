export const SUBMISSION_STATUSES = ['in_progress', 'completed']

const checkStatus = (errors, status) => {
  if (!SUBMISSION_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${SUBMISSION_STATUSES.join(', ')}`)
  }
}

const checkNotes = (errors, notes) => {
  if (notes != null && typeof notes !== 'string') {
    errors.push('Notes must be a string')
  }
}

// POST body: user_id required, status and notes optional
export function validateSubmission(input) {
  const errors = []

  if (!Number.isInteger(input?.user_id) || input.user_id <= 0) {
    errors.push('User ID must be a positive integer')
  }

  if (input?.status != null) checkStatus(errors, input.status)
  checkNotes(errors, input?.notes)

  return { valid: errors.length === 0, errors }
}

// PATCH body: status and/or notes, at least one
export function validateSubmissionUpdate(input) {
  const errors = []

  if (input?.status === undefined && input?.notes === undefined) {
    errors.push('Provide status or notes to update')
  }

  if (input?.status !== undefined) checkStatus(errors, input.status)
  checkNotes(errors, input?.notes)

  return { valid: errors.length === 0, errors }
}
