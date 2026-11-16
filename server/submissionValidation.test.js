import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateSubmission,
  validateSubmissionUpdate
} from './submissionValidation.js'

test('validateSubmission accepts a user_id alone', () => {
  assert.equal(validateSubmission({ user_id: 3 }).valid, true)
})

test('validateSubmission accepts status and notes', () => {
  const result = validateSubmission({ user_id: 3, status: 'completed', notes: 'done' })
  assert.equal(result.valid, true)
})

test('validateSubmission rejects a missing or bad user_id', () => {
  assert.equal(validateSubmission({}).valid, false)
  assert.equal(validateSubmission({ user_id: 0 }).valid, false)
  assert.equal(validateSubmission({ user_id: '3' }).valid, false)
  assert.equal(validateSubmission(undefined).valid, false)
})

test('validateSubmission rejects a bad status and non-string notes', () => {
  assert.equal(validateSubmission({ user_id: 3, status: 'done' }).valid, false)
  assert.equal(validateSubmission({ user_id: 3, notes: 5 }).valid, false)
})

test('validateSubmissionUpdate needs status or notes', () => {
  assert.equal(validateSubmissionUpdate({}).valid, false)
  assert.equal(validateSubmissionUpdate({ status: 'completed' }).valid, true)
  assert.equal(validateSubmissionUpdate({ notes: null }).valid, true)
})

test('validateSubmissionUpdate rejects a bad status', () => {
  assert.equal(validateSubmissionUpdate({ status: 'late' }).valid, false)
})
