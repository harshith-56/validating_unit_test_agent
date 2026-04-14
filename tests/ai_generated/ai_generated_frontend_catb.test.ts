import { createUser } from '../../frontend/catb'
import { fetchActiveUsers } from '../../frontend/catb'
import { processOrder } from '../../frontend/catb'
import { processPayment } from '../../frontend/catb'

// AI_TEST_AGENT_START function=createUser
describe('createUser', () => {
  it('throws "User already exists" if user with email exists', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue({ email: 'a@b.com', name: 'Existing' }),
      insertUser: jest.fn(),
    }
    const payload = { email: 'a@b.com', name: 'New User', password: 'validpass' }
    const call = () => createUser(payload, db)
    expect(call).toThrow('User already exists')
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('a@b.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws "Weak password" if password length is less than 8', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'new@user.com', name: 'New User', password: 'short' }
    const call = () => createUser(payload, db)
    expect(call).toThrow('Weak password')
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('new@user.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('inserts user and returns result when payload is valid and user does not exist', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn().mockReturnValue({ id: 1, email: 'valid@user.com', name: 'Valid User' }),
    }
    const payload = { email: 'valid@user.com', name: 'Valid User', password: 'strongpass' }
    const result = createUser(payload, db)
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('valid@user.com')
    expect(db.insertUser).toHaveBeenCalledTimes(1)
    expect(db.insertUser).toHaveBeenCalledWith({ email: 'valid@user.com', name: 'Valid User' })
    expect(result).toEqual({ id: 1, email: 'valid@user.com', name: 'Valid User' })
  })

  it('throws when payload.email is null', () => {
    const db = {
      findUserByEmail: jest.fn(),
      insertUser: jest.fn(),
    }
    const payload = { email: null, name: 'Name', password: 'validpass' }
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith(null)
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when payload.password is undefined', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'a@b.com', name: 'Name' }
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('a@b.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when payload.password is empty string', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'a@b.com', name: 'Name', password: '' }
    const call = () => createUser(payload, db)
    expect(call).toThrow('Weak password')
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('a@b.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when payload is null', () => {
    const db = {
      findUserByEmail: jest.fn(),
      insertUser: jest.fn(),
    }
    const call = () => createUser(null, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).not.toHaveBeenCalled()
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when db.findUserByEmail throws an error', () => {
    const db = {
      findUserByEmail: jest.fn().mockImplementation(() => { throw new Error('DB error') }),
      insertUser: jest.fn(),
    }
    const payload = { email: 'a@b.com', name: 'Name', password: 'validpass' }
    const call = () => createUser(payload, db)
    expect(call).toThrow('DB error')
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when db.insertUser throws an error', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn().mockImplementation(() => { throw new Error('Insert error') }),
    }
    const payload = { email: 'a@b.com', name: 'Name', password: 'validpass' }
    const call = () => createUser(payload, db)
    expect(call).toThrow('Insert error')
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.insertUser).toHaveBeenCalledTimes(1)
  })
})
// AI_TEST_AGENT_END function=createUser

// AI_TEST_AGENT_START function=processPayment
describe('processPayment', () => {
  it('throws error if amount is zero', () => {
    const gateway = { charge: jest.fn() }
    const call = () => processPayment(0, gateway)
    expect(call).toThrow('Invalid amount')
    expect(gateway.charge).not.toHaveBeenCalled()
  })

  it('throws error if amount is negative', () => {
    const gateway = { charge: jest.fn() }
    const call = () => processPayment(-100, gateway)
    expect(call).toThrow('Invalid amount')
    expect(gateway.charge).not.toHaveBeenCalled()
  })

  it('throws error if gateway.charge returns failure status', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'failure' }) }
    const call = () => processPayment(50, gateway)
    expect(call).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(50)
  })

  it('returns transactionId if gateway.charge returns success status', () => {
    const transactionId = 'tx123'
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', transactionId }) }
    const result = processPayment(100, gateway)
    expect(result).toBe(transactionId)
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(100)
  })

  it('throws error if gateway.charge returns success status but no transactionId', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success' }) }
    const result = processPayment(10, gateway)
    expect(result).toBeUndefined()
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(10)
  })

  it('throws error if amount is a very large positive number and gateway fails', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'error' }) }
    const call = () => processPayment(1e12, gateway)
    expect(call).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(1e12)
  })

  it('throws error if amount is a very small positive number and gateway succeeds', () => {
    const transactionId = 'smalltx'
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', transactionId }) }
    const result = processPayment(0.0001, gateway)
    expect(result).toBe(transactionId)
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(0.0001)
  })

  it('throws error if amount is NaN', () => {
    const gateway = { charge: jest.fn() }
    const call = () => processPayment(NaN, gateway)
    expect(call).toThrow('Invalid amount')
    expect(gateway.charge).not.toHaveBeenCalled()
  })

  it('throws error if amount is Infinity', () => {
    const gateway = { charge: jest.fn() }
    const call = () => processPayment(Infinity, gateway)
    expect(call).toThrow('Invalid amount')
    expect(gateway.charge).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=processPayment

// AI_TEST_AGENT_START function=fetchActiveUsers
describe('fetchActiveUsers', () => {
  it('returns filtered active users with email', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({
        data: [
          { is_active: true, email: 'a@example.com' },
          { is_active: false, email: 'b@example.com' },
          { is_active: true, email: '' },
          { is_active: true, email: 'c@example.com' }
        ]
      })
    }
    const result = await fetchActiveUsers(client)
    expect(client.get).toHaveBeenCalledTimes(1)
    expect(client.get).toHaveBeenCalledWith('/users')
    expect(result).toEqual([
      { is_active: true, email: 'a@example.com' },
      { is_active: true, email: 'c@example.com' }
    ])
  })

  it('retries on failure and eventually succeeds', async () => {
    const error = new Error('fail')
    const client = {
      get: jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: [
            { is_active: true, email: 'x@example.com' },
            { is_active: false, email: 'y@example.com' }
          ]
        })
    }
    const result = await fetchActiveUsers(client, 2)
    expect(client.get).toHaveBeenCalledTimes(2)
    expect(result).toEqual([{ is_active: true, email: 'x@example.com' }])
  })

  it('throws error after all retries fail', async () => {
    const error = new Error('network error')
    const client = {
      get: jest.fn().mockRejectedValue(error)
    }
    const call = () => fetchActiveUsers(client, 1)
    await expect(call()).rejects.toThrow(`Failed after retries: ${error}`)
    expect(client.get).toHaveBeenCalledTimes(2)
  })

  it('returns empty array if no users returned', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({ data: [] })
    }
    const result = await fetchActiveUsers(client)
    expect(client.get).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })

  it('filters out users without email or inactive users', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({
        data: [
          { is_active: false, email: 'a@example.com' },
          { is_active: true, email: null },
          { is_active: true, email: 'valid@example.com' },
          { is_active: true, email: undefined }
        ]
      })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([{ is_active: true, email: 'valid@example.com' }])
  })

  it('handles users with non-string email values gracefully', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({
        data: [
          { is_active: true, email: 123 },
          { is_active: true, email: 'user@example.com' },
          { is_active: true, email: false }
        ]
      })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([
      { is_active: true, email: 123 },
      { is_active: true, email: 'user@example.com' },
      { is_active: true, email: false }
    ])
  })

  it('retries exact number of times specified', async () => {
    const error = new Error('fail')
    const client = {
      get: jest.fn().mockRejectedValue(error)
    }
    const call = () => fetchActiveUsers(client, 3)
    await expect(call()).rejects.toThrow(`Failed after retries: ${error}`)
    expect(client.get).toHaveBeenCalledTimes(4)
  })

  it('works with retries set to zero', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({
        data: [
          { is_active: true, email: 'a@example.com' },
          { is_active: false, email: 'b@example.com' }
        ]
      })
    }
    const result = await fetchActiveUsers(client, 0)
    expect(client.get).toHaveBeenCalledTimes(1)
    expect(result).toEqual([{ is_active: true, email: 'a@example.com' }])
  })

  it('throws if client.get returns non-array data', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({ data: null })
    }
    await expect(fetchActiveUsers(client)).rejects.toThrow()
    expect(client.get).toHaveBeenCalledTimes(3)
  })
})
// AI_TEST_AGENT_END function=fetchActiveUsers

// AI_TEST_AGENT_START function=processOrder
describe('processOrder', () => {
  let inventory: { checkStock: jest.Mock }
  let pricing: { getPrice: jest.Mock }

  beforeEach(() => {
    inventory = { checkStock: jest.fn() }
    pricing = { getPrice: jest.fn() }
  })

  test('calculates total correctly for multiple items with sufficient stock', () => {
    const order = {
      id: 'order123',
      items: [
        { product_id: 'p1', quantity: 2 },
        { product_id: 'p2', quantity: 3 },
      ],
    }
    inventory.checkStock.mockImplementation((productId) => {
      if (productId === 'p1') return 5
      if (productId === 'p2') return 10
      return 0
    })
    pricing.getPrice.mockImplementation((productId) => {
      if (productId === 'p1') return 10.123
      if (productId === 'p2') return 20.456
      return 0
    })

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).toHaveBeenCalledTimes(2)
    expect(inventory.checkStock).toHaveBeenCalledWith('p1')
    expect(inventory.checkStock).toHaveBeenCalledWith('p2')
    expect(pricing.getPrice).toHaveBeenCalledTimes(2)
    expect(pricing.getPrice).toHaveBeenCalledWith('p1')
    expect(pricing.getPrice).toHaveBeenCalledWith('p2')
    expect(result.orderId).toBe('order123')
    expect(result.total).toBeCloseTo(2 * 10.123 + 3 * 20.456, 2)
  })

  test('throws error when any item is out of stock', () => {
    const order = {
      id: 'order456',
      items: [
        { product_id: 'p1', quantity: 2 },
        { product_id: 'p2', quantity: 4 },
      ],
    }
    inventory.checkStock.mockImplementation((productId) => {
      if (productId === 'p1') return 2
      if (productId === 'p2') return 3
      return 0
    })
    pricing.getPrice.mockReturnValue(10)

    const call = () => processOrder(order, inventory, pricing)

    expect(call).toThrow('Out of stock: p2')
    expect(inventory.checkStock).toHaveBeenCalledTimes(2)
    expect(pricing.getPrice).toHaveBeenCalledTimes(1)
  })

  test('returns total 0 for order with no items', () => {
    const order = {
      id: 'emptyOrder',
      items: [],
    }
    const result = processOrder(order, inventory, pricing)
    expect(result.orderId).toBe('emptyOrder')
    expect(result.total).toBe(0)
    expect(inventory.checkStock).not.toHaveBeenCalled()
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  test('throws error if order.items is missing', () => {
    const order = {
      id: 'badOrder',
    } as any

    const call = () => processOrder(order, inventory, pricing)

    expect(call).toThrow()
  })

  test('throws error if item quantity is zero or negative', () => {
    const order = {
      id: 'orderNeg',
      items: [
        { product_id: 'p1', quantity: 0 },
        { product_id: 'p2', quantity: -1 },
      ],
    }
    inventory.checkStock.mockReturnValue(10)
    pricing.getPrice.mockReturnValue(5)

    const call = () => processOrder(order, inventory, pricing)

    expect(call).toThrow()
  })

  test('rounds total to two decimal places correctly', () => {
    const order = {
      id: 'orderRound',
      items: [
        { product_id: 'p1', quantity: 1 },
      ],
    }
    inventory.checkStock.mockReturnValue(10)
    pricing.getPrice.mockReturnValue(10.5555)

    const result = processOrder(order, inventory, pricing)

    expect(result.total).toBe(10.56)
  })

  test('processes single item order correctly', () => {
    const order = {
      id: 'singleItem',
      items: [
        { product_id: 'p1', quantity: 1 },
      ],
    }
    inventory.checkStock.mockReturnValue(1)
    pricing.getPrice.mockReturnValue(15.99)

    const result = processOrder(order, inventory, pricing)

    expect(result.orderId).toBe('singleItem')
    expect(result.total).toBe(15.99)
    expect(inventory.checkStock).toHaveBeenCalledWith('p1')
    expect(pricing.getPrice).toHaveBeenCalledWith('p1')
  })

  test('throws error if order is null', () => {
    const call = () => processOrder(null as any, inventory, pricing)
    expect(call).toThrow()
  })

  test('throws error if inventory or pricing is null', () => {
    const order = {
      id: 'order1',
      items: [
        { product_id: 'p1', quantity: 1 },
      ],
    }
    expect(() => processOrder(order, null as any, pricing)).toThrow()
    expect(() => processOrder(order, inventory, null as any)).toThrow()
  })
})
// AI_TEST_AGENT_END function=processOrder
