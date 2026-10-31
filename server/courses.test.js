import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

const PORT = 43044
const BASE_URL = `http://127.0.0.1:${PORT}`

test('Course Tracking API placeholder endpoints', async (t) => {
  const server = spawn(process.execPath, ['server.js'], {
    cwd: new URL('.', import.meta.url),
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore'
  })

  try {
    let ready = false

    for (let attempt = 0; attempt < 50; attempt++) {
      if (server.exitCode !== null) {
        throw new Error('Server exited before becoming ready')
      }

      try {
        const response = await fetch(`${BASE_URL}/api/health`)
        if (response.ok) {
          ready = true
          break
        }
      } catch {
        // Wait for the server to start.
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    assert.ok(ready, 'Server should start successfully')

    await t.test('GET /api/courses returns an empty array', async () => {
      const response = await fetch(`${BASE_URL}/api/courses`)

      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), [])
    })

    await t.test('GET /api/courses/:id returns 404', async () => {
      const response = await fetch(`${BASE_URL}/api/courses/1`)

      assert.equal(response.status, 404)
      assert.deepEqual(await response.json(), {
        error: 'Course not found'
      })
    })
  } finally {
    server.kill()
    if (server.exitCode === null && server.signalCode === null) {
      await once(server, 'exit')
    }
  }
})
