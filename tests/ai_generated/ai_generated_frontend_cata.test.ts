import { calculateFinalPrice } from '../../frontend/cata'
import { normalizeUserPayload } from '../../frontend/cata'
import { passwordStrength } from '../../frontend/cata'

// AI_TEST_AGENT_START function=calculateFinalPrice
describe('calculateFinalPrice', () => {
  it('calculates correct final price with valid inputs', () => {
    const result = calculateFinalPrice(100, 0.2, 0.1)
    expect(result).toBe(108)
  })

  it('throws error for negative price', () => {
    const call = () => calculateFinalPrice(-1, 0.1, 0.1)
    expect(call).toThrow(Error)
    expect(call).toThrow('Invalid price')
  })

  it('throws error for taxRate less than 0', () => {
    const call = () => calculateFinalPrice(100, -0.01, 0.1)
    expect(call).toThrow(Error)
    expect(call).toThrow('Invalid tax rate')
  })

  it('throws error for taxRate greater than 1', () => {
    const call = () => calculateFinalPrice(100, 1.01, 0.1)
    expect(call).toThrow(Error)
    expect(call).toThrow('Invalid tax rate')
  })

  it('throws error for discount less than 0', () => {
    const call = () => calculateFinalPrice(100, 0.1, -0.01)
    expect(call).toThrow(Error)
    expect(call).toThrow('Invalid discount')
  })

  it('throws error for discount greater than 1', () => {
    const call = () => calculateFinalPrice(100, 0.1, 1.01)
    expect(call).toThrow(Error)
    expect(call).toThrow('Invalid discount')
  })

  it('calculates final price correctly when discount is 0', () => {
    const result = calculateFinalPrice(50, 0.1, 0)
    expect(result).toBe(55)
  })

  it('calculates final price correctly when taxRate is 0', () => {
    const result = calculateFinalPrice(50, 0, 0.1)
    expect(result).toBe(45)
  })

  it('calculates final price correctly with zero price', () => {
    const result = calculateFinalPrice(0, 0.1, 0.1)
    expect(result).toBe(0)
  })
})
// AI_TEST_AGENT_END function=calculateFinalPrice

// AI_TEST_AGENT_START function=passwordStrength
describe('passwordStrength', () => {
  test('returns "weak" for password shorter than 8 characters', () => {
    expect(passwordStrength('Ab1!x')).toBe('weak')
  })

  test('returns "medium" for password with length >= 8 and exactly two character classes', () => {
    expect(passwordStrength('abcdefgh')).toBe('medium')
    expect(passwordStrength('ABCDEFGH')).toBe('medium')
    expect(passwordStrength('abcdEFGH')).toBe('medium')
    expect(passwordStrength('abcd1234')).toBe('medium')
    expect(passwordStrength('ABCD1234')).toBe('medium')
    expect(passwordStrength('abcd!@#$')).toBe('medium')
  })

  test('returns "strong" for password with length >= 8 and more than two character classes', () => {
    expect(passwordStrength('Abcdef1!')).toBe('strong')
    expect(passwordStrength('A1!bcdef')).toBe('strong')
    expect(passwordStrength('1234Abcd!')).toBe('strong')
  })

  test('returns "medium" for password with length exactly 8 and two character classes', () => {
    expect(passwordStrength('abcd1234')).toBe('medium')
  })

  test('returns "weak" for empty string', () => {
    expect(passwordStrength('')).toBe('weak')
  })

  test('returns "weak" for password with length 7 and all character classes', () => {
    expect(passwordStrength('A1!bcde')).toBe('weak')
  })

  test('handles password with no uppercase letters', () => {
    expect(passwordStrength('abcdefg1!')).toBe('strong')
  })

  test('handles password with no lowercase letters', () => {
    expect(passwordStrength('ABCDEFG1!')).toBe('strong')
  })

  test('handles password with no digits', () => {
    expect(passwordStrength('Abcdefg!')).toBe('medium')
  })
})
// AI_TEST_AGENT_END function=passwordStrength

// AI_TEST_AGENT_START function=normalizeUserPayload
describe('normalizeUserPayload', () => {
  it('should normalize a valid payload with all fields present', () => {
    const payload = {
      id: '123',
      name: ' john doe ',
      email: 'JOHN@EXAMPLE.COM',
      isActive: false,
    }
    const result = normalizeUserPayload(payload)
    expect(result.id).toBe(123)
    expect(result.name).toBe('John Doe')
    expect(result.email).toBe('john@example.com')
    expect(result.isActive).toBe(false)
  })

  it('should default isActive to true if missing', () => {
    const payload = {
      id: '1',
      name: ' alice ',
      email: 'ALICE@EXAMPLE.COM',
    }
    const result = normalizeUserPayload(payload)
    expect(result.id).toBe(1)
    expect(result.name).toBe('Alice')
    expect(result.email).toBe('alice@example.com')
    expect(result.isActive).toBe(true)
  })

  it('should handle id as a number and convert correctly', () => {
    const payload = {
      id: 42,
      name: ' bob ',
      email: 'BOB@EXAMPLE.COM',
      isActive: true,
    }
    const result = normalizeUserPayload(payload)
    expect(result.id).toBe(42)
    expect(result.name).toBe('Bob')
    expect(result.email).toBe('bob@example.com')
    expect(result.isActive).toBe(true)
  })

  it('should throw when id cannot be converted to number', () => {
    const payload = {
      id: 'abc',
      name: ' charlie ',
      email: 'CHARLIE@EXAMPLE.COM',
      isActive: true,
    }
    const call = () => normalizeUserPayload(payload)
    expect(call).toThrow()
  })

  it('should throw if name is not a string and trim is called', () => {
    const payload = {
      id: '5',
      name: null,
      email: 'test@example.com',
      isActive: true,
    }
    const call = () => normalizeUserPayload(payload)
    expect(call).toThrow()
  })

  it('should throw if email is not a string and toLowerCase is called', () => {
    const payload = {
      id: '6',
      name: 'dave',
      email: null,
      isActive: true,
    }
    const call = () => normalizeUserPayload(payload)
    expect(call).toThrow()
  })

  it('should handle empty string name and email', () => {
    const payload = {
      id: '7',
      name: ' ',
      email: '',
      isActive: false,
    }
    const result = normalizeUserPayload(payload)
    expect(result.id).toBe(7)
    expect(result.name).toBe('')
    expect(result.email).toBe('')
    expect(result.isActive).toBe(false)
  })

  it('should handle isActive explicitly set to null and default to true', () => {
    const payload = {
      id: '8',
      name: 'eve',
      email: 'EVE@EXAMPLE.COM',
      isActive: null,
    }
    const result = normalizeUserPayload(payload)
    expect(result.id).toBe(8)
    expect(result.name).toBe('Eve')
    expect(result.email).toBe('eve@example.com')
    expect(result.isActive).toBe(true)
  })
})
// AI_TEST_AGENT_END function=normalizeUserPayload
