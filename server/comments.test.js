import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import pool from './db.js'
import app from './app.js'

async function requestComments(method, studyPlanId, body) {
  const server = app.listen(0)

  try {
    const port = server.address().port

    const response = await fetch(
      `http://127.0.0.1:${port}/api/study-plans/${studyPlanId}/comments`,
      {
        method,
        ...(body !== undefined
          ? {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            }
          : {})
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

const validComment = {
  created_by: 1,
  content: 'This study plan is helpful!'
}

const savedComment = {
  id: 5,
  study_plan_id: 10,
  created_by: 1,
  content: validComment.content,
  created_at: '2026-11-11T12:00:00.000Z',
  creator_name: 'Morgan Lee'
}

test('GET comments returns comments oldest first', async () => {
  const comments = [
    savedComment,
    {
      ...savedComment,
      id: 6,
      content: 'Second comment',
      created_at: '2026-11-11T13:00:00.000Z'
    }
  ]

  const queryMock = mock.method(pool, 'query', async (sql) => {
    if (sql.includes('SELECT id FROM study_plans')) {
      return { rows: [{ id: 10 }] }
    }

    return { rows: comments }
  })

  try {
    const response = await requestComments('GET', 10)

    assert.equal(response.status, 200)
    assert.deepEqual(response.data, comments)
    assert.equal(queryMock.mock.callCount(), 2)

    const [sql, values] = queryMock.mock.calls[1].arguments
    assert.match(sql, /ORDER BY c\.created_at ASC, c\.id ASC/)
    assert.deepEqual(values, [10])
  } finally {
    queryMock.mock.restore()
  }
})

test('GET comments returns an empty list', async () => {
  const queryMock = mock.method(pool, 'query', async (sql) => ({
    rows: sql.includes('SELECT id FROM study_plans')
      ? [{ id: 10 }]
      : []
  }))

  try {
    const response = await requestComments('GET', 10)

    assert.equal(response.status, 200)
    assert.deepEqual(response.data, [])
  } finally {
    queryMock.mock.restore()
  }
})

test('POST comments creates a comment', async () => {
  const queryMock = mock.method(pool, 'query', async (sql) => ({
    rows: sql.includes('SELECT id FROM study_plans')
      ? [{ id: 10 }]
      : [savedComment]
  }))

  try {
    const response = await requestComments(
      'POST',
      10,
      validComment
    )

    assert.equal(response.status, 201)
    assert.deepEqual(response.data, savedComment)
    assert.equal(queryMock.mock.callCount(), 2)

    const [sql, values] = queryMock.mock.calls[1].arguments
    assert.match(sql, /INSERT INTO comments/)
    assert.deepEqual(values, [
      10,
      1,
      'This study plan is helpful!'
    ])
  } finally {
    queryMock.mock.restore()
  }
})

test('POST comments trims surrounding whitespace', async () => {
  const queryMock = mock.method(pool, 'query', async (sql) => ({
    rows: sql.includes('SELECT id FROM study_plans')
      ? [{ id: 10 }]
      : [savedComment]
  }))

  try {
    const response = await requestComments('POST', 10, {
      created_by: 1,
      content: '  This study plan is helpful!  '
    })

    assert.equal(response.status, 201)

    const [, values] = queryMock.mock.calls[1].arguments
    assert.equal(values[2], validComment.content)
  } finally {
    queryMock.mock.restore()
  }
})

for (const method of ['GET', 'POST']) {
  test(`${method} comments rejects invalid study plan IDs`, async () => {
    const queryMock = mock.method(pool, 'query', async () => {
      throw new Error('Database should not be called')
    })

    try {
      const response = await requestComments(
        method,
        'invalid',
        method === 'POST' ? validComment : undefined
      )

      assert.equal(response.status, 400)
      assert.equal(response.data.error, 'Invalid study plan ID')
      assert.equal(queryMock.mock.callCount(), 0)
    } finally {
      queryMock.mock.restore()
    }
  })

  test(`${method} comments returns 404 for missing study plans`, async () => {
    const queryMock = mock.method(pool, 'query', async () => ({
      rows: []
    }))

    try {
      const response = await requestComments(
        method,
        999,
        method === 'POST' ? validComment : undefined
      )

      assert.equal(response.status, 404)
      assert.equal(response.data.error, 'Study plan not found')
      assert.equal(queryMock.mock.callCount(), 1)
    } finally {
      queryMock.mock.restore()
    }
  })

  test(`${method} comments handles database failures`, async () => {
    const queryMock = mock.method(pool, 'query', async () => {
      throw new Error('Database unavailable')
    })
    const consoleMock = mock.method(console, 'error', () => {})

    try {
      const response = await requestComments(
        method,
        10,
        method === 'POST' ? validComment : undefined
      )

      assert.equal(response.status, 500)
      assert.equal(queryMock.mock.callCount(), 1)
    } finally {
      consoleMock.mock.restore()
      queryMock.mock.restore()
    }
  })
}

test('POST comments rejects invalid content', async () => {
  const queryMock = mock.method(pool, 'query', async () => {
    throw new Error('Database should not be called')
  })

  try {
    const response = await requestComments('POST', 10, {
      created_by: 1,
      content: '   '
    })

    assert.equal(response.status, 400)
    assert.ok(response.data.errors.includes(
      'Comment content is required'
    ))
    assert.equal(queryMock.mock.callCount(), 0)
  } finally {
    queryMock.mock.restore()
  }
})

test('POST comments rejects invalid creator IDs', async () => {
  const queryMock = mock.method(pool, 'query', async () => {
    throw new Error('Database should not be called')
  })

  try {
    const response = await requestComments('POST', 10, {
      created_by: -1,
      content: 'Valid content'
    })

    assert.equal(response.status, 400)
    assert.ok(response.data.errors.includes(
      'Creator ID must be a positive integer'
    ))
    assert.equal(queryMock.mock.callCount(), 0)
  } finally {
    queryMock.mock.restore()
  }
})

test('POST comments handles nonexistent creator IDs', async () => {
  const queryMock = mock.method(pool, 'query', async (sql) => {
    if (sql.includes('SELECT id FROM study_plans')) {
      return { rows: [{ id: 10 }] }
    }

    const error = new Error('Foreign key violation')
    error.code = '23503'
    throw error
  })

  try {
    const response = await requestComments(
      'POST',
      10,
      validComment
    )

    assert.equal(response.status, 400)
    assert.match(response.data.error, /does not exist/)
    assert.equal(queryMock.mock.callCount(), 2)
  } finally {
    queryMock.mock.restore()
  }
})
