from backend.catb import create_user
from backend.catb import fetch_active_users
from backend.catb import process_order
from backend.catb import process_payment
from unittest.mock import MagicMock
import pytest

# AI_TEST_AGENT_START function=create_user
def test_create_user_success():
    payload = {"email": "test@example.com", "name": "Test User", "password": "strongpass"}
    db = MagicMock()
    db.find_user_by_email.return_value = None
    db.insert_user.return_value = {"email": "test@example.com", "name": "Test User"}

    result = create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("test@example.com")
    db.insert_user.assert_called_once_with({"email": "test@example.com", "name": "Test User"})
    assert result == {"email": "test@example.com", "name": "Test User"}

def test_create_user_existing_email_raises_value_error():
    payload = {"email": "existing@example.com", "name": "Existing User", "password": "strongpass"}
    db = MagicMock()
    db.find_user_by_email.return_value = {"email": "existing@example.com", "name": "Existing User"}

    with pytest.raises(ValueError) as excinfo:
        create_user(payload, db)
    assert str(excinfo.value) == "User already exists"
    db.find_user_by_email.assert_called_once_with("existing@example.com")
    db.insert_user.assert_not_called()

def test_create_user_weak_password_raises_value_error():
    payload = {"email": "new@example.com", "name": "New User", "password": "short"}
    db = MagicMock()
    db.find_user_by_email.return_value = None

    with pytest.raises(ValueError) as excinfo:
        create_user(payload, db)
    assert str(excinfo.value) == "Weak password"
    db.find_user_by_email.assert_called_once_with("new@example.com")
    db.insert_user.assert_not_called()

def test_create_user_password_exactly_8_characters_success():
    payload = {"email": "edge@example.com", "name": "Edge Case", "password": "12345678"}
    db = MagicMock()
    db.find_user_by_email.return_value = None
    db.insert_user.return_value = {"email": "edge@example.com", "name": "Edge Case"}

    result = create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("edge@example.com")
    db.insert_user.assert_called_once_with({"email": "edge@example.com", "name": "Edge Case"})
    assert result == {"email": "edge@example.com", "name": "Edge Case"}

def test_create_user_empty_password_raises_value_error():
    payload = {"email": "empty@example.com", "name": "Empty Password", "password": ""}
    db = MagicMock()
    db.find_user_by_email.return_value = None

    with pytest.raises(ValueError) as excinfo:
        create_user(payload, db)
    assert str(excinfo.value) == "Weak password"
    db.find_user_by_email.assert_called_once_with("empty@example.com")
    db.insert_user.assert_not_called()

def test_create_user_missing_email_key_raises_key_error():
    payload = {"name": "No Email", "password": "validpass123"}
    db = MagicMock()

    with pytest.raises(KeyError):
        create_user(payload, db)
    db.find_user_by_email.assert_not_called()
    db.insert_user.assert_not_called()

def test_create_user_missing_password_key_raises_key_error():
    payload = {"email": "nopass@example.com", "name": "No Password"}
    db = MagicMock()
    db.find_user_by_email.return_value = None

    with pytest.raises(KeyError):
        create_user(payload, db)
    db.find_user_by_email.assert_called_once_with("nopass@example.com")
    db.insert_user.assert_not_called()

def test_create_user_missing_name_key_success():
    payload = {"email": "noname@example.com", "password": "validpass123"}
    db = MagicMock()
    db.find_user_by_email.return_value = None
    db.insert_user.return_value = {"email": "noname@example.com", "name": None}

    result = create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("noname@example.com")
    db.insert_user.assert_called_once_with({"email": "noname@example.com", "name": None})
    assert result == {"email": "noname@example.com", "name": None}
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
    client.get.return_value.json.return_value = [
        {'is_active': True, 'email': 'a@example.com'},
        {'is_active': False, 'email': 'b@example.com'},
        {'is_active': True, 'email': None},
        {'is_active': True, 'email': 'c@example.com'}
    ]
    result = fetch_active_users(client)
    assert result == [
        {'is_active': True, 'email': 'a@example.com'},
        {'is_active': True, 'email': 'c@example.com'}
    ]
    client.get.assert_called_once_with("/users")

def test_fetch_active_users_raises_runtime_error_after_retries():
    client = MagicMock()
    client.get.side_effect = Exception("fail")
    with pytest.raises(RuntimeError) as excinfo:
        fetch_active_users(client, retries=1)
    assert "Failed after retries" in str(excinfo.value)
    assert client.get.call_count == 2

def test_fetch_active_users_returns_empty_list_when_no_users():
    client = MagicMock()
    client.get.return_value.json.return_value = []
    result = fetch_active_users(client)
    assert result == []
    client.get.assert_called_once_with("/users")
# AI_TEST_AGENT_END function=fetch_active_users

# AI_TEST_AGENT_START function=process_order
def test_process_order_single_item_sufficient_stock_and_price():
    order = {"id": "order123", "items": [{"product_id": "prod1", "quantity": 2}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 5
    pricing_service.get_price.return_value = 10.0

    result = process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_called_once_with("prod1")
    pricing_service.get_price.assert_called_once_with("prod1")
    assert result == {"order_id": "order123", "total": 20.0}

def test_process_order_multiple_items_all_in_stock_and_prices():
    order = {
        "id": "order456",
        "items": [
            {"product_id": "prod1", "quantity": 1},
            {"product_id": "prod2", "quantity": 3},
            {"product_id": "prod3", "quantity": 2}
        ]
    }
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.side_effect = [10, 5, 2]
    pricing_service.get_price.side_effect = [5.0, 7.5, 3.0]

    result = process_order(order, inventory_service, pricing_service)

    assert inventory_service.check_stock.call_count == 3
    assert pricing_service.get_price.call_count == 3
    expected_total = 1*5.0 + 3*7.5 + 2*3.0
    assert result == {"order_id": "order456", "total": round(expected_total, 2)}

def test_process_order_item_out_of_stock_raises_value_error():
    order = {"id": "order789", "items": [{"product_id": "prod1", "quantity": 4}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 3

    with pytest.raises(ValueError) as excinfo:
        process_order(order, inventory_service, pricing_service)
    assert str(excinfo.value) == "Out of stock: prod1"
    inventory_service.check_stock.assert_called_once_with("prod1")
    pricing_service.get_price.assert_not_called()

def test_process_order_zero_quantity_item_returns_zero_total():
    order = {"id": "order000", "items": [{"product_id": "prod1", "quantity": 0}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 100.0

    result = process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_called_once_with("prod1")
    pricing_service.get_price.assert_called_once_with("prod1")
    assert result == {"order_id": "order000", "total": 0.0}

def test_process_order_empty_items_list_returns_zero_total():
    order = {"id": "orderEmpty", "items": []}
    inventory_service = MagicMock()
    pricing_service = MagicMock()

    result = process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_not_called()
    pricing_service.get_price.assert_not_called()
    assert result == {"order_id": "orderEmpty", "total": 0.0}

def test_process_order_price_with_many_decimals_rounds_correctly():
    order = {"id": "orderDec", "items": [{"product_id": "prod1", "quantity": 3}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 3.3333333

    result = process_order(order, inventory_service, pricing_service)

    expected_total = round(3 * 3.3333333, 2)
    assert result == {"order_id": "orderDec", "total": expected_total}

def test_process_order_multiple_items_one_out_of_stock_raises_error_after_checking_previous():
    order = {
        "id": "orderPartial",
        "items": [
            {"product_id": "prod1", "quantity": 1},
            {"product_id": "prod2", "quantity": 2},
            {"product_id": "prod3", "quantity": 5}
        ]
    }
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.side_effect = [10, 3, 4]
    pricing_service.get_price.side_effect = [10.0, 20.0]

    with pytest.raises(ValueError) as excinfo:
        process_order(order, inventory_service, pricing_service)
    assert str(excinfo.value) == "Out of stock: prod3"
    assert inventory_service.check_stock.call_count == 3
    assert pricing_service.get_price.call_count == 2

def test_process_order_quantity_equals_stock_processes_successfully():
    order = {"id": "orderEqual", "items": [{"product_id": "prod1", "quantity": 5}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 5
    pricing_service.get_price.return_value = 15.0

    result = process_order(order, inventory_service, pricing_service)

    assert result == {"order_id": "orderEqual", "total": 75.0}
# AI_TEST_AGENT_END function=process_order
