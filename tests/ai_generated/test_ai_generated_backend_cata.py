from backend.cata import calculate_final_price
from backend.cata import password_strength
import pytest

# AI_TEST_AGENT_START function=calculate_final_price
def test_calculate_final_price_happy_path():
    result = calculate_final_price(100.0, 0.2, 0.1)
    assert result == 108.0

def test_calculate_final_price_invalid_price():
    with pytest.raises(ValueError) as excinfo:
        calculate_final_price(-1.0, 0.1, 0.1)
    assert str(excinfo.value) == "Invalid price"

def test_calculate_final_price_edge_case_zero_tax_discount():
    result = calculate_final_price(50.0, 0.0, 0.0)
    assert result == 50.0
# AI_TEST_AGENT_END function=calculate_final_price

# AI_TEST_AGENT_START function=password_strength
def test_password_strength_strong():
    result = password_strength("Abcdef1!")
    assert result == "strong"

def test_password_strength_invalid_type():
    result = password_strength("")
    assert result == "weak"

def test_password_strength_boundary_medium():
    result = password_strength("abcdefgh")
    assert result == "medium"
# AI_TEST_AGENT_END function=password_strength
