import { createUser } from '../../frontend/catb'
import { fetchActiveUsers } from '../../frontend/catb'
import { processOrder } from '../../frontend/catb'
import { processPayment } from '../../frontend/catb'

// AI_TEST_AGENT_START function=createUser
describe('createUser', () => {
  it('throws "User already exists" error if user with email already exists', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue({ email: 'test@example.com', name: 'Test' }),
      insertUser: jest.fn(),
    }
    const payload = { email: 'test@example.com', name: 'Test', password: 'validPass123' }
    expect(() => createUser(payload, db)).toThrow(Error)
    expect(() => createUser(payload, db)).toThrow('User already exists')
    expect(db.findUserByEmail).toHaveBeenCalledWith('test@example.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws "Weak password" error if password length is less than 8', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'new@example.com', name: 'New User', password: 'short' }
    expect(() => createUser(payload, db)).toThrow(Error)
    expect(() => createUser(payload, db)).toThrow('Weak password')
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
    expect(db.findUserByEmail).toHaveBeenCalledWith('valid@example.com')
    expect(db.insertUser).toHaveBeenCalledWith({ email: 'valid@example.com', name: 'Valid User' })
    expect(result).toEqual({ id: 1, email: 'valid@example.com', name: 'Valid User' })
  })

  it('throws "Weak password" error if password length is exactly 7', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'edge@example.com', name: 'Edge Case', password: '1234567' }
    expect(() => createUser(payload, db)).toThrow('Weak password')
    expect(db.findUserByEmail).toHaveBeenCalledWith('edge@example.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('accepts password length exactly 8 and inserts user', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn().mockReturnValue({ id: 2, email: 'eight@example.com', name: 'Eight Char' }),
    }
    const payload = { email: 'eight@example.com', name: 'Eight Char', password: '12345678' }
    const result = createUser(payload, db)
    expect(db.findUserByEmail).toHaveBeenCalledWith('eight@example.com')
    expect(db.insertUser).toHaveBeenCalledWith({ email: 'eight@example.com', name: 'Eight Char' })
    expect(result).toEqual({ id: 2, email: 'eight@example.com', name: 'Eight Char' })
  })

  it('throws error if payload.password is empty string', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'empty@example.com', name: 'Empty Pass', password: '' }
    expect(() => createUser(payload, db)).toThrow('Weak password')
    expect(db.findUserByEmail).toHaveBeenCalledWith('empty@example.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws error if payload.password is undefined', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'undef@example.com', name: 'Undefined Pass', password: undefined }
    expect(() => createUser(payload, db)).toThrow()
    expect(db.findUserByEmail).toHaveBeenCalledWith('undef@example.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws error if payload.email is undefined', () => {
    const db = {
      findUserByEmail: jest.fn(),
      insertUser: jest.fn(),
    }
    const payload = { email: undefined, name: 'No Email', password: 'validPass123' }
    expect(() => createUser(payload, db)).toThrow()
    expect(db.findUserByEmail).toHaveBeenCalledWith(undefined)
    expect(db.insertUser).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=createUser

// AI_TEST_AGENT_START function=processPayment
describe('processPayment', () => {
  it('throws error if amount is zero', () => {
    const gateway = { charge: jest.fn() }
    expect(() => processPayment(0, gateway)).toThrow(Error)
    expect(() => processPayment(0, gateway)).toThrow('Invalid amount')
    expect(gateway.charge).not.toHaveBeenCalled()
  })

  it('throws error if amount is negative', () => {
    const gateway = { charge: jest.fn() }
    expect(() => processPayment(-100, gateway)).toThrow(Error)
    expect(() => processPayment(-100, gateway)).toThrow('Invalid amount')
    expect(gateway.charge).not.toHaveBeenCalled()
  })

  it('calls gateway.charge with correct amount and returns transactionId on success', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', transactionId: 'tx123' }) }
    const result = processPayment(50, gateway)
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(50)
    expect(result).toBe('tx123')
  })

  it('throws error if gateway.charge returns failure status', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'failure', transactionId: 'tx999' }) }
    expect(() => processPayment(100, gateway)).toThrow(Error)
    expect(() => processPayment(100, gateway)).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(100)
  })

  it('throws error if gateway.charge returns unknown status', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'pending', transactionId: 'tx000' }) }
    expect(() => processPayment(10, gateway)).toThrow(Error)
    expect(() => processPayment(10, gateway)).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(10)
  })

  it('throws error if gateway.charge throws an error', () => {
    const gateway = { charge: jest.fn(() => { throw new Error('Network error') }) }
    expect(() => processPayment(20, gateway)).toThrow(Error)
    expect(() => processPayment(20, gateway)).toThrow('Network error')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(20)
  })

  it('processes payment correctly with large amount', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', transactionId: 'tx999999' }) }
    const result = processPayment(1_000_000, gateway)
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(1_000_000)
    expect(result).toBe('tx999999')
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
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: users })
    }
    const result = await fetchActiveUsers(client, 2)
    expect(client.get).toHaveBeenCalledTimes(2)
    expect(result).toEqual([{ is_active: true, email: 'x@example.com' }])
  })

  it('throws error after all retries fail', async () => {
    const error = new Error('Server down')
    const client = {
      get: jest.fn().mockRejectedValue(error)
    }
    await expect(fetchActiveUsers(client, 1)).rejects.toThrow(`Failed after retries: ${error}`)
    expect(client.get).toHaveBeenCalledTimes(2)
  })

  it('returns empty array if no users are active with email', async () => {
    const users = [
      { is_active: false, email: 'a@example.com' },
      { is_active: true, email: '' },
      { is_active: false, email: '' }
    ]
    const client = {
      get: jest.fn().mockResolvedValue({ data: users })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([])
  })

  it('handles empty users array correctly', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({ data: [] })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([])
  })

  it('handles users with missing email field gracefully', async () => {
    const users = [
      { is_active: true },
      { is_active: true, email: 'valid@example.com' },
      { is_active: false }
    ]
    const client = {
      get: jest.fn().mockResolvedValue({ data: users })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([{ is_active: true, email: 'valid@example.com' }])
  })

  it('handles users with null email field gracefully', async () => {
    const users = [
      { is_active: true, email: null },
      { is_active: true, email: 'valid@example.com' }
    ]
    const client = {
      get: jest.fn().mockResolvedValue({ data: users })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([{ is_active: true, email: 'valid@example.com' }])
  })
})
// AI_TEST_AGENT_END function=fetchActiveUsers

// AI_TEST_AGENT_START function=processOrder
describe('processOrder', () => {
  it('calculates total correctly for a single item with sufficient stock', () => {
    const order = { id: 'order1', items: [{ product_id: 'p1', quantity: 2 }] }
    const inventory = { checkStock: jest.fn().mockReturnValue(5) }
    const pricing = { getPrice: jest.fn().mockReturnValue(10.123) }

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(inventory.checkStock).toHaveBeenCalledWith('p1')
    expect(pricing.getPrice).toHaveBeenCalledTimes(1)
    expect(pricing.getPrice).toHaveBeenCalledWith('p1')
    expect(result).toEqual({ orderId: 'order1', total: 20.25 })
  })

  it('throws error when stock is less than quantity for an item', () => {
    const order = { id: 'order2', items: [{ product_id: 'p2', quantity: 3 }] }
    const inventory = { checkStock: jest.fn().mockReturnValue(2) }
    const pricing = { getPrice: jest.fn() }

    expect(() => processOrder(order, inventory, pricing)).toThrow(Error)
    expect(() => processOrder(order, inventory, pricing)).toThrow('Out of stock: p2')
    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(inventory.checkStock).toHaveBeenCalledWith('p2')
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  it('calculates total correctly for multiple items with sufficient stock', () => {
    const order = {
      id: 'order3',
      items: [
        { product_id: 'p3', quantity: 1 },
        { product_id: 'p4', quantity: 4 },
      ],
    }
    const inventory = {
      checkStock: jest.fn()
        .mockImplementation((productId) => (productId === 'p3' ? 10 : 5)),
    }
    const pricing = {
      getPrice: jest.fn()
        .mockImplementation((productId) => (productId === 'p3' ? 5.555 : 2.222)),
    }

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).toHaveBeenCalledTimes(2)
    expect(inventory.checkStock).toHaveBeenCalledWith('p3')
    expect(inventory.checkStock).toHaveBeenCalledWith('p4')
    expect(pricing.getPrice).toHaveBeenCalledTimes(2)
    expect(pricing.getPrice).toHaveBeenCalledWith('p3')
    expect(pricing.getPrice).toHaveBeenCalledWith('p4')
    expect(result).toEqual({ orderId: 'order3', total: 14.44 })
  })

  it('throws error on second item if first item has sufficient stock but second does not', () => {
    const order = {
      id: 'order4',
      items: [
        { product_id: 'p5', quantity: 1 },
        { product_id: 'p6', quantity: 3 },
      ],
    }
    const inventory = {
      checkStock: jest.fn()
        .mockImplementation((productId) => (productId === 'p5' ? 2 : 2)),
    }
    const pricing = {
      getPrice: jest.fn()
        .mockImplementation((productId) => (productId === 'p5' ? 10 : 20)),
    }

    expect(() => processOrder(order, inventory, pricing)).toThrow(Error)
    expect(() => processOrder(order, inventory, pricing)).toThrow('Out of stock: p6')
    expect(inventory.checkStock).toHaveBeenCalledTimes(2)
    expect(inventory.checkStock).toHaveBeenCalledWith('p5')
    expect(inventory.checkStock).toHaveBeenCalledWith('p6')
    expect(pricing.getPrice).toHaveBeenCalledTimes(1)
    expect(pricing.getPrice).toHaveBeenCalledWith('p5')
  })

  it('returns total 0 for order with no items', () => {
    const order = { id: 'order5', items: [] }
    const inventory = { checkStock: jest.fn() }
    const pricing = { getPrice: jest.fn() }

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).not.toHaveBeenCalled()
    expect(pricing.getPrice).not.toHaveBeenCalled()
    expect(result).toEqual({ orderId: 'order5', total: 0 })
  })

  it('handles quantity zero for an item without error and zero contribution to total', () => {
    const order = { id: 'order6', items: [{ product_id: 'p7', quantity: 0 }] }
    const inventory = { checkStock: jest.fn().mockReturnValue(10) }
    const pricing = { getPrice: jest.fn().mockReturnValue(100) }

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(inventory.checkStock).toHaveBeenCalledWith('p7')
    expect(pricing.getPrice).toHaveBeenCalledTimes(1)
    expect(pricing.getPrice).toHaveBeenCalledWith('p7')
    expect(result).toEqual({ orderId: 'order6', total: 0 })
  })

  it('throws error if order.items is undefined', () => {
    const order = { id: 'order7' }
    const inventory = { checkStock: jest.fn() }
    const pricing = { getPrice: jest.fn() }

    expect(() => processOrder(order, inventory, pricing)).toThrow(TypeError)
  })

  it('throws error if order is null', () => {
    const inventory = { checkStock: jest.fn() }
    const pricing = { getPrice: jest.fn() }

    expect(() => processOrder(null, inventory, pricing)).toThrow(TypeError)
  })

  it('throws error if inventory.checkStock throws an error', () => {
    const order = { id: 'order8', items: [{ product_id: 'p8', quantity: 1 }] }
    const inventory = { checkStock: jest.fn().mockImplementation(() => { throw new Error('Inventory failure') }) }
    const pricing = { getPrice: jest.fn() }

    expect(() => processOrder(order, inventory, pricing)).toThrow('Inventory failure')
    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(inventory.checkStock).toHaveBeenCalledWith('p8')
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=processOrder
