import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import pool from './db.js'
import app from './app.js'

async function postStudyPlan(body) {
  const server = app.listen(0)

  try {
    const port = server.address().port

    const response = await fetch(
      `http://127.0.0.1:${port}/api/study-plans`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    )

    return {
      status: response.status,
      data: await response.json()
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close(err => err ? reject(err) : resolve())
    })
  }
}

const validPlan = {
  course_id: 1,
  topic_id: 2,
  created_by: 1,
  title: 'Study for Biology Exam',
  content: 'Review chapters 1 through 5.'
}

test('POST /api/study-plans rejects invalid data', async () => {
  const queryMock = mock.method(pool, 'query', async () => {
    throw new Error('Database should not be called')
  })

  try {
    const response = await postStudyPlan({
      course_id: -1,
      created_by: 1,
      title: '',
      content: ''
    })

    assert.equal(response.status, 400)
    assert.ok(Array.isArray(response.data.errors))
    assert.ok(response.data.errors.length > 0)
    assert.equal(queryMock.mock.callCount(), 0)
  } finally {
    queryMock.mock.restore()
  }
})

test('POST /api/study-plans creates a valid study plan', async () => {
  const createdPlan = {
    id: 1,
    ...validPlan,
    created_at: '2026-11-01T12:00:00.000Z',
    updated_at: '2026-11-01T12:00:00.000Z'
  }

  const queryMock = mock.method(pool, 'query', async () => ({
    rows: [createdPlan]
  }))

  try {
    const response = await postStudyPlan(validPlan)

    assert.equal(response.status, 201)
    assert.deepEqual(response.data, createdPlan)
    assert.equal(queryMock.mock.callCount(), 1)

    const [sql, values] = queryMock.mock.calls[0].arguments

    assert.match(sql, /INSERT INTO study_plans/)
    assert.deepEqual(values, [
      1,
      2,
      1,
      'Study for Biology Exam',
      'Review chapters 1 through 5.'
    ])
  } finally {
    queryMock.mock.restore()
  }
})

test('POST /api/study-plans handles invalid foreign keys', async () => {
  const queryMock = mock.method(pool, 'query', async () => {
    const error = new Error('Foreign key violation')
    error.code = '23503'
    throw error
  })

  try {
    const response = await postStudyPlan(validPlan)

    assert.equal(response.status, 400)
    assert.match(response.data.error, /does not exist/)
  } finally {
    queryMock.mock.restore()
  }
})
