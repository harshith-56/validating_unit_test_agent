export function createUser(payload: any, db: any) {
  const existing = db.findUserByEmail(payload?.email);

  if (existing) throw new Error("User already exists");

  if (!payload?.password || payload.password.length < 8) {
    throw new Error("Weak password");
  }

  const user = {
    email: payload.email,
    name: payload.name,
  };

  return db.insertUser(user);
}

export function processPayment(amount: number, gateway: any) {
  if (amount <= 0) throw new Error("Invalid amount");

  const res = gateway.charge(amount);

  if (!res || res.status !== "success") {
    throw new Error("Payment failed");
  }

  return res.transactionId;
}

export async function fetchActiveUsers(client: any, retries = 2) {
  let lastError;

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await client.get("/users");
      const users = res.data || [];

      return users.filter((u: any) => u?.is_active && u?.email);
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(`Failed after retries: ${lastError}`);
}

export function processOrder(order: any, inventory: any, pricing: any) {
  if (!order?.items || !Array.isArray(order.items)) {
    throw new Error("Invalid order");
  }

  let total = 0;

  for (const item of order.items) {
    const stock = inventory.checkStock(item.product_id);

    if (stock < item.quantity) {
      throw new Error(`Out of stock: ${item.product_id}`);
    }

    const price = pricing.getPrice(item.product_id);
    total += price * item.quantity;
  }

  return {
    orderId: order.id,
    total: Math.round(total * 100) / 100,
  };
}