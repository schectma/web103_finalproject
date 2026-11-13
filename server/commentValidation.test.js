import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateComment } from './commentValidation.js'

describe('validateComment', () => {
  const validComment = {
    created_by: 1,
    content: 'This study plan is helpful!'
  }

  it('accepts a valid comment', () => {
    assert.deepEqual(validateComment(validComment), {
      valid: true,
      errors: []
    })
  })

  it('rejects a missing creator ID', () => {
    const result = validateComment({
      content: 'Great explanation!'
    })

    assert.equal(result.valid, false)
    assert.ok(result.errors.includes(
      'Creator ID must be a positive integer'
    ))
  })

  it('rejects invalid creator IDs', () => {
    for (const created_by of [0, -1, 1.5, '1', null]) {
      const result = validateComment({
        ...validComment,
        created_by
      })

      assert.equal(result.valid, false)
    }
  })

  it('rejects missing comment content', () => {
    const result = validateComment({
      created_by: 1
    })

    assert.equal(result.valid, false)
    assert.ok(result.errors.includes(
      'Comment content is required'
    ))
  })

  it('rejects empty and whitespace-only comments', () => {
    for (const content of ['', '   ', '\n\t']) {
      const result = validateComment({
        ...validComment,
        content
      })

      assert.equal(result.valid, false)
    }
  })

  it('rejects non-string content', () => {
    for (const content of [null, 123, {}, []]) {
      const result = validateComment({
        ...validComment,
        content
      })

      assert.equal(result.valid, false)
    }
  })

  it('accepts content with surrounding whitespace', () => {
    const result = validateComment({
      ...validComment,
      content: '  Helpful comment  '
    })

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  })

  it('rejects a missing request body', () => {
    assert.equal(validateComment(undefined).valid, false)
  })
})
