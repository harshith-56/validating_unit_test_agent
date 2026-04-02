from backend.catd import process_order
from unittest.mock import MagicMock, patch
import pytest

# AI_TEST_AGENT_START function=process_order
def test_process_order_successful_payment_and_save():
    order = {
        "items": [
            {"price": 10.0, "quantity": 2},
            {"price": 5.0, "quantity": 1}
        ]
    }
    db = MagicMock()
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "success", "id": "pay_123"}
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
    db = MagicMock()
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "failed", "id": "pay_456"}

    with pytest.raises(RuntimeError, match="Payment failed"):
        process_order(order, db, payment_gateway)

    payment_gateway.charge.assert_called_once()
    db.save_order.assert_not_called()


def test_process_order_empty_items_raises_value_error():
    order = {
        "items": []
    }
    db = MagicMock()
    payment_gateway = MagicMock()

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
    db = MagicMock()
    payment_gateway = MagicMock()

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
    db = MagicMock()
    payment_gateway = MagicMock()

    with pytest.raises(ValueError, match="Invalid quantity"):
        process_order(order, db, payment_gateway)

    payment_gateway.charge.assert_not_called()
    db.save_order.assert_not_called()


def test_process_order_with_single_item_quantity_one():
    order = {
        "items": [
            {"price": 15.0, "quantity": 1}
        ]
    }
    db = MagicMock()
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "success", "id": "pay_789"}
    db.save_order.return_value = {"order_id": "order_789"}

    result = process_order(order, db, payment_gateway)

    expected_subtotal = 15.0 * 1
    expected_tax = round(expected_subtotal * 0.18, 2)
    expected_total = expected_subtotal + expected_tax

    payment_gateway.charge.assert_called_once_with(expected_total)
    db.save_order.assert_called_once_with({
        "items": order["items"],
        "total": expected_total,
        "payment_id": "pay_789"
    })
    assert result == {"order_id": "order_789"}


def test_process_order_with_float_price_and_quantity():
    order = {
        "items": [
            {"price": 9.99, "quantity": 3},
            {"price": 4.50, "quantity": 2}
        ]
    }
    db = MagicMock()
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "success", "id": "pay_321"}
    db.save_order.return_value = {"order_id": "order_321"}

    result = process_order(order, db, payment_gateway)

    expected_subtotal = 9.99 * 3 + 4.50 * 2
    expected_tax = round(expected_subtotal * 0.18, 2)
    expected_total = expected_subtotal + expected_tax

    payment_gateway.charge.assert_called_once_with(expected_total)
    db.save_order.assert_called_once_with({
        "items": order["items"],
        "total": expected_total,
        "payment_id": "pay_321"
    })
    assert result == {"order_id": "order_321"}


def test_process_order_with_missing_items_key_raises_value_error():
    order = {}
    db = MagicMock()
    payment_gateway = MagicMock()

    with pytest.raises(ValueError, match="Empty order"):
        process_order(order, db, payment_gateway)

    payment_gateway.charge.assert_not_called()
    db.save_order.assert_not_called()
# AI_TEST_AGENT_END function=process_order
