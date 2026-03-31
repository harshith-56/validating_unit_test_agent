from backend.catd import process_order
from backend.catd import validate_order
from unittest.mock import MagicMock
from unittest.mock import MagicMock, patch
import pytest

# AI_TEST_AGENT_START function=validate_order
def test_validate_order_empty_items_raises_value_error():
    order = MagicMock()
    order.get.return_value = []
    with pytest.raises(ValueError) as excinfo:
        validate_order(order)
    assert str(excinfo.value) == "Empty order"
    order.get.assert_called_once_with("items")

def test_validate_order_items_none_raises_value_error():
    order = MagicMock()
    order.get.return_value = None
    with pytest.raises(ValueError) as excinfo:
        validate_order(order)
    assert str(excinfo.value) == "Empty order"
    order.get.assert_called_once_with("items")

def test_validate_order_item_with_zero_quantity_raises_value_error():
    order = MagicMock()
    item = MagicMock()
    type(item).__getitem__ = lambda self, key: 0 if key == "quantity" else None
    order.get.return_value = [item]
    order.__getitem__.side_effect = lambda key: [item] if key == "items" else None
    with pytest.raises(ValueError) as excinfo:
        validate_order(order)
    assert str(excinfo.value) == "Invalid quantity"
    order.get.assert_called_once_with("items")
    order.__getitem__.assert_called_with("items")

def test_validate_order_item_with_negative_quantity_raises_value_error():
    order = MagicMock()
    item = MagicMock()
    type(item).__getitem__ = lambda self, key: -1 if key == "quantity" else None
    order.get.return_value = [item]
    order.__getitem__.side_effect = lambda key: [item] if key == "items" else None
    with pytest.raises(ValueError) as excinfo:
        validate_order(order)
    assert str(excinfo.value) == "Invalid quantity"
    order.get.assert_called_once_with("items")
    order.__getitem__.assert_called_with("items")

def test_validate_order_single_valid_item_passes():
    order = MagicMock()
    item = MagicMock()
    type(item).__getitem__ = lambda self, key: 1 if key == "quantity" else None
    order.get.return_value = [item]
    order.__getitem__.side_effect = lambda key: [item] if key == "items" else None
    validate_order(order)
    order.get.assert_called_once_with("items")
    order.__getitem__.assert_called_with("items")

def test_validate_order_multiple_valid_items_passes():
    order = MagicMock()
    item1 = MagicMock()
    item2 = MagicMock()
    type(item1).__getitem__ = lambda self, key: 2 if key == "quantity" else None
    type(item2).__getitem__ = lambda self, key: 3 if key == "quantity" else None
    order.get.return_value = [item1, item2]
    order.__getitem__.side_effect = lambda key: [item1, item2] if key == "items" else None
    validate_order(order)
    order.get.assert_called_once_with("items")
    order.__getitem__.assert_called_with("items")

def test_validate_order_multiple_items_with_one_invalid_quantity_raises_value_error():
    order = MagicMock()
    item1 = MagicMock()
    item2 = MagicMock()
    type(item1).__getitem__ = lambda self, key: 1 if key == "quantity" else None
    type(item2).__getitem__ = lambda self, key: 0 if key == "quantity" else None
    order.get.return_value = [item1, item2]
    order.__getitem__.side_effect = lambda key: [item1, item2] if key == "items" else None
    with pytest.raises(ValueError) as excinfo:
        validate_order(order)
    assert str(excinfo.value) == "Invalid quantity"
    order.get.assert_called_once_with("items")
    order.__getitem__.assert_called_with("items")
# AI_TEST_AGENT_END function=validate_order

# AI_TEST_AGENT_START function=process_order
def test_process_order_success():
    order = {"items": [{"price": 10, "quantity": 2}, {"price": 5, "quantity": 1}]}
    db = MagicMock()
    db.save_order.return_value = {"order_id": 123}
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "success", "id": "pay_456"}

    result = process_order(order, db, payment_gateway)

    assert result == {"order_id": 123}
    payment_gateway.charge.assert_called_once_with(10 * 2 + 5 * 1 + round((10 * 2 + 5 * 1) * 0.18, 2))
    db.save_order.assert_called_once_with({
        "items": order["items"],
        "total": 10 * 2 + 5 * 1 + round((10 * 2 + 5 * 1) * 0.18, 2),
        "payment_id": "pay_456"
    })


def test_process_order_payment_failure_raises_runtime_error():
    order = {"items": [{"price": 20, "quantity": 1}]}
    db = MagicMock()
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "failed", "id": "pay_789"}

    with pytest.raises(RuntimeError) as excinfo:
        process_order(order, db, payment_gateway)
    assert str(excinfo.value) == "Payment failed"
    payment_gateway.charge.assert_called_once()
    db.save_order.assert_not_called()


def test_process_order_empty_items_raises_value_error():
    order = {"items": []}
    db = MagicMock()
    payment_gateway = MagicMock()

    with pytest.raises(ValueError) as excinfo:
        process_order(order, db, payment_gateway)
    assert str(excinfo.value) == "Empty order"
    payment_gateway.charge.assert_not_called()
    db.save_order.assert_not_called()
# AI_TEST_AGENT_END function=process_order
