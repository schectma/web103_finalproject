// TEMPORARY: no auth yet, so a fixed dev user stands in as the signed-in user.
// Set VITE_CURRENT_USER_ID to override (must be an existing users.id).
// Replace this with the logged-in user's id once auth exists.
const parsed = Number(import.meta.env.VITE_CURRENT_USER_ID)

export const CURRENT_USER_ID =
  Number.isInteger(parsed) && parsed > 0 ? parsed : 1
