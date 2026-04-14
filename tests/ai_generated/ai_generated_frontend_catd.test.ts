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

  it('throws "Invalid quantity" error if item quantity is not a number but less or equal to 0 coerced', () => {
    const order = { items: [{ quantity: '0' }] }
    const call = () => validateOrder(order)
    expect(call).toThrow('Invalid quantity')
  })
})
// AI_TEST_AGENT_END function=validateOrder
