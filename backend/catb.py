
# function
from typing import Dict

def create_user(payload: Dict, db):
    existing = db.find_user_by_email(payload["email"])
    if existing:
        raise ValueError("User already exists")

    if len(payload["password"]) < 8:
        raise ValueError("Weak password")

    user = {
        "email": payload["email"],
        "name": payload["name"]
    }

    return db.insert_user(user)


#function

def process_payment(amount: float, gateway):
    if amount <= 0:
        raise ValueError("Invalid amount")

    response = gateway.charge(amount)

    if response["status"] != "success":
        raise RuntimeError("Payment failed")

    return response["transaction_id"]



#function
from typing import Dict, List

def fetch_active_users(client, retries: int = 2) -> List[Dict]:
    last_error = None

    for _ in range(retries + 1):
        try:
            response = client.get("/users")
            users = response.json()

            return [
                u for u in users
                if u.get("is_active") and u.get("email")
            ]

        except Exception as e:
            last_error = e

    raise RuntimeError(f"Failed after retries: {last_error}")



#function
def process_order(order, inventory_service, pricing_service):
    total = 0

    for item in order["items"]:
        stock = inventory_service.check_stock(item["product_id"])

        if stock < item["quantity"]:
            raise ValueError(f"Out of stock: {item['product_id']}")

        price = pricing_service.get_price(item["product_id"])
        total += price * item["quantity"]

    return {
        "order_id": order["id"],
        "total": round(total, 2)
    }
