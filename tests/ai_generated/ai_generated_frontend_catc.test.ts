import * as catc from '../../frontend/catc'
import { createSession, sessions } from '../../frontend/catc'
import { isFeatureEnabled } from '../../frontend/catc'
import { isRateLimited } from '../../frontend/catc'

// AI_TEST_AGENT_START function=createSession
describe('createSession', () => {
  beforeEach(() => {
    for (const key in sessions) {
      delete sessions[key]
    }
  })

  test('should create a session with valid token and userId', () => {
    const result = createSession('token123', 42)
    expect(result).toBe(true)
    expect(sessions['token123']).toEqual({ userId: 42 })
  })

  test('should create a session with empty token string', () => {
    const result = createSession('', 1)
    expect(result).toBe(true)
    expect(sessions['']).toEqual({ userId: 1 })
  })

  test('should create a session with userId zero', () => {
    const result = createSession('tokenZero', 0)
    expect(result).toBe(true)
    expect(sessions['tokenZero']).toEqual({ userId: 0 })
  })
})
// AI_TEST_AGENT_END function=createSession

// AI_TEST_AGENT_START function=isFeatureEnabled
describe('isFeatureEnabled', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('returns true when the feature flag is enabled', () => {
    jest.spyOn(catc, 'featureFlags', 'get').mockReturnValue({ newUI: true })
    expect(isFeatureEnabled('newUI')).toBe(true)
  })

  it('returns false when the feature flag is disabled', () => {
    jest.spyOn(catc, 'featureFlags', 'get').mockReturnValue({ newUI: false })
    expect(isFeatureEnabled('newUI')).toBe(false)
  })

  it('returns false when the feature flag does not exist', () => {
    jest.spyOn(catc, 'featureFlags', 'get').mockReturnValue({})
    expect(isFeatureEnabled('nonExistentFlag')).toBe(false)
  })
})
// AI_TEST_AGENT_END function=isFeatureEnabled

// AI_TEST_AGENT_START function=isRateLimited
describe('isRateLimited', () => {
  beforeEach(() => {
    for (const key in catc.rateLimit) {
      delete catc.rateLimit[key]
    }
  })

  test('returns false and increments count when under limit', () => {
    catc.rateLimit['user1'] = 1
    const result = isRateLimited('user1', 3)
    expect(result).toBe(false)
    expect(catc.rateLimit['user1']).toBe(2)
  })

  test('returns true when count equals limit', () => {
    catc.rateLimit['user2'] = 5
    const result = isRateLimited('user2', 5)
    expect(result).toBe(true)
    expect(catc.rateLimit['user2']).toBe(5)
  })

  test('handles missing userId by initializing count and returning false', () => {
    const result = isRateLimited('newUser', 2)
    expect(result).toBe(false)
    expect(catc.rateLimit['newUser']).toBe(1)
  })
})
// AI_TEST_AGENT_END function=isRateLimited
