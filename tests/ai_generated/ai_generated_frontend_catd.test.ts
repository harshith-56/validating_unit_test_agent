import { processOrder } from '../../frontend/catd'
import { validateOrder } from '../../frontend/catd'

// AI_TEST_AGENT_START function=validateOrder
describe('validateOrder', () => {
  it('throws "Empty order" error if order.items is undefined', () => {
    const order = {}
    const call = () => validateOrder(order)
    expect(call).toThrow(Error)
    expect(call).toThrow('Empty order')
  })

  it('throws "Empty order" error if order.items is an empty array', () => {
    const order = { items: [] }
    const call = () => validateOrder(order)
    expect(call).toThrow(Error)
    expect(call).toThrow('Empty order')
  })

  it('throws "Invalid quantity" error if any item has quantity zero', () => {
    const order = { items: [{ quantity: 0 }] }
    const call = () => validateOrder(order)
    expect(call).toThrow(Error)
    expect(call).toThrow('Invalid quantity')
  })

  it('throws "Invalid quantity" error if any item has negative quantity', () => {
    const order = { items: [{ quantity: -5 }] }
    const call = () => validateOrder(order)
    expect(call).toThrow(Error)
    expect(call).toThrow('Invalid quantity')
  })

  it('throws "Invalid quantity" error if first item is valid but second item has invalid quantity', () => {
    const order = { items: [{ quantity: 1 }, { quantity: 0 }] }
    const call = () => validateOrder(order)
    expect(call).toThrow(Error)
    expect(call).toThrow('Invalid quantity')
  })

  it('does not throw error if all items have positive quantity', () => {
    const order = { items: [{ quantity: 1 }, { quantity: 10 }] }
    expect(() => validateOrder(order)).not.toThrow()
  })

  it('throws "Empty order" error if order.items is null', () => {
    const order = { items: null }
    const call = () => validateOrder(order)
    expect(call).toThrow(Error)
    expect(call).toThrow('Empty order')
  })

  it('throws "Invalid quantity" error if quantity is not a number but less or equal to zero', () => {
    const order = { items: [{ quantity: 0 }, { quantity: '0' as any }] }
    const call = () => validateOrder(order)
    expect(call).toThrow(Error)
    expect(call).toThrow('Invalid quantity')
  })

  it('does not throw error if quantity is a positive number and other fields exist', () => {
    const order = { items: [{ quantity: 5, name: 'item1' }, { quantity: 2, name: 'item2' }] }
    expect(() => validateOrder(order)).not.toThrow()
  })
})
// AI_TEST_AGENT_END function=validateOrder

// AI_TEST_AGENT_START function=processOrder
describe('processOrder', () => {
  it('processes a valid order successfully', () => {
    const order = {
      items: [
        { price: 10, quantity: 2 },
        { price: 5, quantity: 1 },
      ],
    }
    order.items.reduce = jest.fn().mockReturnValue(25)
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'success', id: 'pay_1' }) }
    const db = { saveOrder: jest.fn().mockReturnValue('order_saved') }
    const result = processOrder(order, db, gateway)
    expect(order.items.reduce).toHaveBeenCalled()
    expect(gateway.charge).toHaveBeenCalledWith(29.5)
    expect(db.saveOrder).toHaveBeenCalledWith({
      items: order.items,
      total: 29.5,
      paymentId: 'pay_1',
    })
    expect(result).toBe('order_saved')
  })

  it('throws error when order items is empty', () => {
    const order = { items: [] }
    const gateway = { charge: jest.fn() }
    const db = { saveOrder: jest.fn() }
    const call = () => processOrder(order, db, gateway)
    expect(call).toThrow(Error)
    expect(call).toThrow('Empty order')
  })

  it('throws error when payment status is not success', () => {
    const order = {
      items: [
        { price: 10, quantity: 1 },
      ],
    }
    order.items.reduce = jest.fn().mockReturnValue(10)
    const gateway = { charge: jest.fn().mockReturnValue({ status: 'failed', id: 'pay_2' }) }
    const db = { saveOrder: jest.fn() }
    const call = () => processOrder(order, db, gateway)
    expect(order.items.reduce).toHaveBeenCalled()
    expect(gateway.charge).toHaveBeenCalledWith(11.8)
    expect(call).toThrow(Error)
    expect(call).toThrow('Payment failed')
    expect(db.saveOrder).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=processOrder
