import { createContext, useContext } from 'react'

export const CurrentUserContext = createContext(null)

export function useCurrentUser() {
  const value = useContext(CurrentUserContext)
  if (!value) throw new Error('useCurrentUser must be used inside CurrentUserProvider')
  return value
}
