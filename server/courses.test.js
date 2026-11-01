import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import app from './app.js'

test('Course Tracking API placeholder endpoints', async (t) => {
  // Port 0 lets the OS pick a free port, so tests never collide with a running dev server
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => server.close())

  const BASE_URL = `http://127.0.0.1:${server.address().port}`

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
})
