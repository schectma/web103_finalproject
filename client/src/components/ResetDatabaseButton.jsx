import { useState } from 'react'

function ResetDatabaseButton() {
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')

  const reset = async () => {
    if (!window.confirm('Reset all data to its default state? This cannot be undone.')) {
      return
    }

    setResetting(true)
    setError('')

    try {
      const response = await fetch('/api/reset', { method: 'POST' })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? 'Could not reset database')
      }

      // Reload so every page shows the freshly seeded data
      window.location.assign('/')
    } catch (err) {
      setError(err.message)
      setResetting(false)
    }
  }

  return (
    <div className="reset-database">
      <button type="button" onClick={reset} disabled={resetting}>
        {resetting ? 'Resetting...' : 'Reset database'}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}

export default ResetDatabaseButton
