import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import express from 'express'
import { createResetRouter } from './routes/reset.js'

const post = async (resetDatabase) => {
  const app = express()
  app.use('/api/reset', createResetRouter(resetDatabase))
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/reset`,
      { method: 'POST' }
    )
    return { status: response.status, data: await response.json() }
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

test('POST /api/reset', async (t) => {
  const original = process.env.ALLOW_WEB_RESET
  t.after(() => {
    if (original === undefined) delete process.env.ALLOW_WEB_RESET
    else process.env.ALLOW_WEB_RESET = original
  })

  await t.test('403 and no reset when ALLOW_WEB_RESET is not true', async () => {
    delete process.env.ALLOW_WEB_RESET
    let called = false
    const { status } = await post(async () => { called = true })
    assert.equal(status, 403)
    assert.equal(called, false)
  })

  await t.test('200 and resets when enabled', async () => {
    process.env.ALLOW_WEB_RESET = 'true'
    let called = false
    const { status } = await post(async () => { called = true })
    assert.equal(status, 200)
    assert.equal(called, true)
  })

  await t.test('500 when the reset fails', async () => {
    process.env.ALLOW_WEB_RESET = 'true'
    const { status } = await post(async () => { throw new Error('boom') })
    assert.equal(status, 500)
  })
})
