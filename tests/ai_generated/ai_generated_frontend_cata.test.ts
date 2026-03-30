import calculateFinalPrice from '../../frontend/cata'
import normalizeUserPayload from '../../frontend/cata'
import passwordStrength from '../../frontend/cata'

// AI_TEST_AGENT_START function=calculateFinalPrice
describe('calculateFinalPrice', () => {
  it('calculates final price correctly with valid inputs', () => {
    const result = calculateFinalPrice(100, 0.2, 0.1)
    expect(result).toBe(108)
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

  it('throws error when price is negative', () => {
    expect(() => calculateFinalPrice(-1, 0.1, 0.1)).toThrow('Invalid price')
  })

  it('throws error when taxRate is negative', () => {
    expect(() => calculateFinalPrice(100, -0.01, 0.1)).toThrow('Invalid tax rate')
  })

  it('throws error when taxRate is greater than 1', () => {
    expect(() => calculateFinalPrice(100, 1.01, 0.1)).toThrow('Invalid tax rate')
  })

  it('throws error when discount is negative', () => {
    expect(() => calculateFinalPrice(100, 0.1, -0.01)).toThrow('Invalid discount')
  })

  it('throws error when discount is greater than 1', () => {
    expect(() => calculateFinalPrice(100, 0.1, 1.01)).toThrow('Invalid discount')
  })
})
// AI_TEST_AGENT_END function=calculateFinalPrice

// AI_TEST_AGENT_START function=passwordStrength
test('returns weak for password shorter than 8 characters', () => {
  expect(passwordStrength('Ab1!x')).toBe('weak')
})

test('returns strong for password with length >= 8 and all character types', () => {
  expect(passwordStrength('Abcdef1!')).toBe('strong')
})

test('returns medium for password with length exactly 8 and two character types', () => {
  expect(passwordStrength('abcdefgh')).toBe('medium')
})
// AI_TEST_AGENT_END function=passwordStrength

// AI_TEST_AGENT_START function=normalizeUserPayload
describe('normalizeUserPayload', () => {
  it('normalizes a valid payload with all fields present', () => {
    const nameTrimMock = jest.fn().mockReturnValue('john doe')
    const toUpperCaseMock = jest.fn()
    const toLowerCaseMock = jest.fn().mockReturnValue('john@example.com')

    const payload = {
      id: '123',
      name: { trim: nameTrimMock },
      email: { toLowerCase: toLowerCaseMock },
      isActive: false,
    }

    nameTrimMock.mockReturnValueOnce({
      replace: (regex: RegExp, fn: (c: string) => string) => {
        expect(regex).toEqual(/\b\w/g)
        return 'John Doe'
      },
    } as any)

    const result = normalizeUserPayload({
      id: payload.id,
      name: {
        trim: () => 'john doe',
        replace: (regex: RegExp, fn: (c: string) => string) => {
          expect(regex).toEqual(/\b\w/g)
          return 'John Doe'
        },
      },
      email: {
        toLowerCase: () => 'john@example.com',
      },
      isActive: payload.isActive,
    })

    expect(result).toEqual({
      id: 123,
      name: 'John Doe',
      email: 'john@example.com',
      isActive: false,
    })
  })

  it('defaults isActive to true when it is undefined', () => {
    const payload = {
      id: '1',
      name: {
        trim: () => ({
          replace: (regex: RegExp, fn: (c: string) => string) => 'Alice',
        }),
      },
      email: {
        toLowerCase: () => 'alice@example.com',
      },
    }

    const result = normalizeUserPayload(payload)

    expect(result.isActive).toBe(true)
  })

  it('converts id to number even if id is a number string with spaces', () => {
    const payload = {
      id: ' 42 ',
      name: {
        trim: () => ({
          replace: (regex: RegExp, fn: (c: string) => string) => 'Bob',
        }),
      },
      email: {
        toLowerCase: () => 'bob@example.com',
      },
      isActive: true,
    }

    const result = normalizeUserPayload(payload)

    expect(result.id).toBe(42)
  })

  it('handles empty name string after trim and replace', () => {
    const payload = {
      id: '5',
      name: {
        trim: () => ({
          replace: (regex: RegExp, fn: (c: string) => string) => '',
        }),
      },
      email: {
        toLowerCase: () => 'emptyname@example.com',
      },
      isActive: false,
    }

    const result = normalizeUserPayload(payload)

    expect(result.name).toBe('')
  })

  it('handles email with uppercase letters converting to lowercase', () => {
    const payload = {
      id: '7',
      name: {
        trim: () => ({
          replace: (regex: RegExp, fn: (c: string) => string) => 'Charlie',
        }),
      },
      email: {
        toLowerCase: () => 'charlie@EXAMPLE.COM',
      },
      isActive: true,
    }

    const result = normalizeUserPayload(payload)

    expect(result.email).toBe('charlie@example.com')
  })

  it('handles id as a number type directly', () => {
    const payload = {
      id: 99,
      name: {
        trim: () => ({
          replace: (regex: RegExp, fn: (c: string) => string) => 'Delta',
        }),
      },
      email: {
        toLowerCase: () => 'delta@example.com',
      },
      isActive: true,
    }

    const result = normalizeUserPayload(payload)

    expect(result.id).toBe(99)
  })

  it('handles isActive explicitly set to null resulting in default true', () => {
    const payload = {
      id: '10',
      name: {
        trim: () => ({
          replace: (regex: RegExp, fn: (c: string) => string) => 'Echo',
        }),
      },
      email: {
        toLowerCase: () => 'echo@example.com',
      },
      isActive: null,
    }

    const result = normalizeUserPayload(payload)

    expect(result.isActive).toBe(true)
  })

  it('handles id as a non-numeric string resulting in NaN', () => {
    const payload = {
      id: 'abc',
      name: {
        trim: () => ({
          replace: (regex: RegExp, fn: (c: string) => string) => 'Foxtrot',
        }),
      },
      email: {
        toLowerCase: () => 'foxtrot@example.com',
      },
      isActive: true,
    }

    const result = normalizeUserPayload(payload)

    expect(result.id).toBeNaN()
  })
})
// AI_TEST_AGENT_END function=normalizeUserPayload
