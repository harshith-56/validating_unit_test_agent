from backend.catc import create_session
from backend.catc import is_rate_limited
from unittest.mock import patch
import pytest

# AI_TEST_AGENT_START function=create_session
def test_create_session_happy_path():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        result = create_session('token123', 42)
        assert result is True
        assert mock_sessions['token123'] == {"user_id": 42}

def test_create_session_empty_token():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        result = create_session('', 1)
        assert result is True
        assert mock_sessions[''] == {"user_id": 1}

def test_create_session_user_id_zero():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        result = create_session('token_zero', 0)
        assert result is True
        assert mock_sessions['token_zero'] == {"user_id": 0}
# AI_TEST_AGENT_END function=create_session

# AI_TEST_AGENT_START function=is_rate_limited
def test_is_rate_limited_not_limited_increments_count():
    with patch('backend.catc._rate_limit', {'user1': 1}) as mock_rate_limit:
        result = is_rate_limited('user1', 3)
        assert result is False
        assert mock_rate_limit['user1'] == 2

def test_is_rate_limited_limit_reached_returns_true():
    with patch('backend.catc._rate_limit', {'user2': 5}) as mock_rate_limit:
        result = is_rate_limited('user2', 5)
        assert result is True
        assert mock_rate_limit['user2'] == 5

def test_is_rate_limited_new_user_starts_count():
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        result = is_rate_limited('new_user', 1)
        assert result is False
        assert mock_rate_limit['new_user'] == 1
# AI_TEST_AGENT_END function=is_rate_limited
