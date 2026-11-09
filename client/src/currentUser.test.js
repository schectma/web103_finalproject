import { afterEach, describe, expect, it, vi } from 'vitest'

async function load(value) {
  vi.resetModules()
  if (value === undefined) vi.unstubAllEnvs()
  else vi.stubEnv('VITE_CURRENT_USER_ID', value)
  return import('./currentUser.js')
}

describe('CURRENT_USER_ID', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('falls back to 1 when unset', async () => {
    expect((await load(undefined)).CURRENT_USER_ID).toBe(1)
  })

  it('falls back to 1 when empty', async () => {
    expect((await load('')).CURRENT_USER_ID).toBe(1)
  })

  it('uses a valid override', async () => {
    expect((await load('7')).CURRENT_USER_ID).toBe(7)
  })

  it.each(['abc', '0', '-3', '1.5'])('throws on invalid value %s', async (v) => {
    await expect(load(v)).rejects.toThrow(/Invalid VITE_CURRENT_USER_ID/)
  })
})
