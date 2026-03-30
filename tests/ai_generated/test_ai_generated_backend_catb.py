from backend.catb import fetch_active_users
from backend.catb import process_order
from backend.catb import process_payment
from unittest.mock import MagicMock
import pytest

# AI_TEST_AGENT_START function=process_payment
def test_process_payment_successful_charge():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "success", "transaction_id": "tx123"}
    result = process_payment(100.0, gateway)
    assert result == "tx123"
    gateway.charge.assert_called_once_with(100.0)

def test_process_payment_zero_amount_raises_value_error():
    gateway = MagicMock()
    with pytest.raises(ValueError) as excinfo:
        process_payment(0, gateway)
    assert str(excinfo.value) == "Invalid amount"
    gateway.charge.assert_not_called()

def test_process_payment_negative_amount_raises_value_error():
    gateway = MagicMock()
    with pytest.raises(ValueError) as excinfo:
        process_payment(-50.0, gateway)
    assert str(excinfo.value) == "Invalid amount"
    gateway.charge.assert_not_called()

def test_process_payment_failed_charge_raises_runtime_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "failed", "transaction_id": "tx999"}
    with pytest.raises(RuntimeError) as excinfo:
        process_payment(50.0, gateway)
    assert str(excinfo.value) == "Payment failed"
    gateway.charge.assert_called_once_with(50.0)

def test_process_payment_charge_returns_unexpected_status_raises_runtime_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "error", "transaction_id": "tx000"}
    with pytest.raises(RuntimeError) as excinfo:
        process_payment(10.0, gateway)
    assert str(excinfo.value) == "Payment failed"
    gateway.charge.assert_called_once_with(10.0)

def test_process_payment_charge_response_missing_status_key_raises_runtime_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"transaction_id": "tx111"}
    with pytest.raises(RuntimeError) as excinfo:
        process_payment(20.0, gateway)
    assert str(excinfo.value) == "Payment failed"
    gateway.charge.assert_called_once_with(20.0)

def test_process_payment_charge_response_missing_transaction_id_key_raises_key_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "success"}
    with pytest.raises(KeyError):
        process_payment(30.0, gateway)
    gateway.charge.assert_called_once_with(30.0)
# AI_TEST_AGENT_END function=process_payment

# AI_TEST_AGENT_START function=fetch_active_users
def test_fetch_active_users_returns_only_active_with_email():
    client = MagicMock()
    user1 = {"is_active": True, "email": "a@example.com"}
    user2 = {"is_active": True, "email": ""}
    user3 = {"is_active": False, "email": "b@example.com"}
    user4 = {"is_active": True, "email": "c@example.com"}
    client.get.return_value.json.return_value = [user1, user2, user3, user4]

    result = fetch_active_users(client)

    assert result == [user1, user4]
    client.get.assert_called_once_with("/users")

def test_fetch_active_users_empty_list_when_no_users():
    client = MagicMock()
    client.get.return_value.json.return_value = []

    result = fetch_active_users(client)

    assert result == []
    client.get.assert_called_once_with("/users")

def test_fetch_active_users_raises_after_all_retries_fail():
    client = MagicMock()
    client.get.side_effect = RuntimeError("fail")

    with pytest.raises(RuntimeError) as excinfo:
        fetch_active_users(client, retries=1)

    assert "Failed after retries" in str(excinfo.value)
    assert client.get.call_count == 2

def test_fetch_active_users_retries_and_succeeds_on_second_try():
    client = MagicMock()
    user = {"is_active": True, "email": "x@y.com"}
    client.get.side_effect = [RuntimeError("fail"), MagicMock(json=MagicMock(return_value=[user]))]

    result = fetch_active_users(client, retries=2)

    assert result == [user]
    assert client.get.call_count == 2

def test_fetch_active_users_filters_out_users_missing_email_key():
    client = MagicMock()
    user1 = {"is_active": True}
    user2 = {"is_active": True, "email": "valid@example.com"}
    client.get.return_value.json.return_value = [user1, user2]

    result = fetch_active_users(client)

    assert result == [user2]

def test_fetch_active_users_filters_out_users_with_email_none():
    client = MagicMock()
    user1 = {"is_active": True, "email": None}
    user2 = {"is_active": True, "email": "valid@example.com"}
    client.get.return_value.json.return_value = [user1, user2]

    result = fetch_active_users(client)

    assert result == [user2]

def test_fetch_active_users_filters_out_users_with_is_active_false():
    client = MagicMock()
    user1 = {"is_active": False, "email": "a@b.com"}
    user2 = {"is_active": True, "email": "c@d.com"}
    client.get.return_value.json.return_value = [user1, user2]

    result = fetch_active_users(client)

    assert result == [user2]

def test_fetch_active_users_filters_out_users_with_is_active_none():
    client = MagicMock()
    user1 = {"is_active": None, "email": "a@b.com"}
    user2 = {"is_active": True, "email": "c@d.com"}
    client.get.return_value.json.return_value = [user1, user2]

    result = fetch_active_users(client)

    assert result == [user2]
# AI_TEST_AGENT_END function=fetch_active_users

# AI_TEST_AGENT_START function=process_order
def test_process_order_single_item_sufficient_stock():
    order = {"id": "order1", "items": [{"product_id": "p1", "quantity": 2}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 5
    pricing_service.get_price.return_value = 10.0

    result = process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_called_once_with("p1")
    pricing_service.get_price.assert_called_once_with("p1")
    assert result == {"order_id": "order1", "total": 20.0}

def test_process_order_multiple_items_sufficient_stock():
    order = {"id": "order2", "items": [
        {"product_id": "p1", "quantity": 1},
        {"product_id": "p2", "quantity": 3}
    ]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.side_effect = [10, 5]
    pricing_service.get_price.side_effect = [2.5, 4.0]

    result = process_order(order, inventory_service, pricing_service)

    assert inventory_service.check_stock.call_count == 2
    assert pricing_service.get_price.call_count == 2
    assert result == {"order_id": "order2", "total": 2.5*1 + 4.0*3}

def test_process_order_item_out_of_stock_raises_value_error():
    order = {"id": "order3", "items": [{"product_id": "p1", "quantity": 4}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 2

    with pytest.raises(ValueError) as excinfo:
        process_order(order, inventory_service, pricing_service)
    assert "Out of stock: p1" in str(excinfo.value)
    inventory_service.check_stock.assert_called_once_with("p1")
    pricing_service.get_price.assert_not_called()

def test_process_order_zero_quantity_item():
    order = {"id": "order4", "items": [{"product_id": "p1", "quantity": 0}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 100.0

    result = process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_called_once_with("p1")
    pricing_service.get_price.assert_called_once_with("p1")
    assert result == {"order_id": "order4", "total": 0.0}

def test_process_order_price_with_floating_point_precision():
    order = {"id": "order5", "items": [{"product_id": "p1", "quantity": 3}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 0.3333333

    result = process_order(order, inventory_service, pricing_service)

    expected_total = round(0.3333333 * 3, 2)
    assert result == {"order_id": "order5", "total": expected_total}

def test_process_order_empty_items_list():
    order = {"id": "order6", "items": []}
    inventory_service = MagicMock()
    pricing_service = MagicMock()

    result = process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_not_called()
    pricing_service.get_price.assert_not_called()
    assert result == {"order_id": "order6", "total": 0}

def test_process_order_multiple_items_one_out_of_stock_raises():
    order = {"id": "order7", "items": [
        {"product_id": "p1", "quantity": 1},
        {"product_id": "p2", "quantity": 5}
    ]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.side_effect = [10, 3]

    with pytest.raises(ValueError) as excinfo:
        process_order(order, inventory_service, pricing_service)
    assert "Out of stock: p2" in str(excinfo.value)
    assert inventory_service.check_stock.call_count == 2
    pricing_service.get_price.assert_not_called()

def test_process_order_non_integer_quantity_raises_type_error():
    order = {"id": "order8", "items": [{"product_id": "p1", "quantity": "two"}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 5.0

    with pytest.raises(TypeError):
        process_order(order, inventory_service, pricing_service)
# AI_TEST_AGENT_END function=process_order
