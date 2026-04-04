from backend.catd import validate_order
from unittest.mock import MagicMock, patch
import pytest

# AI_TEST_AGENT_START function=validate_order
def test_validate_order_raises_value_error_on_empty_items():
    order_mock = MagicMock()
    order_mock.get.return_value = []
    with patch('backend.catd.validate_order.__globals__', {'order': order_mock}):
        with pytest.raises(ValueError) as excinfo:
            validate_order(order_mock)
        assert str(excinfo.value) == "Empty order"
    order_mock.get.assert_called_once_with("items")

def test_validate_order_raises_value_error_on_zero_quantity():
    order_mock = MagicMock()
    item_mock = MagicMock()
    item_mock.__getitem__.side_effect = lambda key: 0 if key == "quantity" else None
    order_mock.get.return_value = [item_mock]
    order_mock.__getitem__.side_effect = lambda key: [item_mock] if key == "items" else None
    with patch('backend.catd.validate_order.__globals__', {'order': order_mock}):
        with pytest.raises(ValueError) as excinfo:
            validate_order(order_mock)
        assert str(excinfo.value) == "Invalid quantity"
    order_mock.get.assert_called_once_with("items")
    item_mock.__getitem__.assert_called_with("quantity")

def test_validate_order_raises_value_error_on_negative_quantity():
    order_mock = MagicMock()
    item_mock = MagicMock()
    item_mock.__getitem__.side_effect = lambda key: -1 if key == "quantity" else None
    order_mock.get.return_value = [item_mock]
    order_mock.__getitem__.side_effect = lambda key: [item_mock] if key == "items" else None
    with patch('backend.catd.validate_order.__globals__', {'order': order_mock}):
        with pytest.raises(ValueError) as excinfo:
            validate_order(order_mock)
        assert str(excinfo.value) == "Invalid quantity"
    order_mock.get.assert_called_once_with("items")
    item_mock.__getitem__.assert_called_with("quantity")

def test_validate_order_passes_with_valid_single_item():
    order_mock = MagicMock()
    item_mock = MagicMock()
    item_mock.__getitem__.side_effect = lambda key: 1 if key == "quantity" else None
    order_mock.get.return_value = [item_mock]
    order_mock.__getitem__.side_effect = lambda key: [item_mock] if key == "items" else None
    with patch('backend.catd.validate_order.__globals__', {'order': order_mock}):
        validate_order(order_mock)
    order_mock.get.assert_called_once_with("items")
    item_mock.__getitem__.assert_called_with("quantity")

def test_validate_order_passes_with_multiple_valid_items():
    order_mock = MagicMock()
    item_mock1 = MagicMock()
    item_mock2 = MagicMock()
    item_mock1.__getitem__.side_effect = lambda key: 2 if key == "quantity" else None
    item_mock2.__getitem__.side_effect = lambda key: 3 if key == "quantity" else None
    order_mock.get.return_value = [item_mock1, item_mock2]
    order_mock.__getitem__.side_effect = lambda key: [item_mock1, item_mock2] if key == "items" else None
    with patch('backend.catd.validate_order.__globals__', {'order': order_mock}):
        validate_order(order_mock)
    order_mock.get.assert_called_once_with("items")
    item_mock1.__getitem__.assert_called_with("quantity")
    item_mock2.__getitem__.assert_called_with("quantity")

def test_validate_order_raises_value_error_on_first_invalid_quantity_among_multiple_items():
    order_mock = MagicMock()
    item_mock1 = MagicMock()
    item_mock2 = MagicMock()
    item_mock1.__getitem__.side_effect = lambda key: 0 if key == "quantity" else None
    item_mock2.__getitem__.side_effect = lambda key: 5 if key == "quantity" else None
    order_mock.get.return_value = [item_mock1, item_mock2]
    order_mock.__getitem__.side_effect = lambda key: [item_mock1, item_mock2] if key == "items" else None
    with patch('backend.catd.validate_order.__globals__', {'order': order_mock}):
        with pytest.raises(ValueError) as excinfo:
            validate_order(order_mock)
        assert str(excinfo.value) == "Invalid quantity"
    order_mock.get.assert_called_once_with("items")
    item_mock1.__getitem__.assert_called_with("quantity")

def test_validate_order_raises_value_error_when_items_key_missing_returns_none():
    order_mock = MagicMock()
    order_mock.get.return_value = None
    with patch('backend.catd.validate_order.__globals__', {'order': order_mock}):
        with pytest.raises(ValueError) as excinfo:
            validate_order(order_mock)
        assert str(excinfo.value) == "Empty order"
    order_mock.get.assert_called_once_with("items")

def test_validate_order_raises_type_error_when_quantity_is_not_comparable():
    order_mock = MagicMock()
    item_mock = MagicMock()
    item_mock.__getitem__.side_effect = lambda key: "not_a_number" if key == "quantity" else None
    order_mock.get.return_value = [item_mock]
    order_mock.__getitem__.side_effect = lambda key: [item_mock] if key == "items" else None
    with patch('backend.catd.validate_order.__globals__', {'order': order_mock}):
        with pytest.raises(TypeError):
            validate_order(order_mock)
    order_mock.get.assert_called_once_with("items")
    item_mock.__getitem__.assert_called_with("quantity")
# AI_TEST_AGENT_END function=validate_order
