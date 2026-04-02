//function
export function validateOrder(order: any) {
  if (!order.items || order.items.length === 0) {
    throw new Error("Empty order");
  }

  for (const item of order.items) {
    if (item.quantity <= 0) {
      throw new Error("Invalid quantity");
    }
  }
}

export function calculateTax(amount: number) {
  return Math.round(amount * 0.18 * 100) / 100;
}

export function processOrder(order: any, db: any, gateway: any) {
  validateOrder(order);

  const subtotal = order.items.reduce(
    (sum: number, i: any) => sum + i.price * i.quantity,
    0
  );

  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  const payment = gateway.charge(total);
  if (payment.status !== "success") {
    throw new Error("Payment failed");
  }

  return db.saveOrder({
    items: order.items,
    total,
    paymentId: payment.id,
  });
}


