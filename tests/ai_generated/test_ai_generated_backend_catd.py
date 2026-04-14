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


def test_process_order_single_item_edge_case_quantity_one():
    order = {
        "items": [
            {"price": 0.01, "quantity": 1}
        ]
    }
    db = MagicMock()
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "success", "id": "pay_789"}
    db.save_order.return_value = {"order_id": "order_789"}

    result = process_order(order, db, payment_gateway)

    expected_subtotal = 0.01 * 1
    expected_tax = round(expected_subtotal * 0.18, 2)
    expected_total = expected_subtotal + expected_tax

    payment_gateway.charge.assert_called_once_with(expected_total)
    db.save_order.assert_called_once_with({
        "items": order["items"],
        "total": expected_total,
        "payment_id": "pay_789"
    })
    assert result == {"order_id": "order_789"}


def test_process_order_multiple_items_with_varied_quantities_and_prices():
    order = {
        "items": [
            {"price": 100.0, "quantity": 3},
            {"price": 0.0, "quantity": 5},
            {"price": 50.5, "quantity": 2}
        ]
    }
    db = MagicMock()
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "success", "id": "pay_999"}
    db.save_order.return_value = {"order_id": "order_999"}

    result = process_order(order, db, payment_gateway)

    expected_subtotal = 100.0 * 3 + 0.0 * 5 + 50.5 * 2
    expected_tax = round(expected_subtotal * 0.18, 2)
    expected_total = expected_subtotal + expected_tax

    payment_gateway.charge.assert_called_once_with(expected_total)
    db.save_order.assert_called_once_with({
        "items": order["items"],
        "total": expected_total,
        "payment_id": "pay_999"
    })
    assert result == {"order_id": "order_999"}


def test_process_order_order_missing_items_key_raises_value_error():
    order = {}
    db = MagicMock()
    payment_gateway = MagicMock()

    with pytest.raises(ValueError, match="Empty order"):
        process_order(order, db, payment_gateway)

    payment_gateway.charge.assert_not_called()
    db.save_order.assert_not_called()
# AI_TEST_AGENT_END function=process_order
