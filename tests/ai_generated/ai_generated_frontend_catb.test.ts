import { createUser } from '../../frontend/catb'
import { fetchActiveUsers } from '../../frontend/catb'
import { processOrder } from '../../frontend/catb'
import { processPayment } from '../../frontend/catb'

// AI_TEST_AGENT_START function=createUser
describe('createUser', () => {
  it('throws "User already exists" if user with email already exists', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue({ email: 'test@example.com', name: 'Test' }),
      insertUser: jest.fn(),
    }
    const payload = { email: 'test@example.com', name: 'Test', password: 'validPass123' }
    const call = () => createUser(payload, db)
    expect(call).toThrow('User already exists')
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('test@example.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws "Weak password" if password length is less than 8', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'new@example.com', name: 'New User', password: 'short' }
    const call = () => createUser(payload, db)
    expect(call).toThrow('Weak password')
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('new@example.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('inserts user and returns result when payload is valid and user does not exist', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn().mockReturnValue({ id: 1, email: 'valid@example.com', name: 'Valid User' }),
    }
    const payload = { email: 'valid@example.com', name: 'Valid User', password: 'strongPass123' }
    const result = createUser(payload, db)
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('valid@example.com')
    expect(db.insertUser).toHaveBeenCalledTimes(1)
    expect(db.insertUser).toHaveBeenCalledWith({ email: 'valid@example.com', name: 'Valid User' })
    expect(result).toEqual({ id: 1, email: 'valid@example.com', name: 'Valid User' })
  })

  it('throws when payload is missing email field', () => {
    const db = {
      findUserByEmail: jest.fn(),
      insertUser: jest.fn(),
    }
    const payload = { name: 'No Email', password: 'validPass123' }
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).not.toHaveBeenCalled()
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when payload is missing password field', () => {
    const db = {
      findUserByEmail: jest.fn(),
      insertUser: jest.fn(),
    }
    const payload = { email: 'nopass@example.com', name: 'No Pass' }
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).not.toHaveBeenCalled()
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when password is exactly 7 characters (boundary test)', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'sevenchars@example.com', name: 'Seven Chars', password: '1234567' }
    const call = () => createUser(payload, db)
    expect(call).toThrow('Weak password')
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('sevenchars@example.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('accepts password with exactly 8 characters (boundary test)', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn().mockReturnValue({ id: 2, email: 'eightchars@example.com', name: 'Eight Chars' }),
    }
    const payload = { email: 'eightchars@example.com', name: 'Eight Chars', password: '12345678' }
    const result = createUser(payload, db)
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('eightchars@example.com')
    expect(db.insertUser).toHaveBeenCalledTimes(1)
    expect(db.insertUser).toHaveBeenCalledWith({ email: 'eightchars@example.com', name: 'Eight Chars' })
    expect(result).toEqual({ id: 2, email: 'eightchars@example.com', name: 'Eight Chars' })
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

  it('throws error if gateway.charge returns object without status field', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ transactionId: 'tx999' }) }
    const call = () => processPayment(10, gateway)
    expect(call).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(10)
  })

  it('throws error if gateway.charge returns null', () => {
    const gateway = { charge: jest.fn().mockReturnValue(null) }
    const call = () => processPayment(20, gateway)
    expect(call).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(20)
  })

  it('throws error if gateway.charge throws an error', () => {
    const gateway = { charge: jest.fn().mockImplementation(() => { throw new Error('Network error') }) }
    const call = () => processPayment(30, gateway)
    expect(call).toThrow('Network error')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(30)
  })
})
// AI_TEST_AGENT_END function=processPayment

// AI_TEST_AGENT_START function=fetchActiveUsers
describe('fetchActiveUsers', () => {
  it('returns filtered active users with email', async () => {
    const users = [
      { is_active: true, email: 'a@example.com' },
      { is_active: true, email: '' },
      { is_active: false, email: 'b@example.com' },
      { is_active: true, email: 'c@example.com' }
    ]
    const client = {
      get: jest.fn().mockResolvedValue({ data: users })
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
    const users = [
      { is_active: true, email: 'x@example.com' },
      { is_active: false, email: 'y@example.com' }
    ]
    const client = {
      get: jest.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockResolvedValueOnce({ data: users })
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
    const users = [
      { is_active: true, email: null },
      { is_active: false, email: 'a@b.com' },
      { is_active: true, email: 'valid@example.com' },
      { is_active: false, email: '' }
    ]
    const client = {
      get: jest.fn().mockResolvedValue({ data: users })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([{ is_active: true, email: 'valid@example.com' }])
  })

  it('handles users with unexpected email types gracefully', async () => {
    const users = [
      { is_active: true, email: 123 },
      { is_active: true, email: 'valid@example.com' },
      { is_active: true, email: null }
    ]
    const client = {
      get: jest.fn().mockResolvedValue({ data: users })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([{ is_active: true, email: 123 }, { is_active: true, email: 'valid@example.com' }])
  })

  it('handles zero retries by trying once only', async () => {
    const users = [
      { is_active: true, email: 'once@example.com' }
    ]
    const client = {
      get: jest.fn().mockResolvedValue({ data: users })
    }
    const result = await fetchActiveUsers(client, 0)
    expect(client.get).toHaveBeenCalledTimes(1)
    expect(result).toEqual(users)
  })

  it('throws error if client.get returns non-array data', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({ data: null })
    }
    const call = () => fetchActiveUsers(client)
    await expect(call()).resolves.toEqual([])
  })

  it('throws error if client.get returns undefined data', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({})
    }
    const call = () => fetchActiveUsers(client)
    await expect(call()).resolves.toEqual([])
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
    expect(pricing.getPrice).toHaveBeenCalledTimes(0)
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
      if (productId === 'p3') return 1
      if (productId === 'p4') return 10
      return 0
    })
    pricing.getPrice.mockImplementation((productId) => {
      if (productId === 'p3') return 7.5
      if (productId === 'p4') return 2.25
      return 0
    })

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).toHaveBeenCalledTimes(2)
    expect(inventory.checkStock).toHaveBeenCalledWith('p3')
    expect(inventory.checkStock).toHaveBeenCalledWith('p4')
    expect(pricing.getPrice).toHaveBeenCalledTimes(2)
    expect(pricing.getPrice).toHaveBeenCalledWith('p3')
    expect(pricing.getPrice).toHaveBeenCalledWith('p4')
    expect(result).toEqual({ orderId: 'order3', total: 16.5 })
  })

  test('throws error on second item if first item has sufficient stock but second does not', () => {
    const order = {
      id: 'order4',
      items: [
        { product_id: 'p5', quantity: 1 },
        { product_id: 'p6', quantity: 5 },
      ],
    }
    inventory.checkStock.mockImplementation((productId) => {
      if (productId === 'p5') return 10
      if (productId === 'p6') return 3
      return 0
    })
    pricing.getPrice.mockImplementation(() => 1)

    const call = () => processOrder(order, inventory, pricing)

    expect(call).toThrow('Out of stock: p6')
    expect(inventory.checkStock).toHaveBeenCalledTimes(2)
    expect(inventory.checkStock).toHaveBeenCalledWith('p5')
    expect(inventory.checkStock).toHaveBeenCalledWith('p6')
    expect(pricing.getPrice).toHaveBeenCalledTimes(1)
    expect(pricing.getPrice).toHaveBeenCalledWith('p5')
  })

  test('returns total rounded to two decimal places', () => {
    const order = { id: 'order5', items: [{ product_id: 'p7', quantity: 3 }] }
    inventory.checkStock.mockReturnValue(10)
    pricing.getPrice.mockReturnValue(1.23456)

    const result = processOrder(order, inventory, pricing)

    expect(result.total).toBeCloseTo(3.7, 2)
  })

  test('throws error if order.items is empty array', () => {
    const order = { id: 'order6', items: [] }
    inventory.checkStock.mockReturnValue(10)
    pricing.getPrice.mockReturnValue(5)

    const result = processOrder(order, inventory, pricing)

    expect(result).toEqual({ orderId: 'order6', total: 0 })
    expect(inventory.checkStock).toHaveBeenCalledTimes(0)
    expect(pricing.getPrice).toHaveBeenCalledTimes(0)
  })

  test('throws error if order.items is missing', () => {
    const order = { id: 'order7' } as any
    inventory.checkStock.mockReturnValue(10)
    pricing.getPrice.mockReturnValue(5)

    expect(() => processOrder(order, inventory, pricing)).toThrow()
  })

  test('throws error if item quantity is zero', () => {
    const order = { id: 'order8', items: [{ product_id: 'p8', quantity: 0 }] }
    inventory.checkStock.mockReturnValue(10)
    pricing.getPrice.mockReturnValue(5)

    const result = processOrder(order, inventory, pricing)

    expect(result).toEqual({ orderId: 'order8', total: 0 })
    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(pricing.getPrice).toHaveBeenCalledTimes(1)
  })

  test('throws error if item quantity is negative', () => {
    const order = { id: 'order9', items: [{ product_id: 'p9', quantity: -1 }] }
    inventory.checkStock.mockReturnValue(10)
    pricing.getPrice.mockReturnValue(5)

    const result = processOrder(order, inventory, pricing)

    expect(result).toEqual({ orderId: 'order9', total: -5 })
    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(pricing.getPrice).toHaveBeenCalledTimes(1)
  })
})
// AI_TEST_AGENT_END function=processOrder
