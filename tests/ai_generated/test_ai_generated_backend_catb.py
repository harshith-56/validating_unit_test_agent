from backend.catb import create_user
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

def test_create_user_existing_user_raises_value_error():
    payload = {"email": "existing@example.com", "name": "Existing User", "password": "strongpass"}
    db = MagicMock()
    db.find_user_by_email.return_value = {"email": "existing@example.com", "name": "Existing User"}

    with pytest.raises(ValueError, match="User already exists"):
        create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("existing@example.com")
    db.insert_user.assert_not_called()

def test_create_user_weak_password_raises_value_error():
    payload = {"email": "new@example.com", "name": "New User", "password": "short"}
    db = MagicMock()
    db.find_user_by_email.return_value = None

    with pytest.raises(ValueError, match="Weak password"):
        create_user(payload, db)

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

def test_create_user_password_none_raises_type_error():
    payload = {"email": "nonepass@example.com", "name": "None Password", "password": None}
    db = MagicMock()
    db.find_user_by_email.return_value = None

    with pytest.raises(TypeError):
        create_user(payload, db)

    db.find_user_by_email.assert_called_once_with("nonepass@example.com")
    db.insert_user.assert_not_called()

def test_create_user_email_none_raises_type_error():
    payload = {"email": None, "name": "None Email", "password": "validpass123"}
    db = MagicMock()
    db.find_user_by_email.return_value = None

    with pytest.raises(TypeError):
        create_user(payload, db)

    db.find_user_by_email.assert_called_once_with(None)
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
# AI_TEST_AGENT_END function=process_payment
