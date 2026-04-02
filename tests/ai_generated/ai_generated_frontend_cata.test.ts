import { calculateFinalPrice } from '../../frontend/cata'
import { normalizeUserPayload } from '../../frontend/cata'
import { passwordStrength } from '../../frontend/cata'

// AI_TEST_AGENT_START function=calculateFinalPrice
describe('calculateFinalPrice', () => {
  it('calculates final price correctly with valid inputs', () => {
    const result = calculateFinalPrice(100, 0.2, 0.1)
    expect(result).toBe(108)
  })

  it('throws error if price is negative', () => {
    const call = () => calculateFinalPrice(-1, 0.1, 0.1)
    expect(call).toThrow('Invalid price')
  })

  it('throws error if taxRate is less than 0', () => {
    const call = () => calculateFinalPrice(100, -0.01, 0.1)
    expect(call).toThrow('Invalid tax rate')
  })

  it('throws error if taxRate is greater than 1', () => {
    const call = () => calculateFinalPrice(100, 1.01, 0.1)
    expect(call).toThrow('Invalid tax rate')
  })

  it('throws error if discount is less than 0', () => {
    const call = () => calculateFinalPrice(100, 0.1, -0.01)
    expect(call).toThrow('Invalid discount')
  })

  it('throws error if discount is greater than 1', () => {
    const call = () => calculateFinalPrice(100, 0.1, 1.01)
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
    expect(passwordStrength('')).toBe('weak')
    expect(passwordStrength('1234567')).toBe('weak')
  })

  test('returns "medium" for password with length >= 8 and score 0 (no character classes)', () => {
    expect(passwordStrength('abcdefgh')).toBe('medium')
  })

  test('returns "medium" for password with length >= 8 and score exactly 2', () => {
    expect(passwordStrength('abcdefgh1')).toBe('medium') // lowercase + digit
    expect(passwordStrength('ABCDEFGH1')).toBe('medium') // uppercase + digit
    expect(passwordStrength('abcdefgh!')).toBe('medium') // lowercase + special
    expect(passwordStrength('ABCDEFGH!')).toBe('medium') // uppercase + special
  })

  test('returns "strong" for password with length >= 8 and score greater than 2', () => {
    expect(passwordStrength('Abcdefg1!')).toBe('strong') // uppercase, lowercase, digit, special
    expect(passwordStrength('A1b2c3d4!')).toBe('strong')
  })

  test('returns "medium" for password with length >= 8 and score 1', () => {
    expect(passwordStrength('ABCDEFGH')).toBe('medium') // uppercase only
    expect(passwordStrength('abcdefgh')).toBe('medium') // lowercase only
    expect(passwordStrength('12345678')).toBe('medium') // digits only
    expect(passwordStrength('!!!!!!!!')).toBe('medium') // special only
  })

  test('handles password with exactly 8 characters at boundary', () => {
    expect(passwordStrength('Abcdef1!')).toBe('strong')
    expect(passwordStrength('Abcdefg')).toBe('weak')
  })

  test('handles password with non-string input by throwing TypeError', () => {
    // @ts-expect-error testing invalid input
    expect(() => passwordStrength(null)).toThrow(TypeError)
    // @ts-expect-error testing invalid input
    expect(() => passwordStrength(undefined)).toThrow(TypeError)
    // @ts-expect-error testing invalid input
    expect(() => passwordStrength(12345678)).toThrow(TypeError)
  })
})
// AI_TEST_AGENT_END function=passwordStrength

// AI_TEST_AGENT_START function=normalizeUserPayload
describe('normalizeUserPayload', () => {
  it('should normalize a valid payload with all fields provided', () => {
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

  it('should handle id as a number string with leading zeros', () => {
    const payload = {
      id: '00042',
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

  it('should throw when id is not convertible to number', () => {
    const payload = {
      id: 'abc',
      name: ' charlie ',
      email: 'CHARLIE@EXAMPLE.COM',
      isActive: true,
    }
    expect(() => normalizeUserPayload(payload)).toThrow()
  })

  it('should throw when name is not a string and trim is called', () => {
    const payload = {
      id: '5',
      name: null,
      email: 'test@example.com',
      isActive: true,
    }
    expect(() => normalizeUserPayload(payload)).toThrow()
  })

  it('should throw when email is not a string and toLowerCase is called', () => {
    const payload = {
      id: '6',
      name: 'dave',
      email: null,
      isActive: true,
    }
    expect(() => normalizeUserPayload(payload)).toThrow()
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

  it('should handle isActive explicitly set to null', () => {
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
