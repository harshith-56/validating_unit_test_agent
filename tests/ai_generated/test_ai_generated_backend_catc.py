from backend.catc import create_session
from backend.catc import is_rate_limited
from unittest.mock import patch
from unittest.mock import patch, MagicMock
import pytest

# AI_TEST_AGENT_START function=create_session
def test_create_session_adds_token_to_sessions():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        token = "token123"
        user_id = 42
        result = create_session(token, user_id)
        assert result is True
        assert token in mock_sessions
        assert mock_sessions[token] == {"user_id": user_id}

def test_create_session_overwrites_existing_token():
    with patch('backend.catc._sessions', {"token123": {"user_id": 1}}) as mock_sessions:
        token = "token123"
        user_id = 99
        result = create_session(token, user_id)
        assert result is True
        assert mock_sessions[token] == {"user_id": user_id}

def test_create_session_with_empty_token():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        token = ""
        user_id = 10
        result = create_session(token, user_id)
        assert result is True
        assert token in mock_sessions
        assert mock_sessions[token] == {"user_id": user_id}

def test_create_session_with_zero_user_id():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        token = "token_zero"
        user_id = 0
        result = create_session(token, user_id)
        assert result is True
        assert mock_sessions[token] == {"user_id": 0}

def test_create_session_with_negative_user_id():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        token = "token_neg"
        user_id = -1
        result = create_session(token, user_id)
        assert result is True
        assert mock_sessions[token] == {"user_id": -1}

def test_create_session_with_none_token_raises_type_error():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        with pytest.raises(TypeError):
            create_session(None, 1)

def test_create_session_with_none_user_id_raises_type_error():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        with pytest.raises(TypeError):
            create_session("token_none", None)

def test_create_session_with_non_string_token():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        token = 12345
        user_id = 1
        result = create_session(token, user_id)
        assert result is True
        assert token in mock_sessions
        assert mock_sessions[token] == {"user_id": user_id}

def test_create_session_with_non_int_user_id():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        token = "token_str_user"
        user_id = "user"
        result = create_session(token, user_id)
        assert result is True
        assert mock_sessions[token] == {"user_id": user_id}
# AI_TEST_AGENT_END function=create_session

# AI_TEST_AGENT_START function=is_rate_limited
def test_is_rate_limited_above_limit_returns_true_and_does_not_increment():
    user_id = "user1"
    limit = 3
    with patch('backend.catc._rate_limit', {user_id: 4}) as mock_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is True
        assert mock_rate_limit[user_id] == 4

def test_is_rate_limited_at_limit_returns_true_and_does_not_increment():
    user_id = "user2"
    limit = 5
    with patch('backend.catc._rate_limit', {user_id: 5}) as mock_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is True
        assert mock_rate_limit[user_id] == 5

def test_is_rate_limited_below_limit_increments_and_returns_false():
    user_id = "user3"
    limit = 10
    initial_count = 1
    with patch('backend.catc._rate_limit', {user_id: initial_count}) as mock_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is False
        assert mock_rate_limit[user_id] == initial_count + 1

def test_is_rate_limited_user_not_in_rate_limit_starts_count_and_returns_false():
    user_id = "new_user"
    limit = 2
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is False
        assert mock_rate_limit[user_id] == 1

def test_is_rate_limited_with_empty_user_id_and_zero_limit_returns_true():
    user_id = ""
    limit = 0
    with patch('backend.catc._rate_limit', {user_id: 0}) as mock_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is True
        assert mock_rate_limit[user_id] == 0

def test_is_rate_limited_with_negative_limit_always_returns_true():
    user_id = "user_neg"
    limit = -1
    with patch('backend.catc._rate_limit', {user_id: 0}) as mock_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is True
        assert mock_rate_limit[user_id] == 0

def test_is_rate_limited_with_non_string_user_id_raises_type_error():
    user_id = 12345
    limit = 5
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        with pytest.raises(TypeError):
            is_rate_limited(user_id, limit)

def test_is_rate_limited_with_none_user_id_raises_type_error():
    user_id = None
    limit = 5
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        with pytest.raises(TypeError):
            is_rate_limited(user_id, limit)
# AI_TEST_AGENT_END function=is_rate_limited
