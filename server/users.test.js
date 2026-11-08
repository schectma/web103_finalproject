import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import pool from './db.js'
import app from './app.js'

async function requestUsers() {
  const server = app.listen(0, '127.0.0.1')

  try {
    if (!server.listening) {
      await once(server, 'listening')
    }

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/users`)

    return { status: response.status, data: await response.json() }
  } finally {
    if (server.listening) {
      await new Promise((resolve, reject) => {
        server.close(err => err ? reject(err) : resolve())
      })
    }
  }
}

test('GET /api/users returns only id, names and role', async () => {
  const rows = [{ id: 1, first_name: 'Ada', last_name: 'Lovelace', role: 'ta' }]
  const queryMock = mock.method(pool, 'query', async () => ({ rows }))

  try {
    const { status, data } = await requestUsers()

    assert.equal(status, 200)
    assert.deepEqual(data, rows)

    const sql = queryMock.mock.calls[0].arguments[0]
    assert.match(sql, /SELECT id, first_name, last_name, role FROM users/)
  } finally {
    queryMock.mock.restore()
  }
})

test('GET /api/users returns 500 when the query fails', async () => {
  const queryMock = mock.method(pool, 'query', async () => {
    throw new Error('db down')
  })
  const errorMock = mock.method(console, 'error', () => {})

  try {
    const { status, data } = await requestUsers()

    assert.equal(status, 500)
    assert.deepEqual(data, { error: 'Could not fetch users' })
  } finally {
    errorMock.mock.restore()
    queryMock.mock.restore()
  }
})
