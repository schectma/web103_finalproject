import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import pool from './db.js'
import app from './app.js'

async function postAssignment(headers = {}) {
  const server = app.listen(0, '127.0.0.1')

  try {
    if (!server.listening) {
      await once(server, 'listening')
    }

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({})
    })

    return response.status
  } finally {
    if (server.listening) {
      await new Promise((resolve, reject) => {
        server.close(err => err ? reject(err) : resolve())
      })
    }
  }
}

// Mock the user lookup the middleware runs.
const mockUser = (user) =>
  mock.method(pool, 'query', async () => ({ rows: user ? [user] : [] }))

test('POST /api/assignments returns 401 without an X-User-Id header', async () => {
  assert.equal(await postAssignment(), 401)
})

test('POST /api/assignments returns 401 for an invalid X-User-Id header', async () => {
  assert.equal(await postAssignment({ 'X-User-Id': 'abc' }), 401)
})

test('POST /api/assignments returns 401 for an unknown user', async () => {
  const queryMock = mockUser(null)

  try {
    assert.equal(await postAssignment({ 'X-User-Id': '99' }), 401)
  } finally {
    queryMock.mock.restore()
  }
})

test('POST /api/assignments returns 403 for a student', async () => {
  const queryMock = mockUser({ id: 3, first_name: 'Sam', last_name: 'Patel', role: 'student' })

  try {
    assert.equal(await postAssignment({ 'X-User-Id': '3' }), 403)
  } finally {
    queryMock.mock.restore()
  }
})

test('POST /api/assignments lets a TA through to validation', async () => {
  const queryMock = mockUser({ id: 1, first_name: 'Taylor', last_name: 'Reyes', role: 'ta' })

  try {
    // The empty body is rejected by validation, which proves the TA got past the role check.
    assert.equal(await postAssignment({ 'X-User-Id': '1' }), 400)
  } finally {
    queryMock.mock.restore()
  }
})
