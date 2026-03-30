import validateOrder from '../../frontend/catd'

// AI_TEST_AGENT_START function=validateOrder
describe('validateOrder', () => {
  test('throws error when order has no items property', () => {
    expect(() => validateOrder({})).toThrow("Empty order")
  })

  test('throws error when order items array is empty', () => {
    expect(() => validateOrder({ items: [] })).toThrow("Empty order")
  })

  test('throws error when any item has quantity zero', () => {
    const order = { items: [{ quantity: 0 }] }
    expect(() => validateOrder(order)).toThrow("Invalid quantity")
  })

  test('throws error when any item has negative quantity', () => {
    const order = { items: [{ quantity: -5 }] }
    expect(() => validateOrder(order)).toThrow("Invalid quantity")
  })

  test('does not throw error when order has valid items with positive quantities', () => {
    const order = { items: [{ quantity: 1 }, { quantity: 10 }] }
    expect(() => validateOrder(order)).not.toThrow()
  })

  test('throws error when multiple items and one has invalid quantity', () => {
    const order = { items: [{ quantity: 3 }, { quantity: -1 }, { quantity: 2 }] }
    expect(() => validateOrder(order)).toThrow("Invalid quantity")
  })

  test('throws error when items is null', () => {
    expect(() => validateOrder({ items: null })).toThrow("Empty order")
  })
})
// AI_TEST_AGENT_END function=validateOrder
