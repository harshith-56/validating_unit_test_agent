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

  it('throws "Invalid quantity" error if any item has quantity 0', () => {
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

  it('does not throw if order has items with all positive quantities', () => {
    const order = { items: [{ quantity: 1 }, { quantity: 10 }] }
    expect(() => validateOrder(order)).not.toThrow()
  })

  it('throws "Empty order" error if order.items is null', () => {
    const order = { items: null }
    const call = () => validateOrder(order)
    expect(call).toThrow('Empty order')
  })

  it('throws "Invalid quantity" error if quantity is a negative float', () => {
    const order = { items: [{ quantity: -0.1 }] }
    const call = () => validateOrder(order)
    expect(call).toThrow('Invalid quantity')
  })

  it('does not throw if quantity is a positive float', () => {
    const order = { items: [{ quantity: 0.0001 }] }
    expect(() => validateOrder(order)).not.toThrow()
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
        { price: 5, quantity: 1 },
      ],
    }
    const db = { saveOrder: jest.fn().mockReturnValue('savedOrder') }
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', id: 'pay123' }) }

    const result = processOrder(order, db, gateway)

    expect(validateOrder).toHaveBeenCalledWith(order)
    expect(calculateTax).toHaveBeenCalledWith(25)
    expect(gateway.charge).toHaveBeenCalledWith(25 + calculateTax(25))
    expect(db.saveOrder).toHaveBeenCalledWith({
      items: order.items,
      total: 25 + calculateTax(25),
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

  it('throws error when payment fails', () => {
    const order = { items: [{ price: 10, quantity: 1 }] }
    const db = { saveOrder: jest.fn() }
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'failed', id: 'pay123' }) }

    const call = () => processOrder(order, db, gateway)

    expect(validateOrder).toHaveBeenCalledWith(order)
    expect(gateway.charge).toHaveBeenCalled()
    expect(call).toThrow('Payment failed')
    expect(db.saveOrder).not.toHaveBeenCalled()
  })

  it('calculates tax correctly for subtotal zero', () => {
    const order = { items: [{ price: 0, quantity: 10 }] }
    const db = { saveOrder: jest.fn().mockReturnValue('savedOrder') }
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', id: 'pay123' }) }

    const result = processOrder(order, db, gateway)

    expect(validateOrder).toHaveBeenCalledWith(order)
    expect(calculateTax).toHaveBeenCalledWith(0)
    expect(gateway.charge).toHaveBeenCalledWith(0)
    expect(db.saveOrder).toHaveBeenCalledWith({
      items: order.items,
      total: 0,
      paymentId: 'pay123',
    })
    expect(result).toBe('savedOrder')
  })

  it('throws error when order is null', () => {
    const order = null
    const db = { saveOrder: jest.fn() }
    const gateway = { charge: jest.fn() }

    const call = () => processOrder(order, db, gateway)

    expect(call).toThrow()
    expect(validateOrder).not.toHaveBeenCalled()
    expect(gateway.charge).not.toHaveBeenCalled()
    expect(db.saveOrder).not.toHaveBeenCalled()
  })

  it('throws error when items is missing in order', () => {
    const order = {}
    const db = { saveOrder: jest.fn() }
    const gateway = { charge: jest.fn() }

    const call = () => processOrder(order, db, gateway)

    expect(call).toThrow('Empty order')
    expect(validateOrder).toHaveBeenCalledWith(order)
    expect(gateway.charge).not.toHaveBeenCalled()
    expect(db.saveOrder).not.toHaveBeenCalled()
  })

  it('throws error when item quantity is negative', () => {
    const order = { items: [{ price: 10, quantity: -1 }] }
    const db = { saveOrder: jest.fn() }
    const gateway = { charge: jest.fn() }

    const call = () => processOrder(order, db, gateway)

    expect(call).toThrow('Invalid quantity')
    expect(validateOrder).toHaveBeenCalledWith(order)
    expect(gateway.charge).not.toHaveBeenCalled()
    expect(db.saveOrder).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=processOrder
