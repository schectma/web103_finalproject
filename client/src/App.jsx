import { useEffect, useState } from 'react'

export default function App() {
  const [health, setHealth] = useState('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(`API ${data.status}, DB ${data.db}`))
      .catch(() => setHealth('API unreachable'))
  }, [])

  return (
    <main>
      <h1>StudySync</h1>
      <p>{health}</p>
    </main>
  )
}
