import { processOrder } from '../../frontend/catd'
import { validateOrder } from '../../frontend/catd'

// AI_TEST_AGENT_START function=validateOrder
describe('validateOrder', () => {
  it('throws "Empty order" error if order.items is undefined', () => {
    const order = {}
    const call = () => validateOrder(order)
    expect(call).toThrow('Empty order')
  })

  it('throws "Empty order" error if order.items is an empty array', () => {
    const order = { items: [] }
    const call = () => validateOrder(order)
    expect(call).toThrow('Empty order')
  })

  it('throws "Invalid quantity" error if any item has quantity zero', () => {
    const order = { items: [{ quantity: 0 }] }
    const call = () => validateOrder(order)
    expect(call).toThrow('Invalid quantity')
  })

  it('throws "Invalid quantity" error if any item has negative quantity', () => {
    const order = { items: [{ quantity: -5 }] }
    const call = () => validateOrder(order)
    expect(call).toThrow('Invalid quantity')
  })

  it('throws "Invalid quantity" error if the first item is valid but second item has invalid quantity', () => {
    const order = { items: [{ quantity: 1 }, { quantity: 0 }] }
    const call = () => validateOrder(order)
    expect(call).toThrow('Invalid quantity')
  })

  it('does not throw error for valid order with one item with positive quantity', () => {
    const order = { items: [{ quantity: 1 }] }
    expect(() => validateOrder(order)).not.toThrow()
  })

  it('does not throw error for valid order with multiple items all having positive quantities', () => {
    const order = { items: [{ quantity: 1 }, { quantity: 2 }, { quantity: 10 }] }
    expect(() => validateOrder(order)).not.toThrow()
  })

  it('throws "Empty order" error if order.items is null', () => {
    const order = { items: null }
    const call = () => validateOrder(order)
    expect(call).toThrow('Empty order')
  })

  it('throws "Invalid quantity" error if item quantity is a negative float', () => {
    const order = { items: [{ quantity: -0.1 }] }
    const call = () => validateOrder(order)
    expect(call).toThrow('Invalid quantity')
  })
})
// AI_TEST_AGENT_END function=validateOrder

// AI_TEST_AGENT_START function=processOrder
describe('processOrder', () => {
  let db: any
  let gateway: any

  beforeEach(() => {
    db = { saveOrder: jest.fn() }
    gateway = { charge: jest.fn() }
  })

  test('processes a valid order successfully', () => {
    const order = {
      items: [
        { price: 10, quantity: 2 },
        { price: 5, quantity: 3 },
      ],
    }
    gateway.charge.mockReturnValue({ status: 'success', id: 'pay123' })
    db.saveOrder.mockReturnValue({ orderId: 'order123' })

    const result = processOrder(order, db, gateway)

    expect(gateway.charge).toHaveBeenCalledTimes(1)
    const chargedAmount = 10 * 2 + 5 * 3
    const expectedTax = Math.round(chargedAmount * 0.18 * 100) / 100
    expect(gateway.charge).toHaveBeenCalledWith(chargedAmount + expectedTax)
    expect(db.saveOrder).toHaveBeenCalledWith({
      items: order.items,
      total: chargedAmount + expectedTax,
      paymentId: 'pay123',
    })
    expect(result).toEqual({ orderId: 'order123' })
  })

  test('throws error when order has empty items array', () => {
    const order = { items: [] }
    const call = () => processOrder(order, db, gateway)
    expect(call).toThrow('Empty order')
    expect(gateway.charge).not.toHaveBeenCalled()
    expect(db.saveOrder).not.toHaveBeenCalled()
  })

  test('throws error when an item has zero quantity', () => {
    const order = {
      items: [
        { price: 10, quantity: 0 },
      ],
    }
    const call = () => processOrder(order, db, gateway)
    expect(call).toThrow('Invalid quantity')
    expect(gateway.charge).not.toHaveBeenCalled()
    expect(db.saveOrder).not.toHaveBeenCalled()
  })

  test('throws error when payment status is not success', () => {
    const order = {
      items: [
        { price: 20, quantity: 1 },
      ],
    }
    gateway.charge.mockReturnValue({ status: 'failed', id: 'pay999' })

    const call = () => processOrder(order, db, gateway)
    expect(call).toThrow('Payment failed')
    expect(gateway.charge).toHaveBeenCalledTimes(1)
    expect(db.saveOrder).not.toHaveBeenCalled()
  })

  test('handles single item order correctly', () => {
    const order = {
      items: [
        { price: 15, quantity: 1 },
      ],
    }
    gateway.charge.mockReturnValue({ status: 'success', id: 'pay001' })
    db.saveOrder.mockReturnValue({ orderId: 'order001' })

    const result = processOrder(order, db, gateway)

    expect(gateway.charge).toHaveBeenCalledWith(15 + Math.round(15 * 0.18 * 100) / 100)
    expect(db.saveOrder).toHaveBeenCalledWith({
      items: order.items,
      total: 15 + Math.round(15 * 0.18 * 100) / 100,
      paymentId: 'pay001',
    })
    expect(result).toEqual({ orderId: 'order001' })
  })

  test('throws error when order is null', () => {
    const call = () => processOrder(null, db, gateway)
    expect(call).toThrow()
    expect(gateway.charge).not.toHaveBeenCalled()
    expect(db.saveOrder).not.toHaveBeenCalled()
  })

  test('throws error when items field is missing', () => {
    const order = {}
    const call = () => processOrder(order, db, gateway)
    expect(call).toThrow('Empty order')
    expect(gateway.charge).not.toHaveBeenCalled()
    expect(db.saveOrder).not.toHaveBeenCalled()
  })

  test('throws error when item quantity is negative', () => {
    const order = {
      items: [
        { price: 10, quantity: -1 },
      ],
    }
    const call = () => processOrder(order, db, gateway)
    expect(call).toThrow('Invalid quantity')
    expect(gateway.charge).not.toHaveBeenCalled()
    expect(db.saveOrder).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=processOrder
