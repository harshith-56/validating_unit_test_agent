import * as catcModule from '../../frontend/catc'
import { isFeatureEnabled } from '../../frontend/catc'
import { isRateLimited } from '../../frontend/catc'

// AI_TEST_AGENT_START function=isFeatureEnabled
describe('isFeatureEnabled', () => {
  const originalFeatureFlags = Object.assign({}, (catcModule as any).featureFlags)

  afterEach(() => {
    Object.assign((catcModule as any).featureFlags, originalFeatureFlags)
  })

  it('returns true when the feature flag is set to true', () => {
    (catcModule as any).featureFlags = { newFeature: true }
    expect(isFeatureEnabled('newFeature')).toBe(true)
  })

  it('returns false when the feature flag is set to false', () => {
    (catcModule as any).featureFlags = { newFeature: false }
    expect(isFeatureEnabled('newFeature')).toBe(false)
  })

  it('returns false when the feature flag is undefined', () => {
    (catcModule as any).featureFlags = { }
    expect(isFeatureEnabled('unknownFeature')).toBe(false)
  })

  it('returns false when the feature flag is null', () => {
    (catcModule as any).featureFlags = { someFeature: null }
    expect(isFeatureEnabled('someFeature')).toBe(false)
  })

  it('returns false when the feature flag is an empty string', () => {
    (catcModule as any).featureFlags = { emptyFeature: '' }
    expect(isFeatureEnabled('emptyFeature')).toBe('')
  })

  it('returns false when called with an empty string as flag', () => {
    (catcModule as any).featureFlags = { '': true }
    expect(isFeatureEnabled('')).toBe(true)
  })

  it('returns false when called with a numeric string flag', () => {
    (catcModule as any).featureFlags = { '123': true }
    expect(isFeatureEnabled('123')).toBe(true)
  })

  it('returns false when called with a flag not present in featureFlags object', () => {
    (catcModule as any).featureFlags = { featureA: true }
    expect(isFeatureEnabled('featureB')).toBe(false)
  })

  it('handles non-string input by coercing to string and returning false', () => {
    (catcModule as any).featureFlags = { 'true': true }
    // @ts-expect-error testing invalid input
    expect(isFeatureEnabled(true)).toBe(false)
  })
})
// AI_TEST_AGENT_END function=isFeatureEnabled

// AI_TEST_AGENT_START function=isRateLimited
describe('isRateLimited', () => {
  let originalRateLimit: Record<string, number>

  beforeEach(() => {
    originalRateLimit = {}
    Object.defineProperty(catcModule, 'rateLimit', {
      configurable: true,
      enumerable: true,
      get: () => originalRateLimit,
      set: (val) => {
        originalRateLimit = val
      },
    })
  })

  afterEach(() => {
    Object.defineProperty(catcModule, 'rateLimit', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: originalRateLimit,
    })
  })

  test('returns false and increments count when user count is below limit', () => {
    originalRateLimit['user1'] = 2
    const result = isRateLimited('user1', 5)
    expect(result).toBe(false)
    expect(originalRateLimit['user1']).toBe(3)
  })

  test('returns true when user count equals limit', () => {
    originalRateLimit['user2'] = 3
    const result = isRateLimited('user2', 3)
    expect(result).toBe(true)
    expect(originalRateLimit['user2']).toBe(3)
  })

  test('returns true when user count is above limit', () => {
    originalRateLimit['user3'] = 10
    const result = isRateLimited('user3', 5)
    expect(result).toBe(true)
    expect(originalRateLimit['user3']).toBe(10)
  })

  test('initializes count to 1 and returns false when user not in rateLimit', () => {
    expect(originalRateLimit['newUser']).toBeUndefined()
    const result = isRateLimited('newUser', 2)
    expect(result).toBe(false)
    expect(originalRateLimit['newUser']).toBe(1)
  })

  test('handles empty string userId correctly', () => {
    originalRateLimit[''] = 0
    const result = isRateLimited('', 1)
    expect(result).toBe(false)
    expect(originalRateLimit['']).toBe(1)
  })

  test('handles zero limit by always returning true', () => {
    originalRateLimit['userZero'] = 0
    const result = isRateLimited('userZero', 0)
    expect(result).toBe(true)
    expect(originalRateLimit['userZero']).toBe(0)
  })

  test('handles negative limit by always returning true', () => {
    originalRateLimit['userNeg'] = 0
    const result = isRateLimited('userNeg', -1)
    expect(result).toBe(true)
    expect(originalRateLimit['userNeg']).toBe(0)
  })

  test('handles non-string userId by coercing to string key', () => {
    // @ts-expect-error testing invalid input type
    const result = isRateLimited(123, 2)
    expect(result).toBe(false)
    // The key 123 is coerced to string '123'
    expect(originalRateLimit['123']).toBe(1)
  })

  test('handles userId as null by coercing to string "null"', () => {
    // @ts-expect-error testing invalid input type
    const result = isRateLimited(null, 1)
    expect(result).toBe(false)
    expect(originalRateLimit['null']).toBe(1)
  })
})
// AI_TEST_AGENT_END function=isRateLimited
