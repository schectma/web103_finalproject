import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// CLIENT_DIST must be set before app.js is imported
const dist = mkdtempSync(join(tmpdir(), 'studysync-dist-'))
after(() => rmSync(dist, { recursive: true, force: true }))
writeFileSync(join(dist, 'index.html'), '<div id="root">spa</div>')
process.env.CLIENT_DIST = dist
const { default: app } = await import('./app.js')

test('serves the client and falls back to index.html, but not for /api', async (t) => {
  const server = app.listen(0)
  await once(server, 'listening')
  t.after(() => server.close())
  const base = `http://localhost:${server.address().port}`

  const home = await fetch(base + '/')
  assert.equal(home.status, 200)
  assert.match(await home.text(), /spa/)

  const deep = await fetch(base + '/courses/1')
  assert.equal(deep.status, 200)
  assert.match(await deep.text(), /spa/)

  const api = await fetch(base + '/api/does-not-exist')
  assert.equal(api.status, 404)
  assert.doesNotMatch(await api.text(), /spa/)
})
