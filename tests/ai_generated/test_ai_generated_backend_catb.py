from backend.catb import create_user
from backend.catb import fetch_active_users
from backend.catb import process_order
from backend.catb import process_payment
from unittest.mock import MagicMock
import pytest

# AI_TEST_AGENT_START function=create_user
def test_create_user_successful_insertion():
    payload = {"email": "test@example.com", "name": "Test User", "password": "strongpass"}
    db = MagicMock()
    db.find_user_by_email.return_value = None
    db.insert_user.return_value = {"id": 1, "email": "test@example.com", "name": "Test User"}

    result = create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("test@example.com")
    db.insert_user.assert_called_once_with({"email": "test@example.com", "name": "Test User"})
    assert result == {"id": 1, "email": "test@example.com", "name": "Test User"}

def test_create_user_raises_value_error_if_user_exists():
    payload = {"email": "exists@example.com", "name": "Exists User", "password": "strongpass"}
    db = MagicMock()
    db.find_user_by_email.return_value = {"email": "exists@example.com", "name": "Exists User"}

    with pytest.raises(ValueError, match="User already exists"):
        create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("exists@example.com")
    db.insert_user.assert_not_called()

def test_create_user_raises_value_error_if_password_too_short():
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

def test_create_user_raises_type_error_if_email_is_not_string():
    payload = {"email": 12345, "name": "Test3 User", "password": "strongpass"}
    db = MagicMock()

    with pytest.raises(TypeError):
        create_user(payload, db)

    db.find_user_by_email.assert_not_called()
    db.insert_user.assert_not_called()

def test_create_user_raises_type_error_if_name_is_not_string():
    payload = {"email": "test4@example.com", "name": 12345, "password": "strongpass"}
    db = MagicMock()
    db.find_user_by_email.return_value = None

    with pytest.raises(TypeError):
        create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("test4@example.com")
    db.insert_user.assert_not_called()
# AI_TEST_AGENT_END function=create_user

# AI_TEST_AGENT_START function=process_payment
def test_process_payment_successful_charge_returns_transaction_id():
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

def test_process_payment_charge_returns_failure_status_raises_runtime_error():
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

def test_process_payment_charge_response_missing_status_key_raises_key_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"transaction_id": "tx111"}
    with pytest.raises(KeyError):
        process_payment(20.0, gateway)
    gateway.charge.assert_called_once_with(20.0)

def test_process_payment_charge_response_missing_transaction_id_key_raises_key_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "success"}
    with pytest.raises(KeyError):
        process_payment(30.0, gateway)
    gateway.charge.assert_called_once_with(30.0)

def test_process_payment_amount_as_float_edge_case_min_positive():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "success", "transaction_id": "tx_min"}
    result = process_payment(1e-10, gateway)
    assert result == "tx_min"
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
        {"is_active": True},
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

def test_fetch_active_users_retries_and_raises_after_failures():
    client = MagicMock()
    client.get.side_effect = Exception("fail")

    with pytest.raises(RuntimeError) as excinfo:
        fetch_active_users(client, retries=2)

    assert "Failed after retries" in str(excinfo.value)
    assert client.get.call_count == 3

def test_fetch_active_users_succeeds_after_retry():
    client = MagicMock()
    client.get.side_effect = [Exception("fail"), MagicMock(json=MagicMock(return_value=[
        {"is_active": True, "email": "x@example.com"},
        {"is_active": False, "email": "y@example.com"},
    ]))]

    result = fetch_active_users(client, retries=1)

    assert len(result) == 1
    assert result[0]["email"] == "x@example.com"
    assert client.get.call_count == 2

def test_fetch_active_users_empty_list_returns_empty_list():
    client = MagicMock()
    client.get.return_value.json.return_value = []

    result = fetch_active_users(client)

    assert result == []
    client.get.assert_called_once_with("/users")

def test_fetch_active_users_handles_malformed_user_entries():
    client = MagicMock()
    client.get.return_value.json.return_value = [
        {"is_active": True, "email": "valid@example.com"},
        {"is_active": None, "email": "noactive@example.com"},
        {"email": "noactivefield@example.com"},
        {"is_active": True, "email": None},
        {"is_active": True},
        {},
    ]

    result = fetch_active_users(client)

    assert result == [{"is_active": True, "email": "valid@example.com"}]
    client.get.assert_called_once_with("/users")

def test_fetch_active_users_with_zero_retries_raises_immediately_on_failure():
    client = MagicMock()
    client.get.side_effect = Exception("fail")

    with pytest.raises(RuntimeError) as excinfo:
        fetch_active_users(client, retries=0)

    assert "Failed after retries" in str(excinfo.value)
    assert client.get.call_count == 1

def test_fetch_active_users_with_negative_retries_treated_as_zero():
    client = MagicMock()
    client.get.side_effect = Exception("fail")

    with pytest.raises(RuntimeError) as excinfo:
        fetch_active_users(client, retries=-1)

    assert "Failed after retries" in str(excinfo.value)
    assert client.get.call_count == 0

def test_fetch_active_users_with_non_dict_user_entries_skips_them():
    client = MagicMock()
    client.get.return_value.json.return_value = [
        {"is_active": True, "email": "valid@example.com"},
        None,
        "string",
        123,
        {"is_active": True, "email": "another@example.com"},
    ]

    result = fetch_active_users(client)

    assert result == [
        {"is_active": True, "email": "valid@example.com"},
        {"is_active": True, "email": "another@example.com"},
    ]
    client.get.assert_called_once_with("/users")
# AI_TEST_AGENT_END function=fetch_active_users

# AI_TEST_AGENT_START function=process_order
def test_process_order_single_item_sufficient_stock():
    order = {"id": "order123", "items": [{"product_id": "prod1", "quantity": 2}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 5
    pricing_service.get_price.return_value = 10.0

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order123"
    assert result["total"] == 20.0
    inventory_service.check_stock.assert_called_once_with("prod1")
    pricing_service.get_price.assert_called_once_with("prod1")

def test_process_order_multiple_items_sufficient_stock():
    order = {"id": "order456", "items": [
        {"product_id": "prod1", "quantity": 1},
        {"product_id": "prod2", "quantity": 3}
    ]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.side_effect = [2, 5]
    pricing_service.get_price.side_effect = [15.0, 7.5]

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order456"
    assert result["total"] == pytest.approx(15.0*1 + 7.5*3, 0.01)
    assert inventory_service.check_stock.call_count == 2
    assert pricing_service.get_price.call_count == 2

def test_process_order_item_out_of_stock_raises_value_error():
    order = {"id": "order789", "items": [{"product_id": "prod1", "quantity": 4}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 3

    with pytest.raises(ValueError, match="Out of stock: prod1"):
        process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_called_once_with("prod1")
    pricing_service.get_price.assert_not_called()

def test_process_order_empty_items_returns_zero_total():
    order = {"id": "order000", "items": []}
    inventory_service = MagicMock()
    pricing_service = MagicMock()

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order000"
    assert result["total"] == 0
    inventory_service.check_stock.assert_not_called()
    pricing_service.get_price.assert_not_called()

def test_process_order_quantity_zero_item():
    order = {"id": "order001", "items": [{"product_id": "prod1", "quantity": 0}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 100.0

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order001"
    assert result["total"] == 0
    inventory_service.check_stock.assert_called_once_with("prod1")
    pricing_service.get_price.assert_called_once_with("prod1")

def test_process_order_negative_quantity_raises_value_error():
    order = {"id": "order002", "items": [{"product_id": "prod1", "quantity": -1}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 50.0

    with pytest.raises(ValueError, match="Out of stock: prod1"):
        process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_called_once_with("prod1")
    pricing_service.get_price.assert_not_called()

def test_process_order_price_zero_item():
    order = {"id": "order003", "items": [{"product_id": "prod1", "quantity": 3}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 0.0

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order003"
    assert result["total"] == 0.0
    inventory_service.check_stock.assert_called_once_with("prod1")
    pricing_service.get_price.assert_called_once_with("prod1")

def test_process_order_price_float_precision():
    order = {"id": "order004", "items": [{"product_id": "prod1", "quantity": 3}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 0.3333333

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order004"
    assert abs(result["total"] - round(0.3333333 * 3, 2)) < 1e-9
    inventory_service.check_stock.assert_called_once_with("prod1")
    pricing_service.get_price.assert_called_once_with("prod1")
# AI_TEST_AGENT_END function=process_order
