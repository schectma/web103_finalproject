import { afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import pool from '../db/pool.js'

afterAll(() => pool.end())

describe('GET /api/health', () => {
  it('reports the app and database are up', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', db: 'ok' })
  })
})
