import { describe, expect, test } from 'vitest'
import { getGreeting } from './getGreeting.js'

describe('getGreeting', () => {
  test.each([
    [0, 'Good morning!'],
    [9, 'Good morning!'],
    [11, 'Good morning!'],
    [12, 'Good afternoon!'],
    [15, 'Good afternoon!'],
    [17, 'Good afternoon!'],
    [18, 'Good evening!'],
    [21, 'Good evening!'],
    [23, 'Good evening!']
  ])('returns the correct greeting at hour %i', (hour, expected) => {
    const date = new Date(2026, 10, 17, hour, 0, 0)
    expect(getGreeting(date)).toBe(expected)
  })
})
