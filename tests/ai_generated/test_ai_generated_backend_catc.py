from backend.catc import create_session
from backend.catc import is_rate_limited
from unittest.mock import patch
from unittest.mock import patch, MagicMock
import pytest

# AI_TEST_AGENT_START function=create_session
def test_create_session_happy_path():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        result = create_session('token123', 42)
        assert result is True
        assert mock_sessions['token123'] == {"user_id": 42}

def test_create_session_invalid_token_empty_string():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        result = create_session('', 1)
        assert result is True
        assert mock_sessions[''] == {"user_id": 1}

def test_create_session_edge_case_user_id_zero():
    with patch('backend.catc._sessions', {}) as mock_sessions:
        result = create_session('edge_token', 0)
        assert result is True
        assert mock_sessions['edge_token'] == {"user_id": 0}
# AI_TEST_AGENT_END function=create_session

# AI_TEST_AGENT_START function=is_rate_limited
def test_is_rate_limited_below_limit_increments_and_returns_false():
    user_id = "user123"
    limit = 3
    mock_rate_limit = {user_id: 1}

    with patch('backend.catc._rate_limit', mock_rate_limit) as mocked_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is False
        assert mocked_rate_limit[user_id] == 2

def test_is_rate_limited_at_limit_returns_true_and_does_not_increment():
    user_id = "user123"
    limit = 2
    mock_rate_limit = {user_id: 2}

    with patch('backend.catc._rate_limit', mock_rate_limit) as mocked_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is True
        assert mocked_rate_limit[user_id] == 2

def test_is_rate_limited_above_limit_returns_true_and_does_not_increment():
    user_id = "user123"
    limit = 1
    mock_rate_limit = {user_id: 5}

    with patch('backend.catc._rate_limit', mock_rate_limit) as mocked_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is True
        assert mocked_rate_limit[user_id] == 5

def test_is_rate_limited_user_not_in_rate_limit_starts_count_and_returns_false():
    user_id = "new_user"
    limit = 1
    mock_rate_limit = {}

    with patch('backend.catc._rate_limit', mock_rate_limit) as mocked_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is False
        assert mocked_rate_limit[user_id] == 1

def test_is_rate_limited_limit_zero_always_returns_true():
    user_id = "user123"
    limit = 0
    mock_rate_limit = {user_id: 0}

    with patch('backend.catc._rate_limit', mock_rate_limit) as mocked_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is True
        assert mocked_rate_limit[user_id] == 0

def test_is_rate_limited_limit_negative_always_returns_true():
    user_id = "user123"
    limit = -1
    mock_rate_limit = {user_id: 0}

    with patch('backend.catc._rate_limit', mock_rate_limit) as mocked_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is True
        assert mocked_rate_limit[user_id] == 0

def test_is_rate_limited_user_id_empty_string_starts_count_and_returns_false():
    user_id = ""
    limit = 1
    mock_rate_limit = {}

    with patch('backend.catc._rate_limit', mock_rate_limit) as mocked_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is False
        assert mocked_rate_limit[user_id] == 1

def test_is_rate_limited_user_id_none_raises_type_error():
    user_id = None
    limit = 1
    mock_rate_limit = {}

    with patch('backend.catc._rate_limit', mock_rate_limit):
        with pytest.raises(TypeError):
            is_rate_limited(user_id, limit)
# AI_TEST_AGENT_END function=is_rate_limited
