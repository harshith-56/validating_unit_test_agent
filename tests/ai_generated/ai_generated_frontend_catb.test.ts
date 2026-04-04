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
    expect(call).toThrow(Error)
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
    expect(call).toThrow(Error)
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

  it('throws when payload.email is undefined', () => {
    const db = {
      findUserByEmail: jest.fn(),
      insertUser: jest.fn(),
    }
    const payload = { name: 'No Email', password: 'validpass123' }
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith(undefined)
    expect(db.insertUser).not.toHaveBeenCalled()
  })

  it('throws when payload.password is undefined', () => {
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

  it('throws when payload is an empty object', () => {
    const db = {
      findUserByEmail: jest.fn(),
      insertUser: jest.fn(),
    }
    const payload = {}
    const call = () => createUser(payload, db)
    expect(call).toThrow()
    expect(db.findUserByEmail).toHaveBeenCalledTimes(1)
    expect(db.findUserByEmail).toHaveBeenCalledWith(undefined)
    expect(db.insertUser).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=createUser

// AI_TEST_AGENT_START function=processPayment
describe('processPayment', () => {
  it('throws error if amount is zero', () => {
    const gateway = { charge: jest.fn() }
    const call = () => processPayment(0, gateway)
    expect(call).toThrow(Error)
    expect(call).toThrow('Invalid amount')
    expect(gateway.charge).not.toHaveBeenCalled()
  })

  it('throws error if amount is negative', () => {
    const gateway = { charge: jest.fn() }
    const call = () => processPayment(-100, gateway)
    expect(call).toThrow(Error)
    expect(call).toThrow('Invalid amount')
    expect(gateway.charge).not.toHaveBeenCalled()
  })

  it('throws error if gateway.charge returns status not success', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'failed', transactionId: 'tx123' }) }
    const call = () => processPayment(100, gateway)
    expect(call).toThrow(Error)
    expect(call).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(100)
  })

  it('returns transactionId if gateway.charge returns success', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', transactionId: 'tx456' }) }
    const result = processPayment(200, gateway)
    expect(result).toBe('tx456')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(200)
  })

  it('throws error if gateway.charge returns status undefined', () => {
    const gateway = { charge: jest.fn().mockReturnValue({ transactionId: 'tx789' }) }
    const call = () => processPayment(50, gateway)
    expect(call).toThrow(Error)
    expect(call).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(50)
  })

  it('throws error if gateway.charge returns null', () => {
    const gateway = { charge: jest.fn().mockReturnValue(null) }
    const call = () => processPayment(10, gateway)
    expect(call).toThrow(Error)
    expect(call).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(10)
  })

  it('throws error if gateway.charge throws an error', () => {
    const gateway = { charge: jest.fn().mockImplementation(() => { throw new Error('Network error') }) }
    const call = () => processPayment(30, gateway)
    expect(call).toThrow(Error)
    expect(call).toThrow('Network error')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(gateway.charge).toHaveBeenCalledWith(30)
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
    const client = {
      get: jest.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue({
          data: [
            { is_active: true, email: 'x@example.com' },
            { is_active: false, email: 'y@example.com' }
          ]
        })
    }
    const result = await fetchActiveUsers(client, 3)
    expect(client.get).toHaveBeenCalledTimes(3)
    expect(result).toEqual([{ is_active: true, email: 'x@example.com' }])
  })

  it('throws error after all retries fail', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('network error'))
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
    expect(result).toEqual([])
  })

  it('filters out users without email or inactive users', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({
        data: [
          { is_active: false, email: 'a@example.com' },
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
    expect(result).toEqual([
      { is_active: true, email: 123 },
      { is_active: true, email: 'valid@example.com' }
    ])
  })

  it('handles zero retries parameter correctly', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('fail'))
    }
    const call = () => fetchActiveUsers(client, 0)
    await expect(call()).rejects.toThrow('Failed after retries: Error: fail')
    expect(client.get).toHaveBeenCalledTimes(1)
  })
})
// AI_TEST_AGENT_END function=fetchActiveUsers

// AI_TEST_AGENT_START function=processOrder
describe('processOrder', () => {
  test('calculates total correctly for valid order', () => {
    const order = { id: 'order1', items: [{ product_id: 'p1', quantity: 2 }, { product_id: 'p2', quantity: 3 }] }
    const inventory = { checkStock: jest.fn().mockImplementation(pid => (pid === 'p1' ? 5 : 10)) }
    const pricing = { getPrice: jest.fn().mockImplementation(pid => (pid === 'p1' ? 10.123 : 5.456)) }
    const result = processOrder(order, inventory, pricing)
    expect(inventory.checkStock).toHaveBeenCalledTimes(2)
    expect(pricing.getPrice).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ orderId: 'order1', total: 10.12 * 2 + 5.46 * 3 })
  })

  test('throws error if any item quantity exceeds stock', () => {
    const order = { id: 'order2', items: [{ product_id: 'p1', quantity: 3 }] }
    const inventory = { checkStock: jest.fn().mockReturnValue(2) }
    const pricing = { getPrice: jest.fn() }
    const call = () => processOrder(order, inventory, pricing)
    expect(call).toThrow(Error)
    expect(call).toThrow('Out of stock: p1')
    expect(inventory.checkStock).toHaveBeenCalledTimes(1)
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })

  test('handles empty items array returning zero total', () => {
    const order = { id: 'order3', items: [] }
    const inventory = { checkStock: jest.fn() }
    const pricing = { getPrice: jest.fn() }
    const result = processOrder(order, inventory, pricing)
    expect(result).toEqual({ orderId: 'order3', total: 0 })
    expect(inventory.checkStock).not.toHaveBeenCalled()
    expect(pricing.getPrice).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=processOrder
