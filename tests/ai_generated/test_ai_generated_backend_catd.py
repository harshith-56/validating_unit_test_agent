from backend.catd import process_order
from backend.catd import validate_order
from unittest.mock import MagicMock, patch
import pytest

# AI_TEST_AGENT_START function=validate_order
def test_validate_order_empty_items_raises_value_error():
    order_mock = MagicMock()
    order_mock.get.return_value = []
    with pytest.raises(ValueError) as excinfo:
        validate_order(order_mock)
    assert str(excinfo.value) == "Empty order"
    order_mock.get.assert_called_once_with("items")

def test_validate_order_item_with_zero_quantity_raises_value_error():
    order_mock = MagicMock()
    item_mock = MagicMock()
    item_mock.__getitem__.side_effect = lambda key: 0 if key == "quantity" else None
    order_mock.get.return_value = [item_mock]
    order_mock.__getitem__.side_effect = lambda key: [item_mock] if key == "items" else None
    with pytest.raises(ValueError) as excinfo:
        validate_order(order_mock)
    assert str(excinfo.value) == "Invalid quantity"
    order_mock.get.assert_called_once_with("items")
    order_mock.__getitem__.assert_called_with("items")
    item_mock.__getitem__.assert_called_with("quantity")

def test_validate_order_item_with_negative_quantity_raises_value_error():
    order_mock = MagicMock()
    item_mock = MagicMock()
    item_mock.__getitem__.side_effect = lambda key: -5 if key == "quantity" else None
    order_mock.get.return_value = [item_mock]
    order_mock.__getitem__.side_effect = lambda key: [item_mock] if key == "items" else None
    with pytest.raises(ValueError) as excinfo:
        validate_order(order_mock)
    assert str(excinfo.value) == "Invalid quantity"
    order_mock.get.assert_called_once_with("items")
    order_mock.__getitem__.assert_called_with("items")
    item_mock.__getitem__.assert_called_with("quantity")

def test_validate_order_valid_order_passes_without_exception():
    order_mock = MagicMock()
    item_mock = MagicMock()
    item_mock.__getitem__.side_effect = lambda key: 3 if key == "quantity" else None
    order_mock.get.return_value = [item_mock]
    order_mock.__getitem__.side_effect = lambda key: [item_mock] if key == "items" else None
    validate_order(order_mock)
    order_mock.get.assert_called_once_with("items")
    order_mock.__getitem__.assert_called_with("items")
    item_mock.__getitem__.assert_called_with("quantity")

def test_validate_order_items_key_missing_raises_value_error():
    order_mock = MagicMock()
    order_mock.get.return_value = None
    with pytest.raises(ValueError) as excinfo:
        validate_order(order_mock)
    assert str(excinfo.value) == "Empty order"
    order_mock.get.assert_called_once_with("items")

def test_validate_order_multiple_items_one_invalid_quantity_raises_value_error():
    order_mock = MagicMock()
    item_mock1 = MagicMock()
    item_mock2 = MagicMock()
    item_mock1.__getitem__.side_effect = lambda key: 2 if key == "quantity" else None
    item_mock2.__getitem__.side_effect = lambda key: 0 if key == "quantity" else None
    order_mock.get.return_value = [item_mock1, item_mock2]
    order_mock.__getitem__.side_effect = lambda key: [item_mock1, item_mock2] if key == "items" else None
    with pytest.raises(ValueError) as excinfo:
        validate_order(order_mock)
    assert str(excinfo.value) == "Invalid quantity"
    order_mock.get.assert_called_once_with("items")
    order_mock.__getitem__.assert_called_with("items")
    item_mock1.__getitem__.assert_any_call("quantity")
    item_mock2.__getitem__.assert_any_call("quantity")

def test_validate_order_multiple_items_all_valid_quantities_passes():
    order_mock = MagicMock()
    item_mock1 = MagicMock()
    item_mock2 = MagicMock()
    item_mock1.__getitem__.side_effect = lambda key: 1 if key == "quantity" else None
    item_mock2.__getitem__.side_effect = lambda key: 5 if key == "quantity" else None
    order_mock.get.return_value = [item_mock1, item_mock2]
    order_mock.__getitem__.side_effect = lambda key: [item_mock1, item_mock2] if key == "items" else None
    validate_order(order_mock)
    order_mock.get.assert_called_once_with("items")
    order_mock.__getitem__.assert_called_with("items")
    item_mock1.__getitem__.assert_any_call("quantity")
    item_mock2.__getitem__.assert_any_call("quantity")
# AI_TEST_AGENT_END function=validate_order

# AI_TEST_AGENT_START function=process_order
def test_process_order_happy_path():
    order = {"items": [{"price": 10, "quantity": 2}, {"price": 5, "quantity": 1}]}
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "success", "id": "pay123"}
    db = MagicMock()
    db.save_order.return_value = {"order_id": "order123"}
    result = process_order(order, db, payment_gateway)
    assert result == {"order_id": "order123"}
    payment_gateway.charge.assert_called_once()
    db.save_order.assert_called_once()


def test_process_order_payment_failure():
    order = {"items": [{"price": 10, "quantity": 1}]}
    payment_gateway = MagicMock()
    payment_gateway.charge.return_value = {"status": "failed", "id": "pay123"}
    db = MagicMock()
    with pytest.raises(RuntimeError) as excinfo:
        process_order(order, db, payment_gateway)
    assert str(excinfo.value) == "Payment failed"
    payment_gateway.charge.assert_called_once()
    db.save_order.assert_not_called()


def test_process_order_empty_items_raises_value_error():
    order = {"items": []}
    payment_gateway = MagicMock()
    db = MagicMock()
    with pytest.raises(ValueError) as excinfo:
        process_order(order, db, payment_gateway)
    assert str(excinfo.value) == "Empty order"
    payment_gateway.charge.assert_not_called()
    db.save_order.assert_not_called()
# AI_TEST_AGENT_END function=process_order
