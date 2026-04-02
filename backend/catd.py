
#function
def validate_order(order):
    if not order.get("items"):
        raise ValueError("Empty order")

    for item in order["items"]:
        if item["quantity"] <= 0:
            raise ValueError("Invalid quantity")


def calculate_tax(amount):
    return round(amount * 0.18, 2)


def process_order(order, db, payment_gateway):
    validate_order(order)

    subtotal = sum(item["price"] * item["quantity"] for item in order["items"])
    tax = calculate_tax(subtotal)
    total = subtotal + tax

    payment = payment_gateway.charge(total)
    if payment["status"] != "success":
        raise RuntimeError("Payment failed")

    saved = db.save_order({
        "items": order["items"],
        "total": total,
        "payment_id": payment["id"]
    })

    return saved


