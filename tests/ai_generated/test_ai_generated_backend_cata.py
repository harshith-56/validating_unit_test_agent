from backend.cata import calculate_final_price
from backend.cata import normalize_user_payload
from backend.cata import password_strength
from unittest.mock import MagicMock
import pytest

# AI_TEST_AGENT_START function=calculate_final_price
def test_calculate_final_price_valid_inputs():
    result = calculate_final_price(100.0, 0.2, 0.1)
    assert result == 108.0

def test_calculate_final_price_invalid_price():
    with pytest.raises(ValueError) as excinfo:
        calculate_final_price(-10.0, 0.1, 0.1)
    assert str(excinfo.value) == "Invalid price"

def test_calculate_final_price_edge_case_zero_discount_and_tax():
    result = calculate_final_price(50.0, 0.0, 0.0)
    assert result == 50.0
# AI_TEST_AGENT_END function=calculate_final_price

# AI_TEST_AGENT_START function=password_strength
def test_password_strength_strong():
    result = password_strength("Abcdef1!")
    assert result == "strong"

def test_password_strength_weak_short_password():
    result = password_strength("Ab1!")
    assert result == "weak"

def test_password_strength_medium_two_criteria():
    result = password_strength("abcdefg1")
    assert result == "medium"
# AI_TEST_AGENT_END function=password_strength

# AI_TEST_AGENT_START function=normalize_user_payload
def test_normalize_user_payload_happy_path():
    payload = MagicMock()
    payload.__getitem__.side_effect = lambda k: {"id": "123", "name": " john doe ", "email": "JOHN@EXAMPLE.COM"}[k]
    payload.get.return_value = True
    result = normalize_user_payload(payload)
    assert result == {"id": 123, "name": "John Doe", "email": "john@example.com", "is_active": True}

def test_normalize_user_payload_missing_is_active_defaults_true():
    payload = MagicMock()
    payload.__getitem__.side_effect = lambda k: {"id": "0", "name": " alice ", "email": "ALICE@EXAMPLE.COM"}[k]
    payload.get.return_value = None
    result = normalize_user_payload(payload)
    assert result["is_active"] is True

def test_normalize_user_payload_invalid_id_raises_value_error():
    payload = MagicMock()
    payload.__getitem__.side_effect = lambda k: {"id": "abc", "name": "bob", "email": "bob@example.com"}[k]
    payload.get.return_value = True
    with pytest.raises(ValueError):
        normalize_user_payload(payload)
# AI_TEST_AGENT_END function=normalize_user_payload
