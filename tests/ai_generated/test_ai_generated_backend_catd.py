from backend.catd import process_order
from backend.catd import validate_order
from unittest.mock import MagicMock, patch
import pytest

# AI_TEST_AGENT_START function=validate_order
def test_validate_order_raises_on_empty_items():
    order = {"items": []}
    with pytest.raises(ValueError, match="Empty order"):
        validate_order(order)

def test_validate_order_raises_on_missing_items_key():
    order = {}
    with pytest.raises(ValueError, match="Empty order"):
        validate_order(order)

def test_validate_order_raises_on_zero_quantity():
    order = {"items": [{"quantity": 0}]}
    with pytest.raises(ValueError, match="Invalid quantity"):
        validate_order(order)

def test_validate_order_raises_on_negative_quantity():
    order = {"items": [{"quantity": -1}]}
    with pytest.raises(ValueError, match="Invalid quantity"):
        validate_order(order)

def test_validate_order_passes_on_valid_single_item():
    order = {"items": [{"quantity": 1}]}
    validate_order(order)

def test_validate_order_passes_on_valid_multiple_items():
    order = {"items": [{"quantity": 1}, {"quantity": 5}, {"quantity": 10}]}
    validate_order(order)

def test_validate_order_raises_on_first_invalid_quantity_in_multiple_items():
    order = {"items": [{"quantity": 1}, {"quantity": 0}, {"quantity": 5}]}
    with pytest.raises(ValueError, match="Invalid quantity"):
        validate_order(order)

def test_validate_order_raises_on_non_integer_quantity():
    order = {"items": [{"quantity": "a"}]}
    with pytest.raises(TypeError):
        validate_order(order)

def test_validate_order_raises_on_none_quantity():
    order = {"items": [{"quantity": None}]}
    with pytest.raises(TypeError):
        validate_order(order)
# AI_TEST_AGENT_END function=validate_order

# AI_TEST_AGENT_START function=process_order
def test_process_order_successful_payment_and_save():
    order = {
        "items": [
            {"price": 10.0, "quantity": 2},
            {"price": 5.0, "quantity": 1}
        ]
    }
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "success", "id": "pay_123"}
    db = MagicMock()
    db.save_order.return_value = {"order_id": "order_123"}

    result = process_order(order, db, payment_gateway)

    expected_subtotal = 10.0 * 2 + 5.0 * 1
    expected_tax = round(expected_subtotal * 0.18, 2)
    expected_total = expected_subtotal + expected_tax

    payment_gateway.charge.assert_called_once_with(expected_total)
    db.save_order.assert_called_once_with({
        "items": order["items"],
        "total": expected_total,
        "payment_id": "pay_123"
    })
    assert result == {"order_id": "order_123"}


def test_process_order_payment_failure_raises_runtime_error():
    order = {
        "items": [
            {"price": 20.0, "quantity": 1}
        ]
    }
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "failed", "id": "pay_456"}
    db = MagicMock()

    with pytest.raises(RuntimeError, match="Payment failed"):
        process_order(order, db, payment_gateway)

    payment_gateway.charge.assert_called_once()
    db.save_order.assert_not_called()


def test_process_order_empty_items_raises_value_error():
    order = {
        "items": []
    }
    payment_gateway = MagicMock()
    db = MagicMock()

    with pytest.raises(ValueError, match="Empty order"):
        process_order(order, db, payment_gateway)

    payment_gateway.charge.assert_not_called()
    db.save_order.assert_not_called()


def test_process_order_item_with_zero_quantity_raises_value_error():
    order = {
        "items": [
            {"price": 10.0, "quantity": 0}
        ]
    }
    payment_gateway = MagicMock()
    db = MagicMock()

    with pytest.raises(ValueError, match="Invalid quantity"):
        process_order(order, db, payment_gateway)

    payment_gateway.charge.assert_not_called()
    db.save_order.assert_not_called()


def test_process_order_item_with_negative_quantity_raises_value_error():
    order = {
        "items": [
            {"price": 10.0, "quantity": -1}
        ]
    }
    payment_gateway = MagicMock()
    db = MagicMock()

    with pytest.raises(ValueError, match="Invalid quantity"):
        process_order(order, db, payment_gateway)

    payment_gateway.charge.assert_not_called()
    db.save_order.assert_not_called()


def test_process_order_with_float_prices_and_quantities():
    order = {
        "items": [
            {"price": 9.99, "quantity": 3},
            {"price": 4.50, "quantity": 2}
        ]
    }
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "success", "id": "pay_789"}
    db = MagicMock()
    db.save_order.return_value = {"order_id": "order_789"}

    result = process_order(order, db, payment_gateway)

    expected_subtotal = 9.99 * 3 + 4.50 * 2
    expected_tax = round(expected_subtotal * 0.18, 2)
    expected_total = expected_subtotal + expected_tax

    payment_gateway.charge.assert_called_once_with(expected_total)
    db.save_order.assert_called_once_with({
        "items": order["items"],
        "total": expected_total,
        "payment_id": "pay_789"
    })
    assert result == {"order_id": "order_789"}


def test_process_order_missing_items_key_raises_value_error():
    order = {}
    payment_gateway = MagicMock()
    db = MagicMock()

    with pytest.raises(ValueError, match="Empty order"):
        process_order(order, db, payment_gateway)

    payment_gateway.charge.assert_not_called()
    db.save_order.assert_not_called()


def test_process_order_items_with_non_numeric_price_raises_type_error():
    order = {
        "items": [
            {"price": "not_a_number", "quantity": 1}
        ]
    }
    payment_gateway = MagicMock()
    db = MagicMock()

    with pytest.raises(TypeError):
        process_order(order, db, payment_gateway)

    payment_gateway.charge.assert_not_called()
    db.save_order.assert_not_called()


def test_process_order_items_with_non_numeric_quantity_raises_type_error():
    order = {
        "items": [
            {"price": 10.0, "quantity": "one"}
        ]
    }
    payment_gateway = MagicMock()
    db = MagicMock()

    with pytest.raises(TypeError):
        process_order(order, db, payment_gateway)

    payment_gateway.charge.assert_not_called()
    db.save_order.assert_not_called()
# AI_TEST_AGENT_END function=process_order
