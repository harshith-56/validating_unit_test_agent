from backend.cate import process_users
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

# AI_TEST_AGENT_START function=process_users
@pytest.mark.asyncio
@patch("backend.cate.fetch_with_retry")
async def test_process_users_happy_path(mock_fetch):
    mock_fetch.return_value = [{"email": "a@b.com", "id": 1}, {"email": "c@d.com", "id": 2}]
    db = MagicMock()
    db.save = AsyncMock(side_effect=lambda u: {"saved_id": u["id"]})
    client = MagicMock()
    result = await process_users(client, db)
    assert result == [{"saved_id": 1}, {"saved_id": 2}]
    assert db.save.call_count == 2

@pytest.mark.asyncio
@patch("backend.cate.fetch_with_retry")
async def test_process_users_skips_users_without_email(mock_fetch):
    mock_fetch.return_value = [{"id": 1}, {"email": "c@d.com", "id": 2}]
    db = MagicMock()
    db.save = AsyncMock(side_effect=lambda u: {"saved_id": u.get("id", 0)})
    client = MagicMock()
    result = await process_users(client, db)
    assert result == [{"saved_id": 2}]
    assert db.save.call_count == 1

@pytest.mark.asyncio
@patch("backend.cate.fetch_with_retry")
async def test_process_users_empty_user_list(mock_fetch):
    mock_fetch.return_value = []
    db = MagicMock()
    db.save = AsyncMock()
    client = MagicMock()
    result = await process_users(client, db)
    assert result == []
    assert db.save.call_count == 0
# AI_TEST_AGENT_END function=process_users
