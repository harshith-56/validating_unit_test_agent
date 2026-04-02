from backend.catc import create_session
from backend.catc import is_rate_limited
from unittest.mock import patch
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
def test_is_rate_limited_below_limit_increments_and_returns_false():
    user_id = "user123"
    limit = 3
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        mock_rate_limit.get = lambda k, default=0: 1
        result = is_rate_limited(user_id, limit)
        assert result is False
        assert mock_rate_limit[user_id] == 2

def test_is_rate_limited_at_limit_returns_true_and_does_not_increment():
    user_id = "user123"
    limit = 2
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        def get_side_effect(k, default=0):
            if k == user_id:
                return 2
            return default
        mock_rate_limit.get = get_side_effect
        with pytest.raises(KeyError):
            # Because the function tries to assign mock_rate_limit[user_id] = count + 1
            # but count >= limit, so it returns True before assignment.
            # However, since mock_rate_limit is a dict, assignment should work.
            # So no exception expected here.
            pass
        result = is_rate_limited(user_id, limit)
        assert result is True
        # The value should remain unchanged
        assert mock_rate_limit.get(user_id) == 2

def test_is_rate_limited_user_not_in_rate_limit_initializes_and_returns_false():
    user_id = "new_user"
    limit = 1
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        mock_rate_limit.get = lambda k, default=0: 0
        result = is_rate_limited(user_id, limit)
        assert result is False
        assert mock_rate_limit[user_id] == 1

def test_is_rate_limited_limit_zero_always_returns_true():
    user_id = "any_user"
    limit = 0
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        mock_rate_limit.get = lambda k, default=0: 0
        result = is_rate_limited(user_id, limit)
        assert result is True
        # Should not increment because count >= limit

def test_is_rate_limited_negative_limit_always_returns_true():
    user_id = "any_user"
    limit = -1
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        mock_rate_limit.get = lambda k, default=0: 0
        result = is_rate_limited(user_id, limit)
        assert result is True

def test_is_rate_limited_empty_user_id_treated_as_key_and_increments():
    user_id = ""
    limit = 2
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        mock_rate_limit.get = lambda k, default=0: 1 if k == "" else 0
        result = is_rate_limited(user_id, limit)
        assert result is False
        assert mock_rate_limit[""] == 2

def test_is_rate_limited_none_user_id_raises_type_error():
    user_id = None
    limit = 1
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        mock_rate_limit.get = lambda k, default=0: 0
        with pytest.raises(TypeError):
            is_rate_limited(user_id, limit)

def test_is_rate_limited_limit_as_string_raises_type_error():
    user_id = "user1"
    limit = "3"
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        mock_rate_limit.get = lambda k, default=0: 0
        with pytest.raises(TypeError):
            is_rate_limited(user_id, limit)
# AI_TEST_AGENT_END function=is_rate_limited
