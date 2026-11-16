import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import app from './app.js'
import pool from './db.js'

const send = (base, method, path, body) =>
  fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })

// Routes run against a mocked pool so no database is touched.
// `handler` receives (sql, params) and returns a pg-like result.
const withApp = async (t, handler) => {
  const queryMock = mock.method(pool, 'query', async (sql, params) => handler(sql, params))
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => {
    server.close()
    queryMock.mock.restore()
  })
  return { base: `http://127.0.0.1:${server.address().port}`, queryMock }
}

test('GET /api/assignments/:id/submissions', async (t) => {
  const rows = [{ assignment_id: 1, user_id: 3, status: 'completed', student_name: 'Sam Patel' }]
  const { base } = await withApp(t, (sql) =>
    /FROM assignments/.test(sql) ? { rowCount: 1, rows: [{}] } : { rowCount: 1, rows })

  await t.test('returns the submissions', async () => {
    const res = await send(base, 'GET', '/api/assignments/1/submissions')
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), rows)
  })

  await t.test('400 for a bad assignment id', async () => {
    const res = await send(base, 'GET', '/api/assignments/abc/submissions')
    assert.equal(res.status, 400)
  })
})

test('GET returns 404 for an unknown assignment', async (t) => {
  const { base } = await withApp(t, () => ({ rowCount: 0, rows: [] }))
  const res = await send(base, 'GET', '/api/assignments/99/submissions')
  assert.equal(res.status, 404)
})

test('POST /api/assignments/:id/submissions', async (t) => {
  let role = 'student'
  let insertError = null
  const { base, queryMock } = await withApp(t, (sql) => {
    if (/FROM assignments/.test(sql)) return { rowCount: 1, rows: [{}] }
    if (/FROM users/.test(sql)) return { rowCount: 1, rows: [{ role }] }
    if (insertError) throw insertError
    return { rowCount: 1, rows: [{ assignment_id: 1, user_id: 3, status: 'in_progress' }] }
  })

  await t.test('400 and no query for an invalid body', async () => {
    queryMock.mock.resetCalls()
    const res = await send(base, 'POST', '/api/assignments/1/submissions', { status: 'nope' })
    assert.equal(res.status, 400)
    assert.equal(queryMock.mock.callCount(), 0)
  })

  await t.test('400 when the user is not a student', async () => {
    role = 'ta'
    const res = await send(base, 'POST', '/api/assignments/1/submissions', { user_id: 1 })
    assert.equal(res.status, 400)
    role = 'student'
  })

  await t.test('201 on success', async () => {
    const res = await send(base, 'POST', '/api/assignments/1/submissions', { user_id: 3 })
    assert.equal(res.status, 201)
    assert.equal((await res.json()).user_id, 3)
  })

  await t.test('409 for a duplicate submission', async () => {
    insertError = Object.assign(new Error('dup'), { code: '23505' })
    const res = await send(base, 'POST', '/api/assignments/1/submissions', { user_id: 3 })
    assert.equal(res.status, 409)
  })
})

test('PATCH /api/assignments/:id/submissions/:userId', async (t) => {
  let found = true
  const { base } = await withApp(t, () =>
    found
      ? { rowCount: 1, rows: [{ assignment_id: 1, user_id: 3, status: 'completed' }] }
      : { rowCount: 0, rows: [] })

  await t.test('400 for an empty body', async () => {
    const res = await send(base, 'PATCH', '/api/assignments/1/submissions/3', {})
    assert.equal(res.status, 400)
  })

  await t.test('400 for an invalid status', async () => {
    const res = await send(base, 'PATCH', '/api/assignments/1/submissions/3', { status: 'late' })
    assert.equal(res.status, 400)
  })

  await t.test('200 on success', async () => {
    const res = await send(base, 'PATCH', '/api/assignments/1/submissions/3', { status: 'completed' })
    assert.equal(res.status, 200)
    assert.equal((await res.json()).status, 'completed')
  })

  await t.test('404 when the submission does not exist', async () => {
    found = false
    const res = await send(base, 'PATCH', '/api/assignments/1/submissions/3', { status: 'completed' })
    assert.equal(res.status, 404)
  })
})

test('DELETE /api/assignments/:id/submissions/:userId', async (t) => {
  let found = true
  const { base } = await withApp(t, () => ({ rowCount: found ? 1 : 0, rows: [] }))

  await t.test('204 on success', async () => {
    const res = await send(base, 'DELETE', '/api/assignments/1/submissions/3')
    assert.equal(res.status, 204)
  })

  await t.test('404 when missing', async () => {
    found = false
    const res = await send(base, 'DELETE', '/api/assignments/1/submissions/3')
    assert.equal(res.status, 404)
  })

  await t.test('400 for a bad id', async () => {
    const res = await send(base, 'DELETE', '/api/assignments/1/submissions/x')
    assert.equal(res.status, 400)
  })
})
