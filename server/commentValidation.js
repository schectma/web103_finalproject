export function validateComment(input) {
  const errors = []

  if (
    !Number.isSafeInteger(input?.created_by) ||
    input.created_by <= 0
  ) {
    errors.push('Creator ID must be a positive integer')
  }

  if (
    typeof input?.content !== 'string' ||
    input.content.trim().length === 0
  ) {
    errors.push('Comment content is required')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
