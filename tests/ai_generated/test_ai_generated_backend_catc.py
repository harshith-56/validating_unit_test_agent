from backend.catc import is_rate_limited
from unittest.mock import patch
import pytest

# AI_TEST_AGENT_START function=is_rate_limited
def test_is_rate_limited_below_limit_increments_and_returns_false():
    user_id = "user1"
    limit = 3
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        mock_rate_limit.get = lambda k, default=0: 1
        result = is_rate_limited(user_id, limit)
        assert result is False
        assert mock_rate_limit[user_id] == 2

def test_is_rate_limited_at_limit_returns_true_and_does_not_increment():
    user_id = "user2"
    limit = 2
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        def get_side_effect(k, default=0):
            if k == user_id:
                return 2
            return default
        mock_rate_limit.get = get_side_effect
        with pytest.raises(KeyError):
            # Because the function tries to assign to _rate_limit[user_id], but patching dict with get method only
            # So patch dict directly instead
            pass
    # Repatch with dict to allow assignment
    with patch('backend.catc._rate_limit', {user_id: 2}) as mock_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is True
        assert mock_rate_limit[user_id] == 2

def test_is_rate_limited_above_limit_returns_true_and_does_not_increment():
    user_id = "user3"
    limit = 1
    with patch('backend.catc._rate_limit', {user_id: 5}) as mock_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is True
        assert mock_rate_limit[user_id] == 5

def test_is_rate_limited_new_user_starts_count_and_returns_false():
    user_id = "new_user"
    limit = 1
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

def test_is_rate_limited_with_none_user_id_raises_type_error():
    user_id = None
    limit = 1
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        with pytest.raises(TypeError):
            is_rate_limited(user_id, limit)

def test_is_rate_limited_with_negative_limit_always_returns_true():
    user_id = "user_neg"
    limit = -1
    with patch('backend.catc._rate_limit', {user_id: 0}) as mock_rate_limit:
        result = is_rate_limited(user_id, limit)
        assert result is True
        assert mock_rate_limit[user_id] == 0

def test_is_rate_limited_with_non_string_user_id_raises_type_error():
    user_id = 12345
    limit = 1
    with patch('backend.catc._rate_limit', {}) as mock_rate_limit:
        with pytest.raises(TypeError):
            is_rate_limited(user_id, limit)
# AI_TEST_AGENT_END function=is_rate_limited
