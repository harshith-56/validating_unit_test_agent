def calculate_final_price(price: float, tax_rate: float, discount: float) -> float:
    if price < 0:
        raise ValueError("Invalid price")

    if not (0 <= tax_rate <= 1):
        raise ValueError("Invalid tax rate")

    if not (0 <= discount <= 1):
        raise ValueError("Invalid discount")

    discounted_price = price * (1 - discount)
    final_price = discounted_price * (1 + tax_rate)

    return round(final_price, 2)


import re

def password_strength(password: str) -> str:
    if len(password) < 8:
        return "weak"
    score = 0
    if re.search(r"[A-Z]", password):
        score += 1
    if re.search(r"[a-z]", password):
        score += 1
    if re.search(r"\d", password):
        score += 1
    if re.search(r"[!@#$%^&*]", password):
        score += 1

    if score <= 2:
        return "medium"
    return "strong"

def normalize_user_payload(payload: dict) -> dict:
    return {
        "id": int(payload["id"]),
        "name": payload["name"].strip().title(),
        "email": payload["email"].lower(),
        "is_active": payload.get("is_active", True),
    }