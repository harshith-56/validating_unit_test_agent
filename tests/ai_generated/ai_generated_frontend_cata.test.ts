import { calculateFinalPrice } from '../../frontend/cata'
import { normalizeUserPayload } from '../../frontend/cata'
import { passwordStrength } from '../../frontend/cata'

// AI_TEST_AGENT_START function=calculateFinalPrice
describe('calculateFinalPrice', () => {
  it('calculates final price correctly with valid inputs', () => {
    const result = calculateFinalPrice(100, 0.1, 0.2)
    expect(result).toBe(88)
  })

  it('returns price unchanged when taxRate and discount are zero', () => {
    const result = calculateFinalPrice(50, 0, 0)
    expect(result).toBe(50)
  })

  it('returns price with only tax applied when discount is zero', () => {
    const result = calculateFinalPrice(200, 0.15, 0)
    expect(result).toBe(230)
  })

  it('returns price with only discount applied when taxRate is zero', () => {
    const result = calculateFinalPrice(80, 0, 0.25)
    expect(result).toBe(60)
  })

  it('rounds the final price to two decimal places correctly', () => {
    const result = calculateFinalPrice(99.99, 0.075, 0.1)
    expect(result).toBe(96.74)
  })

  it('throws error when price is negative', () => {
    expect(() => calculateFinalPrice(-1, 0.1, 0.1)).toThrow(Error)
    expect(() => calculateFinalPrice(-1, 0.1, 0.1)).toThrow('Invalid price')
  })

  it('throws error when taxRate is less than 0', () => {
    expect(() => calculateFinalPrice(10, -0.01, 0.1)).toThrow(Error)
    expect(() => calculateFinalPrice(10, -0.01, 0.1)).toThrow('Invalid tax rate')
  })

  it('throws error when taxRate is greater than 1', () => {
    expect(() => calculateFinalPrice(10, 1.01, 0.1)).toThrow(Error)
    expect(() => calculateFinalPrice(10, 1.01, 0.1)).toThrow('Invalid tax rate')
  })

  it('throws error when discount is less than 0', () => {
    expect(() => calculateFinalPrice(10, 0.1, -0.01)).toThrow(Error)
    expect(() => calculateFinalPrice(10, 0.1, -0.01)).toThrow('Invalid discount')
  })

  it('throws error when discount is greater than 1', () => {
    expect(() => calculateFinalPrice(10, 0.1, 1.01)).toThrow(Error)
    expect(() => calculateFinalPrice(10, 0.1, 1.01)).toThrow('Invalid discount')
  })
})
// AI_TEST_AGENT_END function=calculateFinalPrice

// AI_TEST_AGENT_START function=passwordStrength
describe('passwordStrength', () => {
  test('returns "weak" for password shorter than 8 characters', () => {
    expect(passwordStrength('Ab1!x')).toBe('weak')
  })

  test('returns "medium" for password with length >= 8 and 2 or fewer character classes', () => {
    expect(passwordStrength('abcdefgh')).toBe('medium')
    expect(passwordStrength('ABCDEFGH')).toBe('medium')
    expect(passwordStrength('abcd1234')).toBe('medium')
  })

  test('returns "strong" for password with length >= 8 and more than 2 character classes', () => {
    expect(passwordStrength('Abcd1234!')).toBe('strong')
  })
})
// AI_TEST_AGENT_END function=passwordStrength

// AI_TEST_AGENT_START function=normalizeUserPayload
describe('normalizeUserPayload', () => {
  test('should normalize valid payload correctly', () => {
    const payload = {
      id: '123',
      name: { trim: () => 'john doe' },
      email: { toLowerCase: () => 'JOHN@EXAMPLE.COM' },
      isActive: false,
    }
    const result = normalizeUserPayload(payload)
    expect(result).toEqual({
      id: 123,
      name: 'John Doe',
      email: 'john@example.com',
      isActive: false,
    })
  })

  test('should default isActive to true if undefined', () => {
    const payload = {
      id: '1',
      name: { trim: () => 'alice' },
      email: { toLowerCase: () => 'ALICE@EMAIL.COM' },
    }
    const result = normalizeUserPayload(payload)
    expect(result.isActive).toBe(true)
  })

  test('should handle empty name and email with mocked methods', () => {
    const payload = {
      id: '0',
      name: { trim: () => '' },
      email: { toLowerCase: () => '' },
      isActive: true,
    }
    const result = normalizeUserPayload(payload)
    expect(result).toEqual({
      id: 0,
      name: '',
      email: '',
      isActive: true,
    })
  })
})
// AI_TEST_AGENT_END function=normalizeUserPayload
