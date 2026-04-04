import * as catc from '../../frontend/catc'
import { createSession } from '../../frontend/catc'
import { isRateLimited } from '../../frontend/catc'

// AI_TEST_AGENT_START function=createSession
describe('createSession', () => {
  beforeEach(() => {
    for (const key in catc.sessions) {
      delete catc.sessions[key]
    }
  })

  test('should create a session with valid token and userId', () => {
    const token = 'validToken123'
    const userId = 42
    const result = createSession(token, userId)
    expect(result).toBe(true)
    expect(catc.sessions[token]).toEqual({ userId })
  })

  test('should create a session with empty string token and zero userId', () => {
    const token = ''
    const userId = 0
    const result = createSession(token, userId)
    expect(result).toBe(true)
    expect(catc.sessions[token]).toEqual({ userId })
  })

  test('should create a session with token as string "null" and negative userId', () => {
    const token = 'null'
    const userId = -1
    const result = createSession(token, userId)
    expect(result).toBe(true)
    expect(catc.sessions[token]).toEqual({ userId })
  })
})
// AI_TEST_AGENT_END function=createSession

// AI_TEST_AGENT_START function=isRateLimited
describe('isRateLimited', () => {
  beforeEach(() => {
    for (const key in catc.rateLimit) {
      delete catc.rateLimit[key]
    }
  })

  test('returns false and increments count if under limit', () => {
    catc.rateLimit['user1'] = 1
    const result = isRateLimited('user1', 3)
    expect(result).toBe(false)
    expect(catc.rateLimit['user1']).toBe(2)
  })

  test('returns true if count equals limit', () => {
    catc.rateLimit['user2'] = 3
    const result = isRateLimited('user2', 3)
    expect(result).toBe(true)
    expect(catc.rateLimit['user2']).toBe(3)
  })

  test('handles empty userId and zero limit', () => {
    catc.rateLimit[''] = 0
    const result = isRateLimited('', 0)
    expect(result).toBe(true)
    expect(catc.rateLimit['']).toBe(0)
  })
})
// AI_TEST_AGENT_END function=isRateLimited
