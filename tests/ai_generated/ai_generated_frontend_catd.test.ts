import { processOrder } from '../../frontend/catd'
import { validateOrder } from '../../frontend/catd'

// AI_TEST_AGENT_START function=validateOrder
describe('validateOrder', () => {
  it('throws "Empty order" error if order.items is undefined', () => {
    expect(() => validateOrder({})).toThrow(Error)
    expect(() => validateOrder({})).toThrow("Empty order")
  })

  it('throws "Empty order" error if order.items is an empty array', () => {
    expect(() => validateOrder({ items: [] })).toThrow(Error)
    expect(() => validateOrder({ items: [] })).toThrow("Empty order")
  })

  it('throws "Invalid quantity" error if any item has quantity 0', () => {
    const order = { items: [{ quantity: 1 }, { quantity: 0 }] }
    expect(() => validateOrder(order)).toThrow(Error)
    expect(() => validateOrder(order)).toThrow("Invalid quantity")
  })

  it('throws "Invalid quantity" error if any item has negative quantity', () => {
    const order = { items: [{ quantity: 2 }, { quantity: -5 }] }
    expect(() => validateOrder(order)).toThrow(Error)
    expect(() => validateOrder(order)).toThrow("Invalid quantity")
  })

  it('does not throw error for valid order with one item', () => {
    const order = { items: [{ quantity: 1 }] }
    expect(() => validateOrder(order)).not.toThrow()
  })

  it('does not throw error for valid order with multiple items', () => {
    const order = { items: [{ quantity: 1 }, { quantity: 3 }, { quantity: 10 }] }
    expect(() => validateOrder(order)).not.toThrow()
  })

  it('throws "Invalid quantity" error if first item is valid but second item is invalid', () => {
    const order = { items: [{ quantity: 5 }, { quantity: 0 }] }
    expect(() => validateOrder(order)).toThrow(Error)
    expect(() => validateOrder(order)).toThrow("Invalid quantity")
  })

  it('throws "Empty order" error if order.items is null', () => {
    expect(() => validateOrder({ items: null })).toThrow(Error)
    expect(() => validateOrder({ items: null })).toThrow("Empty order")
  })
})
// AI_TEST_AGENT_END function=validateOrder

// AI_TEST_AGENT_START function=processOrder
describe('processOrder', () => {
  it('processes a valid order successfully', () => {
    const order = { items: [{ price: 10, quantity: 2 }, { price: 5, quantity: 1 }] }
    const db = { saveOrder: jest.fn().mockReturnValue('savedOrder') }
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', id: 'pay123' }) }
    const result = processOrder(order, db, gateway)
    expect(gateway.charge).toHaveBeenCalledWith(23.6)
    expect(db.saveOrder).toHaveBeenCalledWith({ items: order.items, total: 23.6, paymentId: 'pay123' })
    expect(result).toBe('savedOrder')
  })

  it('throws error when order has empty items', () => {
    const order = { items: [] }
    const db = { saveOrder: jest.fn() }
    const gateway = { charge: jest.fn() }
    expect(() => processOrder(order, db, gateway)).toThrow('Empty order')
    expect(db.saveOrder).not.toHaveBeenCalled()
    expect(gateway.charge).not.toHaveBeenCalled()
  })

  it('throws error when payment fails', () => {
    const order = { items: [{ price: 10, quantity: 1 }] }
    const db = { saveOrder: jest.fn() }
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'failed', id: 'pay123' }) }
    expect(() => processOrder(order, db, gateway)).toThrow('Payment failed')
    expect(db.saveOrder).not.toHaveBeenCalled()
    expect(gateway.charge).toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=processOrder
