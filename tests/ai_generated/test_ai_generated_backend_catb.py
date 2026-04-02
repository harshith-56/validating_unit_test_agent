from backend.catb import create_user
from backend.catb import fetch_active_users
from backend.catb import process_order
from backend.catb import process_payment
from unittest.mock import MagicMock
import pytest

# AI_TEST_AGENT_START function=create_user
def test_create_user_success_inserts_and_returns_user():
    payload = {"email": "test@example.com", "name": "Test User", "password": "strongpass"}
    db = MagicMock()
    db.find_user_by_email.return_value = None
    db.insert_user.return_value = {"email": "test@example.com", "name": "Test User"}

    result = create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("test@example.com")
    db.insert_user.assert_called_once_with({"email": "test@example.com", "name": "Test User"})
    assert result == {"email": "test@example.com", "name": "Test User"}

def test_create_user_raises_value_error_if_user_exists():
    payload = {"email": "exists@example.com", "name": "Exists User", "password": "strongpass"}
    db = MagicMock()
    db.find_user_by_email.return_value = {"email": "exists@example.com", "name": "Exists User"}

    with pytest.raises(ValueError, match="User already exists"):
        create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("exists@example.com")
    db.insert_user.assert_not_called()

def test_create_user_raises_value_error_for_weak_password():
    payload = {"email": "new@example.com", "name": "New User", "password": "short"}
    db = MagicMock()
    db.find_user_by_email.return_value = None

    with pytest.raises(ValueError, match="Weak password"):
        create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("new@example.com")
    db.insert_user.assert_not_called()

def test_create_user_raises_key_error_if_email_missing():
    payload = {"name": "No Email User", "password": "strongpass"}
    db = MagicMock()

    with pytest.raises(KeyError):
        create_user(payload, db)

    db.find_user_by_email.assert_not_called()
    db.insert_user.assert_not_called()

def test_create_user_raises_key_error_if_password_missing():
    payload = {"email": "nopass@example.com", "name": "No Pass User"}
    db = MagicMock()
    db.find_user_by_email.return_value = None

    with pytest.raises(KeyError):
        create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("nopass@example.com")
    db.insert_user.assert_not_called()

def test_create_user_raises_key_error_if_name_missing():
    payload = {"email": "noname@example.com", "password": "strongpass"}
    db = MagicMock()
    db.find_user_by_email.return_value = None

    with pytest.raises(KeyError):
        create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("noname@example.com")
    db.insert_user.assert_not_called()

def test_create_user_raises_type_error_if_payload_is_none():
    db = MagicMock()

    with pytest.raises(TypeError):
        create_user(None, db)

    db.find_user_by_email.assert_not_called()
    db.insert_user.assert_not_called()

def test_create_user_raises_type_error_if_password_is_not_string():
    payload = {"email": "test2@example.com", "name": "Test2 User", "password": 12345678}
    db = MagicMock()
    db.find_user_by_email.return_value = None

    with pytest.raises(TypeError):
        create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("test2@example.com")
    db.insert_user.assert_not_called()
# AI_TEST_AGENT_END function=create_user

# AI_TEST_AGENT_START function=process_payment
def test_process_payment_successful_charge():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "success", "transaction_id": "tx123"}
    result = process_payment(100.0, gateway)
    assert result == "tx123"
    gateway.charge.assert_called_once_with(100.0)

def test_process_payment_zero_amount_raises_value_error():
    gateway = MagicMock()
    with pytest.raises(ValueError, match="Invalid amount"):
        process_payment(0, gateway)
    gateway.charge.assert_not_called()

def test_process_payment_negative_amount_raises_value_error():
    gateway = MagicMock()
    with pytest.raises(ValueError, match="Invalid amount"):
        process_payment(-50.0, gateway)
    gateway.charge.assert_not_called()

def test_process_payment_failed_charge_raises_runtime_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "failed", "transaction_id": "tx999"}
    with pytest.raises(RuntimeError, match="Payment failed"):
        process_payment(50.0, gateway)
    gateway.charge.assert_called_once_with(50.0)

def test_process_payment_charge_returns_unexpected_status_raises_runtime_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "error", "transaction_id": "tx000"}
    with pytest.raises(RuntimeError, match="Payment failed"):
        process_payment(10.0, gateway)
    gateway.charge.assert_called_once_with(10.0)

def test_process_payment_charge_response_missing_status_key_raises_runtime_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"transaction_id": "tx111"}
    with pytest.raises(RuntimeError, match="Payment failed"):
        process_payment(20.0, gateway)
    gateway.charge.assert_called_once_with(20.0)

def test_process_payment_charge_response_missing_transaction_id_key_raises_key_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "success"}
    with pytest.raises(KeyError):
        process_payment(30.0, gateway)
    gateway.charge.assert_called_once_with(30.0)

def test_process_payment_amount_as_float_edge_value():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "success", "transaction_id": "txEdge"}
    result = process_payment(1e-10, gateway)
    assert result == "txEdge"
    gateway.charge.assert_called_once_with(1e-10)

def test_process_payment_amount_as_non_float_type_raises_type_error():
    gateway = MagicMock()
    with pytest.raises(TypeError):
        process_payment("100", gateway)
    gateway.charge.assert_not_called()
# AI_TEST_AGENT_END function=process_payment

# AI_TEST_AGENT_START function=fetch_active_users
def test_fetch_active_users_returns_only_active_with_email():
    client = MagicMock()
    client.get.return_value.json.return_value = [
        {"is_active": True, "email": "a@example.com"},
        {"is_active": True, "email": ""},
        {"is_active": False, "email": "b@example.com"},
        {"is_active": True, "email": "c@example.com"},
        {"is_active": False, "email": None},
        {"is_active": True, "email": None},
    ]

    result = fetch_active_users(client)

    assert len(result) == 2
    assert all(u.get("is_active") for u in result)
    assert all(u.get("email") for u in result)
    assert result == [
        {"is_active": True, "email": "a@example.com"},
        {"is_active": True, "email": "c@example.com"},
    ]
    client.get.assert_called_once_with("/users")

def test_fetch_active_users_raises_after_all_retries_fail():
    client = MagicMock()
    client.get.side_effect = Exception("Network error")

    with pytest.raises(RuntimeError, match="Failed after retries: Network error"):
        fetch_active_users(client, retries=2)

    assert client.get.call_count == 3

def test_fetch_active_users_returns_empty_list_when_no_users():
    client = MagicMock()
    client.get.return_value.json.return_value = []

    result = fetch_active_users(client)

    assert result == []
    client.get.assert_called_once_with("/users")

def test_fetch_active_users_handles_users_missing_is_active_or_email_keys():
    client = MagicMock()
    client.get.return_value.json.return_value = [
        {"is_active": True, "email": "valid@example.com"},
        {"email": "no_active@example.com"},
        {"is_active": True},
        {},
        {"is_active": False, "email": "inactive@example.com"},
    ]

    result = fetch_active_users(client)

    assert result == [{"is_active": True, "email": "valid@example.com"}]
    client.get.assert_called_once_with("/users")

def test_fetch_active_users_raises_if_response_json_is_malformed():
    client = MagicMock()
    client.get.return_value.json.side_effect = ValueError("Malformed JSON")

    with pytest.raises(RuntimeError, match="Failed after retries: Malformed JSON"):
        fetch_active_users(client, retries=1)

    assert client.get.call_count == 2

def test_fetch_active_users_returns_first_successful_response_even_if_retries_allowed():
    client = MagicMock()
    # First call raises, second call returns valid data
    client.get.side_effect = [Exception("Timeout"), MagicMock(json=MagicMock(return_value=[
        {"is_active": True, "email": "user@example.com"},
        {"is_active": False, "email": "inactive@example.com"},
    ]))]

    result = fetch_active_users(client, retries=2)

    assert result == [{"is_active": True, "email": "user@example.com"}]
    assert client.get.call_count == 2

def test_fetch_active_users_raises_if_client_get_returns_none():
    client = MagicMock()
    client.get.return_value.json.return_value = None

    with pytest.raises(TypeError):
        fetch_active_users(client)

def test_fetch_active_users_raises_if_client_get_returns_non_iterable():
    client = MagicMock()
    client.get.return_value.json.return_value = 12345

    with pytest.raises(TypeError):
        fetch_active_users(client)

def test_fetch_active_users_filters_out_users_with_falsey_email_values():
    client = MagicMock()
    client.get.return_value.json.return_value = [
        {"is_active": True, "email": "valid@example.com"},
        {"is_active": True, "email": ""},
        {"is_active": True, "email": None},
        {"is_active": True, "email": 0},
        {"is_active": True, "email": False},
    ]

    result = fetch_active_users(client)

    assert result == [{"is_active": True, "email": "valid@example.com"}]
    client.get.assert_called_once_with("/users")
# AI_TEST_AGENT_END function=fetch_active_users

# AI_TEST_AGENT_START function=process_order
def test_process_order_single_item_sufficient_stock():
    order = {"id": "order1", "items": [{"product_id": "p1", "quantity": 2}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 5
    pricing_service.get_price.return_value = 10.0

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order1"
    assert result["total"] == pytest.approx(20.0)
    inventory_service.check_stock.assert_called_once_with("p1")
    pricing_service.get_price.assert_called_once_with("p1")

def test_process_order_multiple_items_all_in_stock():
    order = {
        "id": "order2",
        "items": [
            {"product_id": "p1", "quantity": 1},
            {"product_id": "p2", "quantity": 3}
        ]
    }
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.side_effect = [10, 5]
    pricing_service.get_price.side_effect = [2.5, 4.0]

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order2"
    assert result["total"] == pytest.approx(2.5*1 + 4.0*3)
    assert inventory_service.check_stock.call_count == 2
    assert pricing_service.get_price.call_count == 2
    inventory_service.check_stock.assert_any_call("p1")
    inventory_service.check_stock.assert_any_call("p2")
    pricing_service.get_price.assert_any_call("p1")
    pricing_service.get_price.assert_any_call("p2")

def test_process_order_item_out_of_stock_raises_value_error():
    order = {"id": "order3", "items": [{"product_id": "p1", "quantity": 4}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 2

    with pytest.raises(ValueError, match="Out of stock: p1"):
        process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_called_once_with("p1")
    pricing_service.get_price.assert_not_called()

def test_process_order_empty_items_returns_zero_total():
    order = {"id": "order4", "items": []}
    inventory_service = MagicMock()
    pricing_service = MagicMock()

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order4"
    assert result["total"] == 0
    inventory_service.check_stock.assert_not_called()
    pricing_service.get_price.assert_not_called()

def test_process_order_quantity_zero_item():
    order = {"id": "order5", "items": [{"product_id": "p1", "quantity": 0}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 100.0

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order5"
    assert result["total"] == 0
    inventory_service.check_stock.assert_called_once_with("p1")
    pricing_service.get_price.assert_called_once_with("p1")

def test_process_order_negative_quantity_raises_value_error():
    order = {"id": "order6", "items": [{"product_id": "p1", "quantity": -1}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 50.0

    with pytest.raises(ValueError, match="Out of stock: p1"):
        process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_called_once_with("p1")
    pricing_service.get_price.assert_not_called()

def test_process_order_non_integer_quantity_raises_type_error():
    order = {"id": "order7", "items": [{"product_id": "p1", "quantity": "two"}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 20.0

    with pytest.raises(TypeError):
        process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_called_once_with("p1")
    pricing_service.get_price.assert_not_called()

def test_process_order_missing_product_id_raises_key_error():
    order = {"id": "order8", "items": [{"quantity": 1}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()

    with pytest.raises(KeyError):
        process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_not_called()
    pricing_service.get_price.assert_not_called()

def test_process_order_price_service_returns_zero_price():
    order = {"id": "order9", "items": [{"product_id": "p1", "quantity": 3}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 0.0

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order9"
    assert result["total"] == 0
    inventory_service.check_stock.assert_called_once_with("p1")
    pricing_service.get_price.assert_called_once_with("p1")
# AI_TEST_AGENT_END function=process_order
