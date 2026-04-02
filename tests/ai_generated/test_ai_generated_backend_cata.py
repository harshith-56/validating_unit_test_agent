from backend.cata import calculate_final_price
from backend.cata import normalize_user_payload
import pytest

# AI_TEST_AGENT_START function=calculate_final_price
def test_calculate_final_price_valid_inputs():
    result = calculate_final_price(100.0, 0.2, 0.1)
    assert result == 108.0

def test_calculate_final_price_zero_discount_and_tax():
    result = calculate_final_price(50.0, 0.0, 0.0)
    assert result == 50.0

def test_calculate_final_price_max_discount_no_tax():
    result = calculate_final_price(200.0, 0.0, 1.0)
    assert result == 0.0

def test_calculate_final_price_price_negative_raises():
    with pytest.raises(ValueError, match="Invalid price"):
        calculate_final_price(-1.0, 0.1, 0.1)

def test_calculate_final_price_tax_rate_below_zero_raises():
    with pytest.raises(ValueError, match="Invalid tax rate"):
        calculate_final_price(100.0, -0.01, 0.1)

def test_calculate_final_price_tax_rate_above_one_raises():
    with pytest.raises(ValueError, match="Invalid tax rate"):
        calculate_final_price(100.0, 1.01, 0.1)

def test_calculate_final_price_discount_below_zero_raises():
    with pytest.raises(ValueError, match="Invalid discount"):
        calculate_final_price(100.0, 0.1, -0.01)

def test_calculate_final_price_discount_above_one_raises():
    with pytest.raises(ValueError, match="Invalid discount"):
        calculate_final_price(100.0, 0.1, 1.01)

def test_calculate_final_price_rounding_behavior():
    result = calculate_final_price(99.99, 0.075, 0.15)
    expected = round((99.99 * (1 - 0.15)) * (1 + 0.075), 2)
    assert result == expected
# AI_TEST_AGENT_END function=calculate_final_price

# AI_TEST_AGENT_START function=normalize_user_payload
def test_normalize_user_payload_all_fields_present_and_valid():
    payload = {
        "id": "123",
        "name": "  john doe  ",
        "email": "JOHN@EXAMPLE.COM",
        "is_active": False
    }
    result = normalize_user_payload(payload)
    assert result["id"] == 123
    assert result["name"] == "John Doe"
    assert result["email"] == "john@example.com"
    assert result["is_active"] is False

def test_normalize_user_payload_is_active_missing_defaults_to_true():
    payload = {
        "id": "1",
        "name": "alice",
        "email": "ALICE@EXAMPLE.COM"
    }
    result = normalize_user_payload(payload)
    assert result["id"] == 1
    assert result["name"] == "Alice"
    assert result["email"] == "alice@example.com"
    assert result["is_active"] is True

def test_normalize_user_payload_id_not_convertible_to_int_raises_valueerror():
    payload = {
        "id": "abc",
        "name": "bob",
        "email": "bob@example.com",
        "is_active": True
    }
    with pytest.raises(ValueError):
        normalize_user_payload(payload)

def test_normalize_user_payload_name_empty_string_results_in_empty_name():
    payload = {
        "id": "10",
        "name": "   ",
        "email": "emptyname@example.com",
        "is_active": True
    }
    result = normalize_user_payload(payload)
    assert result["id"] == 10
    assert result["name"] == ""
    assert result["email"] == "emptyname@example.com"
    assert result["is_active"] is True

def test_normalize_user_payload_email_already_lowercase_remains_unchanged():
    payload = {
        "id": "5",
        "name": "Charlie",
        "email": "charlie@example.com",
        "is_active": False
    }
    result = normalize_user_payload(payload)
    assert result["id"] == 5
    assert result["name"] == "Charlie"
    assert result["email"] == "charlie@example.com"
    assert result["is_active"] is False

def test_normalize_user_payload_missing_required_field_id_raises_keyerror():
    payload = {
        "name": "Diana",
        "email": "diana@example.com",
        "is_active": True
    }
    with pytest.raises(KeyError):
        normalize_user_payload(payload)

def test_normalize_user_payload_missing_required_field_name_raises_keyerror():
    payload = {
        "id": "7",
        "email": "eve@example.com",
        "is_active": True
    }
    with pytest.raises(KeyError):
        normalize_user_payload(payload)

def test_normalize_user_payload_missing_required_field_email_raises_keyerror():
    payload = {
        "id": "8",
        "name": "Frank",
        "is_active": True
    }
    with pytest.raises(KeyError):
        normalize_user_payload(payload)

def test_normalize_user_payload_is_active_none_value_is_preserved():
    payload = {
        "id": "9",
        "name": "Grace",
        "email": "grace@example.com",
        "is_active": None
    }
    result = normalize_user_payload(payload)
    assert result["id"] == 9
    assert result["name"] == "Grace"
    assert result["email"] == "grace@example.com"
    assert result["is_active"] is None
# AI_TEST_AGENT_END function=normalize_user_payload
