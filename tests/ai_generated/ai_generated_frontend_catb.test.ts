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

  it('throws "Weak password" if password is exactly 7 characters', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'edge@case.com', name: 'Edge Case', password: '1234567' }
    const call = () => createUser(payload, db)
    expect(call).toThrow('Weak password')
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('edge@case.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('accepts password of length exactly 8 and inserts user', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn().mockReturnValue({ id: 2, email: 'exact@eight.com', name: 'Exact Eight' }),
    }
    const payload = { email: 'exact@eight.com', name: 'Exact Eight', password: '12345678' }
    const result = createUser(payload, db)
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('exact@eight.com')
    expect(db.insertUser).toHaveBeenCalledTimes(1)
    expect(db.insertUser).toHaveBeenCalledWith({ email: 'exact@eight.com', name: 'Exact Eight' })
    expect(result).toEqual({ id: 2, email: 'exact@eight.com', name: 'Exact Eight' })
  })

  it('throws when payload.email is null', () => {
    const db = {
      findUserByEmail: jest.fn(),
      insertUser: jest.fn(),
    }
    const payload = { email: null, name: 'No Email', password: 'validpass' }
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith(null)
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when payload.password is null', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'nullpass@user.com', name: 'Null Pass', password: null }
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('nullpass@user.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when payload is missing password field', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'nopass@user.com', name: 'No Pass' }
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith('nopass@user.com')
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

  it('returns transactionId if gateway.charge returns success status', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', transactionId: 'tx456' }) }
    const result = processPayment(200, gateway)
    expect(result).toBe('tx456')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(200)
  })

  it('throws error if gateway.charge returns object without status field', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ transactionId: 'tx789' }) }
    const call = () => processPayment(50, gateway)
    expect(call).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(50)
  })

  it('throws error if gateway.charge returns null', () => {
    const gateway = { charge: jest.fn().mockReturnValue(null) }
    const call = () => processPayment(10, gateway)
    expect(call).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(10)
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
    const client = {
      get: jest.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue({ data: [{ is_active: true, email: 'x@y.com' }] })
    }
    const result = await fetchActiveUsers(client, 3)
    expect(client.get).toHaveBeenCalledTimes(3)
    expect(result).toEqual([{ is_active: true, email: 'x@y.com' }])
  })

  it('throws error after all retries fail', async () => {
    const client = {
      get: jest.fn()
        .mockRejectedValue(new Error('network error'))
    }
    const call = () => fetchActiveUsers(client, 1)
    await expect(call()).rejects.toThrow('Failed after retries: Error: network error')
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
          { is_active: false, email: 'a@b.com' },
          { is_active: true, email: '' },
          { is_active: true, email: null },
          { is_active: true, email: 'valid@example.com' }
        ]
      })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([{ is_active: true, email: 'valid@example.com' }])
  })

  it('handles users with unexpected email types gracefully', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({
        data: [
          { is_active: true, email: 123 },
          { is_active: true, email: 'valid@example.com' },
          { is_active: true, email: null }
        ]
      })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([{ is_active: true, email: 123 }, { is_active: true, email: 'valid@example.com' }])
  })

  it('handles zero retries by trying once only', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('fail'))
    }
    const call = () => fetchActiveUsers(client, 0)
    await expect(call()).rejects.toThrow('Failed after retries: Error: fail')
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it('handles negative retries by trying once only', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('fail'))
    }
    const call = () => fetchActiveUsers(client, -1)
    await expect(call()).rejects.toThrow('Failed after retries: Error: fail')
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
      if (productId === 'p3') return 3.333
      if (productId === 'p4') return 2.5
      return 0
    })

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).toHaveBeenCalledTimes(2)
    expect(pricing.getPrice).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ orderId: 'order3', total: 13.33 })
  })

  test('throws error on first item out of stock and does not check subsequent items', () => {
    const order = {
      id: 'order4',
      items: [
        { product_id: 'p5', quantity: 2 },
        { product_id: 'p6', quantity: 1 },
      ],
    }
    inventory.checkStock.mockImplementation((productId) => {
      if (productId === 'p5') return 1
      if (productId === 'p6') return 10
      return 0
    })
    pricing.getPrice.mockReturnValue(10)

    const call = () => processOrder(order, inventory, pricing)

    expect(call).toThrow('Out of stock: p5')
    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  test('handles zero quantity items without error and does not add to total', () => {
    const order = { id: 'order5', items: [{ product_id: 'p7', quantity: 0 }] }
    inventory.checkStock.mockReturnValue(10)
    pricing.getPrice.mockReturnValue(100)

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(pricing.getPrice).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ orderId: 'order5', total: 0 })
  })

  test('throws error if order.items is empty array and returns total 0', () => {
    const order = { id: 'order6', items: [] }
    const result = processOrder(order, inventory, pricing)
    expect(result).toEqual({ orderId: 'order6', total: 0 })
    expect(inventory.checkStock).not.toHaveBeenCalled()
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  test('throws error if order.items is missing', () => {
    const order = { id: 'order7' } as any
    const call = () => processOrder(order, inventory, pricing)
    expect(call).toThrow()
    expect(inventory.checkStock).not.toHaveBeenCalled()
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  test('throws error if item quantity is negative', () => {
    const order = { id: 'order8', items: [{ product_id: 'p8', quantity: -1 }] }
    inventory.checkStock.mockReturnValue(10)
    pricing.getPrice.mockReturnValue(10)

    const call = () => processOrder(order, inventory, pricing)

    expect(call).toThrow()
    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  test('throws error if order is null', () => {
    const call = () => processOrder(null as any, inventory, pricing)
    expect(call).toThrow()
    expect(inventory.checkStock).not.toHaveBeenCalled()
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=processOrder
