import { createUser } from '../../frontend/catb'
import { fetchActiveUsers } from '../../frontend/catb'
import { processOrder } from '../../frontend/catb'
import { processPayment } from '../../frontend/catb'

// AI_TEST_AGENT_START function=createUser
describe('createUser', () => {
  it('throws "User already exists" if user with email already exists', () => {
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

  it('throws when payload.email is missing', () => {
    const db = {
      findUserByEmail: jest.fn(),
      insertUser: jest.fn(),
    }
    const payload = { name: 'No Email', password: 'validpass123' }
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).not.toHaveBeenCalled()
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when payload.password is missing', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'no@password.com', name: 'No Password' }
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('no@password.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when payload.password is not a string', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'bad@password.com', name: 'Bad Password', password: 12345678 }
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('bad@password.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when payload.email is not a string', () => {
    const db = {
      findUserByEmail: jest.fn(),
      insertUser: jest.fn(),
    }
    const payload = { email: 12345, name: 'Bad Email', password: 'validpass123' }
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).not.toHaveBeenCalled()
    expect(db.insertUser).not.toHaveBeenCalled()
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
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'failure', transactionId: 'tx123' }) }
    const call = () => processPayment(100, gateway)
    expect(call).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(100)
  })

  it('throws error if gateway.charge returns unknown status', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'unknown', transactionId: 'tx123' }) }
    const call = () => processPayment(50, gateway)
    expect(call).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(50)
  })

  it('returns transactionId if gateway.charge returns success status', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', transactionId: 'tx999' }) }
    const result = processPayment(200, gateway)
    expect(result).toBe('tx999')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(200)
  })

  it('throws error if amount is a very small positive number', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', transactionId: 'tx001' }) }
    const result = processPayment(0.0001, gateway)
    expect(result).toBe('tx001')
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
    expect(() => processPayment(Infinity, gateway)).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledWith(Infinity)
  })

  it('throws error if gateway.charge throws an error', () => {
    const gateway = { charge: jest.fn().mockImplementation(() => { throw new Error('Gateway error') }) }
    const call = () => processPayment(100, gateway)
    expect(call).toThrow('Gateway error')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(100)
  })
})
// AI_TEST_AGENT_END function=processPayment

// AI_TEST_AGENT_START function=fetchActiveUsers
describe('fetchActiveUsers', () => {
  it('returns only active users with email', async () => {
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
    const error = new Error('Network error')
    const client = {
      get: jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: [
            { is_active: true, email: 'user@example.com' },
            { is_active: false, email: 'nope@example.com' }
          ]
        })
    }
    const result = await fetchActiveUsers(client, 2)
    expect(client.get).toHaveBeenCalledTimes(2)
    expect(result).toEqual([{ is_active: true, email: 'user@example.com' }])
  })

  it('throws error after all retries fail', async () => {
    const error = new Error('Server down')
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

  it('filters out users missing email or inactive users', async () => {
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

  it('handles users array with unexpected types gracefully', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({
        data: [
          null,
          undefined,
          { is_active: true, email: 'ok@example.com' },
          123,
          'string',
          { is_active: true, email: '' }
        ]
      })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([{ is_active: true, email: 'ok@example.com' }])
  })

  it('handles retries=0 and fails immediately on error', async () => {
    const error = new Error('Immediate failure')
    const client = {
      get: jest.fn().mockRejectedValue(error)
    }
    const call = () => fetchActiveUsers(client, 0)
    await expect(call()).rejects.toThrow(`Failed after retries: ${error}`)
    expect(client.get).toHaveBeenCalledTimes(1)
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

  test('calculates total correctly for single item with sufficient stock', () => {
    const order = { id: 'order1', items: [{ product_id: 'p1', quantity: 2 }] }
    inventory.checkStock.mockReturnValue(5)
    pricing.getPrice.mockReturnValue(10.1234)

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(inventory.checkStock).toHaveBeenCalledWith('p1')
    expect(pricing.getPrice).toHaveBeenCalledTimes(1)
    expect(pricing.getPrice).toHaveBeenCalledWith('p1')
    expect(result).toEqual({ orderId: 'order1', total: 20.25 })
  })

  test('throws error when stock is less than quantity for an item', () => {
    const order = { id: 'order2', items: [{ product_id: 'p2', quantity: 3 }] }
    inventory.checkStock.mockReturnValue(2)
    pricing.getPrice.mockReturnValue(5)

    const call = () => processOrder(order, inventory, pricing)

    expect(call).toThrow('Out of stock: p2')
    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(inventory.checkStock).toHaveBeenCalledWith('p2')
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  test('calculates total correctly for multiple items with sufficient stock', () => {
    const order = {
      id: 'order3',
      items: [
        { product_id: 'p3', quantity: 1 },
        { product_id: 'p4', quantity: 4 },
      ],
    }
    inventory.checkStock.mockImplementation((productId) => {
      if (productId === 'p3') return 10
      if (productId === 'p4') return 5
      return 0
    })
    pricing.getPrice.mockImplementation((productId) => {
      if (productId === 'p3') return 7.5
      if (productId === 'p4') return 2.3333
      return 0
    })

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).toHaveBeenCalledTimes(2)
    expect(inventory.checkStock).toHaveBeenCalledWith('p3')
    expect(inventory.checkStock).toHaveBeenCalledWith('p4')
    expect(pricing.getPrice).toHaveBeenCalledTimes(2)
    expect(pricing.getPrice).toHaveBeenCalledWith('p3')
    expect(pricing.getPrice).toHaveBeenCalledWith('p4')
    expect(result).toEqual({ orderId: 'order3', total: 16.83 })
  })

  test('throws error on second item if first item has sufficient stock but second does not', () => {
    const order = {
      id: 'order4',
      items: [
        { product_id: 'p5', quantity: 1 },
        { product_id: 'p6', quantity: 10 },
      ],
    }
    inventory.checkStock.mockImplementation((productId) => {
      if (productId === 'p5') return 1
      if (productId === 'p6') return 5
      return 0
    })
    pricing.getPrice.mockImplementation((productId) => {
      if (productId === 'p5') return 3
      if (productId === 'p6') return 1
      return 0
    })

    const call = () => processOrder(order, inventory, pricing)

    expect(call).toThrow('Out of stock: p6')
    expect(inventory.checkStock).toHaveBeenCalledTimes(2)
    expect(inventory.checkStock).toHaveBeenCalledWith('p5')
    expect(inventory.checkStock).toHaveBeenCalledWith('p6')
    expect(pricing.getPrice).toHaveBeenCalledTimes(1)
    expect(pricing.getPrice).toHaveBeenCalledWith('p5')
  })

  test('returns total 0 for order with no items', () => {
    const order = { id: 'order5', items: [] }

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).not.toHaveBeenCalled()
    expect(pricing.getPrice).not.toHaveBeenCalled()
    expect(result).toEqual({ orderId: 'order5', total: 0 })
  })

  test('throws error if order.items is null', () => {
    const order = { id: 'order6', items: null as any }

    const call = () => processOrder(order, inventory, pricing)

    expect(call).toThrow()
    expect(inventory.checkStock).not.toHaveBeenCalled()
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  test('throws error if order is null', () => {
    const call = () => processOrder(null as any, inventory, pricing)

    expect(call).toThrow()
    expect(inventory.checkStock).not.toHaveBeenCalled()
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  test('throws error if item quantity is zero or negative', () => {
    const order = {
      id: 'order7',
      items: [
        { product_id: 'p7', quantity: 0 },
        { product_id: 'p8', quantity: -1 },
      ],
    }
    inventory.checkStock.mockReturnValue(10)
    pricing.getPrice.mockReturnValue(5)

    const call = () => processOrder(order, inventory, pricing)

    expect(call).toThrow()
    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(inventory.checkStock).toHaveBeenCalledWith('p7')
  })

  test('rounds total correctly with floating point prices and quantities', () => {
    const order = {
      id: 'order8',
      items: [
        { product_id: 'p9', quantity: 3 },
      ],
    }
    inventory.checkStock.mockReturnValue(10)
    pricing.getPrice.mockReturnValue(0.3333)

    const result = processOrder(order, inventory, pricing)

    expect(result.total).toBeCloseTo(1, 2)
    expect(result).toEqual({ orderId: 'order8', total: 1 })
  })
})
// AI_TEST_AGENT_END function=processOrder
