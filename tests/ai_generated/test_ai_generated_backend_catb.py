from backend.catb import create_user
from backend.catb import fetch_active_users
from backend.catb import process_order
from backend.catb import process_payment
from unittest.mock import MagicMock
import pytest

# AI_TEST_AGENT_START function=create_user
def test_create_user_raises_key_error_if_email_missing():
    db = MagicMock()
    payload = {"name": "John", "password": "strongpass"}
    with pytest.raises(KeyError) as excinfo:
        create_user(payload, db)
    assert "'email'" in str(excinfo.value)
    db.find_user_by_email.assert_not_called()
    db.insert_user.assert_not_called()

def test_create_user_raises_key_error_if_name_missing():
    db = MagicMock()
    payload = {"email": "john@example.com", "password": "strongpass"}
    with pytest.raises(KeyError) as excinfo:
        create_user(payload, db)
    assert "'name'" in str(excinfo.value)
    db.find_user_by_email.assert_not_called()
    db.insert_user.assert_not_called()

def test_create_user_raises_key_error_if_password_missing():
    db = MagicMock()
    payload = {"email": "john@example.com", "name": "John"}
    with pytest.raises(KeyError) as excinfo:
        create_user(payload, db)
    assert "'password'" in str(excinfo.value)
    db.find_user_by_email.assert_not_called()
    db.insert_user.assert_not_called()

def test_create_user_raises_type_error_if_password_is_not_string():
    db = MagicMock()
    payload = {"email": "john@example.com", "name": "John", "password": 12345678}
    with pytest.raises(TypeError):
        create_user(payload, db)
    db.find_user_by_email.assert_not_called()
    db.insert_user.assert_not_called()

def test_create_user_raises_type_error_if_payload_is_none():
    db = MagicMock()
    payload = None
    with pytest.raises(TypeError):
        create_user(payload, db)
    db.find_user_by_email.assert_not_called()
    db.insert_user.assert_not_called()

def test_create_user_raises_value_error_if_password_too_short():
    db = MagicMock()
    payload = {"email": "john@example.com", "name": "John", "password": "short"}
    db.find_user_by_email.return_value = None
    with pytest.raises(ValueError) as excinfo:
        create_user(payload, db)
    assert str(excinfo.value) == "Weak password"
    db.find_user_by_email.assert_called_once_with("john@example.com")
    db.insert_user.assert_not_called()

def test_create_user_raises_value_error_if_user_already_exists():
    db = MagicMock()
    payload = {"email": "john@example.com", "name": "John", "password": "strongpass"}
    db.find_user_by_email.return_value = {"email": "john@example.com", "name": "John"}
    with pytest.raises(ValueError) as excinfo:
        create_user(payload, db)
    assert str(excinfo.value) == "User already exists"
    db.find_user_by_email.assert_called_once_with("john@example.com")
    db.insert_user.assert_not_called()

def test_create_user_success_inserts_and_returns_user():
    db = MagicMock()
    payload = {"email": "john@example.com", "name": "John", "password": "strongpass"}
    db.find_user_by_email.return_value = None
    inserted_user = {"email": "john@example.com", "name": "John"}
    db.insert_user.return_value = inserted_user
    result = create_user(payload, db)
    db.find_user_by_email.assert_called_once_with("john@example.com")
    db.insert_user.assert_called_once_with({"email": "john@example.com", "name": "John"})
    assert result == inserted_user
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

def test_process_payment_charge_failure_raises_runtime_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "failed", "transaction_id": "tx123"}
    with pytest.raises(RuntimeError, match="Payment failed"):
        process_payment(50.0, gateway)
    gateway.charge.assert_called_once_with(50.0)

def test_process_payment_charge_response_missing_status_raises_runtime_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"transaction_id": "tx123"}
    with pytest.raises(RuntimeError, match="Payment failed"):
        process_payment(20.0, gateway)
    gateway.charge.assert_called_once_with(20.0)

def test_process_payment_charge_response_status_none_raises_runtime_error():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": None, "transaction_id": "tx123"}
    with pytest.raises(RuntimeError, match="Payment failed"):
        process_payment(10.0, gateway)
    gateway.charge.assert_called_once_with(10.0)

def test_process_payment_charge_response_missing_transaction_id_returns_none():
    gateway = MagicMock()
    gateway.charge.return_value = {"status": "success"}
    result = process_payment(30.0, gateway)
    assert result is None
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
    assert client.get.call_count == 1
    client.get.assert_called_with("/users")

def test_fetch_active_users_retries_and_raises_after_failures():
    client = MagicMock()
    client.get.side_effect = Exception("fail")

    with pytest.raises(RuntimeError) as excinfo:
        fetch_active_users(client, retries=2)

    assert "Failed after retries" in str(excinfo.value)
    assert client.get.call_count == 3

def test_fetch_active_users_succeeds_after_retry():
    client = MagicMock()
    user = {"is_active": True, "email": "x@example.com"}
    client.get.side_effect = [Exception("fail"), MagicMock(json=MagicMock(return_value=[user]))]

    result = fetch_active_users(client, retries=1)

    assert result == [user]
    assert client.get.call_count == 2

def test_fetch_active_users_with_empty_list_returns_empty_list():
    client = MagicMock()
    client.get.return_value.json.return_value = []

    result = fetch_active_users(client)

    assert result == []
    assert client.get.call_count == 1

def test_fetch_active_users_with_non_dict_items_in_list():
    client = MagicMock()
    client.get.return_value.json.return_value = [None, 123, "string", {"is_active": True, "email": "a@b.com"}]

    with pytest.raises(RuntimeError) as excinfo:
        fetch_active_users(client)

    assert "Failed after retries" in str(excinfo.value)
    assert client.get.call_count == 3

def test_fetch_active_users_with_missing_keys_in_user_dicts():
    client = MagicMock()
    user1 = {"is_active": True}
    user2 = {"email": "a@b.com"}
    user3 = {"is_active": True, "email": "b@b.com"}
    client.get.return_value.json.return_value = [user1, user2, user3]

    result = fetch_active_users(client)

    assert result == [user3]
    assert client.get.call_count == 1

def test_fetch_active_users_with_is_active_false_and_email_none():
    client = MagicMock()
    user1 = {"is_active": False, "email": "a@b.com"}
    user2 = {"is_active": True, "email": None}
    user3 = {"is_active": True, "email": "b@b.com"}
    client.get.return_value.json.return_value = [user1, user2, user3]

    result = fetch_active_users(client)

    assert result == [user3]
    assert client.get.call_count == 1

def test_fetch_active_users_with_email_falsey_values():
    client = MagicMock()
    user1 = {"is_active": True, "email": ""}
    user2 = {"is_active": True, "email": None}
    user3 = {"is_active": True, "email": "valid@example.com"}
    client.get.return_value.json.return_value = [user1, user2, user3]

    result = fetch_active_users(client)

    assert result == [user3]
    assert client.get.call_count == 1

def test_fetch_active_users_with_non_iterable_json_response_raises():
    client = MagicMock()
    client.get.return_value.json.return_value = None

    with pytest.raises(RuntimeError) as excinfo:
        fetch_active_users(client)

    assert "Failed after retries" in str(excinfo.value)
    assert client.get.call_count == 3

def test_fetch_active_users_with_partial_failures_and_non_iterable_response():
    client = MagicMock()
    client.get.side_effect = [Exception("fail"), MagicMock(json=MagicMock(return_value=None)), MagicMock(json=MagicMock(return_value=[{"is_active": True, "email": "a@b.com"}]))]

    with pytest.raises(RuntimeError) as excinfo:
        fetch_active_users(client, retries=2)

    assert "Failed after retries" in str(excinfo.value)
    assert client.get.call_count == 3
# AI_TEST_AGENT_END function=fetch_active_users

# AI_TEST_AGENT_START function=process_order
def test_process_order_single_item_sufficient_stock_and_price():
    order = {"id": "order123", "items": [{"product_id": "prod1", "quantity": 2}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 5
    pricing_service.get_price.return_value = 10.0

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order123"
    assert result["total"] == pytest.approx(20.0)
    inventory_service.check_stock.assert_called_once_with("prod1")
    pricing_service.get_price.assert_called_once_with("prod1")

def test_process_order_multiple_items_all_in_stock_correct_total():
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

    expected_total = 1*5.0 + 3*7.5 + 2*3.0
    assert result["order_id"] == "order456"
    assert result["total"] == pytest.approx(expected_total)
    assert inventory_service.check_stock.call_count == 3
    assert pricing_service.get_price.call_count == 3

def test_process_order_item_out_of_stock_raises_value_error():
    order = {"id": "order789", "items": [{"product_id": "prod1", "quantity": 4}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 2

    with pytest.raises(ValueError, match="Out of stock: prod1"):
        process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_called_once_with("prod1")
    pricing_service.get_price.assert_not_called()

def test_process_order_zero_quantity_item_no_price_or_stock_check():
    order = {"id": "order000", "items": [{"product_id": "prod1", "quantity": 0}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 100.0

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "order000"
    assert result["total"] == 0.0
    inventory_service.check_stock.assert_called_once_with("prod1")
    pricing_service.get_price.assert_called_once_with("prod1")

def test_process_order_empty_items_list_returns_zero_total():
    order = {"id": "orderEmpty", "items": []}
    inventory_service = MagicMock()
    pricing_service = MagicMock()

    result = process_order(order, inventory_service, pricing_service)

    assert result["order_id"] == "orderEmpty"
    assert result["total"] == 0.0
    inventory_service.check_stock.assert_not_called()
    pricing_service.get_price.assert_not_called()

def test_process_order_negative_quantity_raises_value_error_due_to_stock_check():
    order = {"id": "orderNeg", "items": [{"product_id": "prodNeg", "quantity": -1}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10

    with pytest.raises(ValueError, match="Out of stock: prodNeg"):
        process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_called_once_with("prodNeg")
    pricing_service.get_price.assert_not_called()

def test_process_order_price_with_floating_point_precision():
    order = {"id": "orderFloat", "items": [{"product_id": "prodFloat", "quantity": 3}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 2.3333333

    result = process_order(order, inventory_service, pricing_service)

    expected_total = round(3 * 2.3333333, 2)
    assert result["order_id"] == "orderFloat"
    assert result["total"] == pytest.approx(expected_total)
    inventory_service.check_stock.assert_called_once_with("prodFloat")
    pricing_service.get_price.assert_called_once_with("prodFloat")

def test_process_order_non_integer_quantity_raises_type_error():
    order = {"id": "orderType", "items": [{"product_id": "prodType", "quantity": "two"}]}
    inventory_service = MagicMock()
    pricing_service = MagicMock()
    inventory_service.check_stock.return_value = 10
    pricing_service.get_price.return_value = 5.0

    with pytest.raises(TypeError):
        process_order(order, inventory_service, pricing_service)

    inventory_service.check_stock.assert_called_once_with("prodType")
    pricing_service.get_price.assert_not_called()
# AI_TEST_AGENT_END function=process_order
