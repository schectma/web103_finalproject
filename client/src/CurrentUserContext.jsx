import { useEffect, useState } from 'react'
import { CurrentUserContext } from './useCurrentUser.js'

const STORAGE_KEY = 'currentUserId'
const DEFAULT_USER_ID = 1

function readStoredId() {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isInteger(stored) && stored > 0 ? stored : DEFAULT_USER_ID
  } catch {
    return DEFAULT_USER_ID
  }
}

export function CurrentUserProvider({ children }) {
  const [users, setUsers] = useState([])
  const [id, setId] = useState(readStoredId)

  useEffect(() => {
    fetch('/api/users')
      .then((response) => (response.ok ? response.json() : []))
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [])

  function setCurrentUserId(nextId) {
    setId(nextId)
    try {
      localStorage.setItem(STORAGE_KEY, String(nextId))
    } catch {
      // Storage unavailable: the selection just won't persist.
    }
  }

  // Once users load, a stored id that no longer exists falls back to the first user.
  const currentUser = users.find((user) => user.id === id) ?? users[0]
  const activeId = currentUser?.id ?? id
  // Until users load the role is 'student'.
  const role = currentUser?.role ?? 'student'

  return (
    <CurrentUserContext.Provider value={{ id: activeId, role, users, setCurrentUserId }}>
      {children}
    </CurrentUserContext.Provider>
  )
}
