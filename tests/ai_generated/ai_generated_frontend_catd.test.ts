import { processOrder } from '../../frontend/catd'
import { validateOrder } from '../../frontend/catd'
import { validateOrder, calculateTax } from '../../frontend/catd'

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

  it('throws "Invalid quantity" error if first item is valid but second item has invalid quantity', () => {
    const order = { items: [{ quantity: 1 }, { quantity: 0 }] }
    const call = () => validateOrder(order)
    expect(call).toThrow('Invalid quantity')
  })

  it('does not throw error for valid order with one item with positive quantity', () => {
    const order = { items: [{ quantity: 1 }] }
    expect(() => validateOrder(order)).not.toThrow()
  })

  it('does not throw error for valid order with multiple items with positive quantities', () => {
    const order = { items: [{ quantity: 1 }, { quantity: 10 }, { quantity: 100 }] }
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
jest.mock('../../frontend/catd', () => {
  const originalModule = jest.requireActual('../../frontend/catd')
  return {
    __esModule: true,
    ...originalModule,
    validateOrder: jest.fn(originalModule.validateOrder),
    calculateTax: jest.fn(originalModule.calculateTax),
  }
})


describe('processOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('processes a valid order successfully', () => {
    const order = {
      items: [
        { price: 10, quantity: 2 },
        { price: 5, quantity: 3 },
      ],
    }
    const db = { saveOrder: jest.fn().mockReturnValue('savedOrder') }
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', id: 'pay123' }) }

    const result = processOrder(order, db, gateway)

    expect(validateOrder).toHaveBeenCalledWith(order)
    expect(gateway.charge).toHaveBeenCalledWith(10 * 2 + 5 * 3 + calculateTax(10 * 2 + 5 * 3))
    expect(db.saveOrder).toHaveBeenCalledWith({
      items: order.items,
      total: 10 * 2 + 5 * 3 + calculateTax(10 * 2 + 5 * 3),
      paymentId: 'pay123',
    })
    expect(result).toBe('savedOrder')
  })

  it('throws error when order has empty items array', () => {
    const order = { items: [] }
    const db = { saveOrder: jest.fn() }
    const gateway = { charge: jest.fn() }

    const call = () => processOrder(order, db, gateway)

    expect(call).toThrow('Empty order')
    expect(validateOrder).toHaveBeenCalledWith(order)
    expect(gateway.charge).not.toHaveBeenCalled()
    expect(db.saveOrder).not.toHaveBeenCalled()
  })

  it('throws error when an item has zero quantity', () => {
    const order = { items: [{ price: 10, quantity: 0 }] }
    const db = { saveOrder: jest.fn() }
    const gateway = { charge: jest.fn() }

    const call = () => processOrder(order, db, gateway)

    expect(call).toThrow('Invalid quantity')
    expect(validateOrder).toHaveBeenCalledWith(order)
    expect(gateway.charge).not.toHaveBeenCalled()
    expect(db.saveOrder).not.toHaveBeenCalled()
  })

  it('throws error when payment status is not success', () => {
    const order = { items: [{ price: 20, quantity: 1 }] }
    const db = { saveOrder: jest.fn() }
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'failed', id: 'pay999' }) }

    const call = () => processOrder(order, db, gateway)

    expect(validateOrder).toHaveBeenCalledWith(order)
    expect(gateway.charge).toHaveBeenCalled()
    expect(call).toThrow('Payment failed')
    expect(db.saveOrder).not.toHaveBeenCalled()
  })

  it('calculates tax correctly and includes it in total', () => {
    const order = { items: [{ price: 100, quantity: 1 }] }
    const db = { saveOrder: jest.fn().mockReturnValue('savedOrder') }
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', id: 'pay123' }) }

    const subtotal = 100 * 1
    const expectedTax = calculateTax(subtotal)
    const expectedTotal = subtotal + expectedTax

    processOrder(order, db, gateway)

    expect(gateway.charge).toHaveBeenCalledWith(expectedTotal)
    expect(db.saveOrder).toHaveBeenCalledWith({
      items: order.items,
      total: expectedTotal,
      paymentId: 'pay123',
    })
  })

  it('throws error when order is null', () => {
    const order = null
    const db = { saveOrder: jest.fn() }
    const gateway = { charge: jest.fn() }

    const call = () => processOrder(order, db, gateway)

    expect(call).toThrow()
    expect(validateOrder).toHaveBeenCalledWith(order)
    expect(gateway.charge).not.toHaveBeenCalled()
    expect(db.saveOrder).not.toHaveBeenCalled()
  })

  it('throws error when order.items is missing', () => {
    const order = {}
    const db = { saveOrder: jest.fn() }
    const gateway = { charge: jest.fn() }

    const call = () => processOrder(order, db, gateway)

    expect(call).toThrow('Empty order')
    expect(validateOrder).toHaveBeenCalledWith(order)
    expect(gateway.charge).not.toHaveBeenCalled()
    expect(db.saveOrder).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=processOrder
