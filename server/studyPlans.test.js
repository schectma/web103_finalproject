
import test from 'node:test'
import assert from 'node:assert/strict'
import app from './app.js'

test('POST /api/study-plans rejects invalid data', async () => {
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
        body: JSON.stringify({
          course_id: -1,
          created_by: 1,
          title: '',
          content: ''
        })
      }
    )

    assert.equal(response.status, 400)

    const data = await response.json()
    assert.ok(Array.isArray(data.errors))
    assert.ok(data.errors.length > 0)
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => err ? reject(err) : resolve())
    })
  }
})


test('POST /api/study-plans returns 501 until database creation is implemented', async () => {
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
          body: JSON.stringify({
            course_id: 1,
            topic_id: 2,
            created_by: 1,
            title: 'Study for Biology Exam',
            content: 'Review chapters 1 through 5.'
          })
        }
      )
  
      assert.equal(response.status, 501)
  
      const data = await response.json()
      assert.equal(
        data.error,
        'Study plan creation is not yet implemented'
      )
    } finally {
      await new Promise((resolve, reject) => {
        server.close((err) => err ? reject(err) : resolve())
      })
    }
  })
  