import createUser from '../../frontend/catb'
import fetchActiveUsers from '../../frontend/catb'
import processOrder from '../../frontend/catb'
import processPayment from '../../frontend/catb'

// AI_TEST_AGENT_START function=createUser
describe('createUser', () => {
  it('throws error if user with email already exists', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue({ email: 'test@example.com', name: 'Test' }),
      insertUser: jest.fn(),
    }
    const payload = { email: 'test@example.com', name: 'Test', password: 'validPass123' }
    expect(() => createUser(payload, db)).toThrow('User already exists')
    expect(db.findUserByEmail).toHaveBeenCalledWith('test@example.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws error if password is shorter than 8 characters', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'new@example.com', name: 'New User', password: 'short' }
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

  it('throws error if password length is exactly 7 characters', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'edge@example.com', name: 'Edge Case', password: '1234567' }
    expect(() => createUser(payload, db)).toThrow('Weak password')
    expect(db.findUserByEmail).toHaveBeenCalledWith('edge@example.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('accepts password length exactly 8 characters', () => {
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

  it('throws error if payload.password is missing', () => {
    const db = {
      findUserByEmail: jest.fn().mockReturnValue(null),
      insertUser: jest.fn(),
    }
    const payload = { email: 'nopass@example.com', name: 'No Pass' }
    expect(() => createUser(payload, db)).toThrow()
    expect(db.findUserByEmail).toHaveBeenCalledWith('nopass@example.com')
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws error if payload.email is missing', () => {
    const db = {
      findUserByEmail: jest.fn(),
      insertUser: jest.fn(),
    }
    const payload = { name: 'No Email', password: 'validPass123' }
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
    expect(() => processPayment(0, gateway)).toThrowError("Invalid amount")
    expect(gateway.charge).not.toHaveBeenCalled()
  })

  it('throws error if amount is negative', () => {
    const gateway = { charge: jest.fn() }
    expect(() => processPayment(-100, gateway)).toThrowError("Invalid amount")
    expect(gateway.charge).not.toHaveBeenCalled()
  })

  it('throws error if gateway.charge returns status not success', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: "failure", transactionId: "tx123" }) }
    expect(() => processPayment(100, gateway)).toThrowError("Payment failed")
    expect(gateway.charge).toHaveBeenCalledWith(100)
  })

  it('returns transactionId if gateway.charge returns success', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: "success", transactionId: "tx456" }) }
    const result = processPayment(200, gateway)
    expect(result).toBe("tx456")
    expect(gateway.charge).toHaveBeenCalledWith(200)
  })

  it('calls gateway.charge exactly once with the correct amount', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: "success", transactionId: "tx789" }) }
    processPayment(50, gateway)
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(50)
  })

  it('throws error if gateway.charge returns an object without status field', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ transactionId: "tx000" }) }
    expect(() => processPayment(10, gateway)).toThrowError("Payment failed")
    expect(gateway.charge).toHaveBeenCalledWith(10)
  })

  it('throws error if gateway.charge returns null', () => {
    const gateway = { charge: jest.fn().mockReturnValue(null) }
    expect(() => processPayment(10, gateway)).toThrowError("Payment failed")
    expect(gateway.charge).toHaveBeenCalledWith(10)
  })
})
// AI_TEST_AGENT_END function=processPayment

// AI_TEST_AGENT_START function=fetchActiveUsers
describe('fetchActiveUsers', () => {
  it('returns only active users with email', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({
        data: [
          { id: 1, is_active: true, email: 'a@example.com' },
          { id: 2, is_active: false, email: 'b@example.com' },
          { id: 3, is_active: true, email: '' },
          { id: 4, is_active: true, email: 'c@example.com' }
        ]
      })
    }
    const result = await fetchActiveUsers(client)
    expect(client.get).toHaveBeenCalledTimes(1)
    expect(client.get).toHaveBeenCalledWith('/users')
    expect(result).toEqual([
      { id: 1, is_active: true, email: 'a@example.com' },
      { id: 4, is_active: true, email: 'c@example.com' }
    ])
  })

  it('retries on failure and eventually succeeds', async () => {
    const client = {
      get: jest.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue({
          data: [
            { is_active: true, email: 'x@x.com' },
            { is_active: false, email: 'y@y.com' }
          ]
        })
    }
    const result = await fetchActiveUsers(client, 3)
    expect(client.get).toHaveBeenCalledTimes(3)
    expect(result).toEqual([{ is_active: true, email: 'x@x.com' }])
  })

  it('throws error after all retries fail', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('network error'))
    }
    await expect(fetchActiveUsers(client, 1)).rejects.toThrow('Failed after retries: Error: network error')
    expect(client.get).toHaveBeenCalledTimes(2)
  })

  it('returns empty array if no users are active with email', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({
        data: [
          { is_active: false, email: 'a@b.com' },
          { is_active: true, email: '' },
          { is_active: false, email: '' }
        ]
      })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([])
  })

  it('handles empty users array gracefully', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({ data: [] })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([])
  })

  it('handles users with missing email field', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({
        data: [
          { is_active: true },
          { is_active: true, email: 'valid@example.com' },
          { is_active: false }
        ]
      })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([{ is_active: true, email: 'valid@example.com' }])
  })

  it('handles users with email set to null or undefined', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({
        data: [
          { is_active: true, email: null },
          { is_active: true, email: undefined },
          { is_active: true, email: 'ok@example.com' }
        ]
      })
    }
    const result = await fetchActiveUsers(client)
    expect(result).toEqual([{ is_active: true, email: 'ok@example.com' }])
  })
})
// AI_TEST_AGENT_END function=fetchActiveUsers

// AI_TEST_AGENT_START function=processOrder
describe('processOrder', () => {
  it('calculates total correctly for single item with sufficient stock', () => {
    const order = { id: 'order1', items: [{ product_id: 'p1', quantity: 2 }] }
    const inventory = { checkStock: jest.fn().mockReturnValue(5) }
    const pricing = { getPrice: jest.fn().mockReturnValue(10.5) }

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).toHaveBeenCalledWith('p1')
    expect(pricing.getPrice).toHaveBeenCalledWith('p1')
    expect(result).toEqual({ orderId: 'order1', total: 21 })
  })

  it('calculates total correctly for multiple items with sufficient stock', () => {
    const order = {
      id: 'order2',
      items: [
        { product_id: 'p1', quantity: 1 },
        { product_id: 'p2', quantity: 3 },
      ],
    }
    const inventory = {
      checkStock: jest.fn()
        .mockImplementation((productId) => (productId === 'p1' ? 10 : 5)),
    }
    const pricing = {
      getPrice: jest.fn()
        .mockImplementation((productId) => (productId === 'p1' ? 5 : 2.5)),
    }

    const result = processOrder(order, inventory, pricing)

    expect(inventory.checkStock).toHaveBeenCalledWith('p1')
    expect(inventory.checkStock).toHaveBeenCalledWith('p2')
    expect(pricing.getPrice).toHaveBeenCalledWith('p1')
    expect(pricing.getPrice).toHaveBeenCalledWith('p2')
    expect(result).toEqual({ orderId: 'order2', total: 12.5 })
  })

  it('throws error when stock is insufficient for an item', () => {
    const order = { id: 'order3', items: [{ product_id: 'p1', quantity: 4 }] }
    const inventory = { checkStock: jest.fn().mockReturnValue(2) }
    const pricing = { getPrice: jest.fn() }

    expect(() => processOrder(order, inventory, pricing)).toThrowError(
      'Out of stock: p1'
    )
    expect(inventory.checkStock).toHaveBeenCalledWith('p1')
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  it('returns total rounded to two decimal places', () => {
    const order = { id: 'order4', items: [{ product_id: 'p1', quantity: 3 }] }
    const inventory = { checkStock: jest.fn().mockReturnValue(10) }
    const pricing = { getPrice: jest.fn().mockReturnValue(3.3333) }

    const result = processOrder(order, inventory, pricing)

    expect(result.total).toBeCloseTo(9.9999, 2)
    expect(result.total).toBe(10)
  })

  it('handles empty order items array returning zero total', () => {
    const order = { id: 'order5', items: [] }
    const inventory = { checkStock: jest.fn() }
    const pricing = { getPrice: jest.fn() }

    const result = processOrder(order, inventory, pricing)

    expect(result).toEqual({ orderId: 'order5', total: 0 })
    expect(inventory.checkStock).not.toHaveBeenCalled()
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  it('throws error if order.items is undefined', () => {
    const order = { id: 'order6' }
    const inventory = { checkStock: jest.fn() }
    const pricing = { getPrice: jest.fn() }

    expect(() => processOrder(order, inventory, pricing)).toThrow()
    expect(inventory.checkStock).not.toHaveBeenCalled()
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  it('throws error if order.items contains item with zero quantity', () => {
    const order = { id: 'order7', items: [{ product_id: 'p1', quantity: 0 }] }
    const inventory = { checkStock: jest.fn().mockReturnValue(10) }
    const pricing = { getPrice: jest.fn().mockReturnValue(5) }

    const result = processOrder(order, inventory, pricing)

    expect(result).toEqual({ orderId: 'order7', total: 0 })
    expect(inventory.checkStock).toHaveBeenCalledWith('p1')
    expect(pricing.getPrice).toHaveBeenCalledWith('p1')
  })

  it('throws error if inventory.checkStock returns negative stock', () => {
    const order = { id: 'order8', items: [{ product_id: 'p1', quantity: 1 }] }
    const inventory = { checkStock: jest.fn().mockReturnValue(-1) }
    const pricing = { getPrice: jest.fn() }

    expect(() => processOrder(order, inventory, pricing)).toThrowError(
      'Out of stock: p1'
    )
    expect(inventory.checkStock).toHaveBeenCalledWith('p1')
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=processOrder
