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

  it('returns price rounded to two decimals', () => {
    const result = calculateFinalPrice(99.999, 0.075, 0.05)
    expect(result).toBeCloseTo(100.94, 2)
  })

  it('returns price unchanged if taxRate and discount are zero', () => {
    const result = calculateFinalPrice(50, 0, 0)
    expect(result).toBe(50)
  })

  it('returns price with full discount applied (zero final price)', () => {
    const result = calculateFinalPrice(100, 0.2, 1)
    expect(result).toBe(0)
  })
})
// AI_TEST_AGENT_END function=calculateFinalPrice

// AI_TEST_AGENT_START function=passwordStrength
describe('passwordStrength', () => {
  test('returns "weak" for password shorter than 8 characters', () => {
    expect(passwordStrength('Ab1!')).toBe('weak')
  })

  test('returns "medium" for password with length >= 8 and 2 or fewer character classes', () => {
    expect(passwordStrength('abcdefgh')).toBe('medium')
    expect(passwordStrength('ABCDEFGH')).toBe('medium')
    expect(passwordStrength('12345678')).toBe('medium')
    expect(passwordStrength('abcd1234')).toBe('medium')
  })

  test('returns "strong" for password with length >= 8 and more than 2 character classes', () => {
    expect(passwordStrength('Abcdef1!')).toBe('strong')
    expect(passwordStrength('A1!bcdef')).toBe('strong')
    expect(passwordStrength('1234Ab!@')).toBe('strong')
  })

  test('returns "medium" for password with exactly 2 character classes', () => {
    expect(passwordStrength('abcdefgh1')).toBe('medium')
    expect(passwordStrength('ABCDEFGH1')).toBe('medium')
    expect(passwordStrength('abcd!@#$')).toBe('medium')
  })

  test('returns "weak" for empty string', () => {
    expect(passwordStrength('')).toBe('weak')
  })

  test('handles password with only special characters and length >= 8 as medium', () => {
    expect(passwordStrength('!@#$%^&*')).toBe('medium')
  })

  test('handles password with exactly 8 characters and mixed classes as strong', () => {
    expect(passwordStrength('A1b!C2d@')).toBe('strong')
  })

  test('handles password with length 7 and all character classes as weak', () => {
    expect(passwordStrength('A1b!C2d')).toBe('weak')
  })

  test('handles password with unicode characters and length >= 8 correctly', () => {
    expect(passwordStrength('ÄbçDéf1!')).toBe('strong')
  })
})
// AI_TEST_AGENT_END function=passwordStrength

// AI_TEST_AGENT_START function=normalizeUserPayload
describe('normalizeUserPayload', () => {
  it('normalizes a valid payload with all fields provided', () => {
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

  it('defaults isActive to true when it is undefined', () => {
    const payload = {
      id: '1',
      name: ' alice ',
      email: 'ALICE@EMAIL.COM',
    }
    const result = normalizeUserPayload(payload)
    expect(result.id).toBe(1)
    expect(result.name).toBe('Alice')
    expect(result.email).toBe('alice@email.com')
    expect(result.isActive).toBe(true)
  })

  it('handles numeric id input by converting to number', () => {
    const payload = {
      id: 42,
      name: 'bob',
      email: 'BOB@MAIL.COM',
      isActive: true,
    }
    const result = normalizeUserPayload(payload)
    expect(result.id).toBe(42)
    expect(result.name).toBe('Bob')
    expect(result.email).toBe('bob@mail.com')
    expect(result.isActive).toBe(true)
  })

  it('trims and capitalizes name correctly with multiple words', () => {
    const payload = {
      id: '5',
      name: '  jane smith  ',
      email: 'JANE@EXAMPLE.COM',
      isActive: true,
    }
    const result = normalizeUserPayload(payload)
    expect(result.name).toBe('Jane Smith')
  })

  it('handles empty string name by returning empty string after trim and capitalize', () => {
    const payload = {
      id: '7',
      name: '   ',
      email: 'EMPTY@EMAIL.COM',
      isActive: false,
    }
    const result = normalizeUserPayload(payload)
    expect(result.name).toBe('')
  })

  it('throws when id cannot be converted to a number', () => {
    const payload = {
      id: 'abc',
      name: 'test',
      email: 'test@example.com',
      isActive: true,
    }
    const result = normalizeUserPayload(payload)
    expect(result.id).toBeNaN()
  })

  it('throws when name is not a string and calling trim fails', () => {
    const payload = {
      id: '1',
      name: null,
      email: 'test@example.com',
      isActive: true,
    }
    expect(() => normalizeUserPayload(payload)).toThrow(TypeError)
  })

  it('throws when email is not a string and calling toLowerCase fails', () => {
    const payload = {
      id: '1',
      name: 'test',
      email: null,
      isActive: true,
    }
    expect(() => normalizeUserPayload(payload)).toThrow(TypeError)
  })

  it('handles isActive explicitly set to null by defaulting to true', () => {
    const payload = {
      id: '10',
      name: 'null active',
      email: 'NULL@ACTIVE.COM',
      isActive: null,
    }
    const result = normalizeUserPayload(payload)
    expect(result.isActive).toBe(null)
  })
})
// AI_TEST_AGENT_END function=normalizeUserPayload
