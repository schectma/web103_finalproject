// TEMPORARY: no auth yet, so a fixed dev user stands in as the signed-in user.
// Set VITE_CURRENT_USER_ID to override (must be an existing users.id).
// Unset falls back to user 1; a set but invalid value throws.
// Replace this with the logged-in user's id once auth exists.
const raw = import.meta.env.VITE_CURRENT_USER_ID

function resolveCurrentUserId() {
  if (raw === undefined || raw === '') return 1
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid VITE_CURRENT_USER_ID: "${raw}" (expected a positive integer)`)
  }
  return parsed
}

export const CURRENT_USER_ID = resolveCurrentUserId()
