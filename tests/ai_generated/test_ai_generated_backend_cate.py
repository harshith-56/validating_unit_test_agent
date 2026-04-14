from backend.cate import process_users
from unittest.mock import AsyncMock, MagicMock
import pytest

# AI_TEST_AGENT_START function=process_users
@pytest.mark.asyncio
async def test_process_users_happy_path():
    client = AsyncMock()
    db = AsyncMock()
    users = [MagicMock(), MagicMock()]
    users[0].get.return_value = "user0@example.com"
    users[1].get.return_value = "user1@example.com"
    client.get.return_value = {"status": 200, "data": users}
    db.save.side_effect = lambda u: f"saved-{u.get.return_value}"
    result = await process_users(client, db)
    assert result == ["saved-user0@example.com", "saved-user1@example.com"]
    assert db.save.call_count == 2

@pytest.mark.asyncio
async def test_process_users_skips_users_without_email():
    client = AsyncMock()
    db = AsyncMock()
    user_with_email = MagicMock()
    user_with_email.get.return_value = "email@example.com"
    user_without_email = MagicMock()
    user_without_email.get.return_value = None
    client.get.return_value = {"status": 200, "data": [user_with_email, user_without_email]}
    db.save.return_value = "saved-email@example.com"
    result = await process_users(client, db)
    assert result == ["saved-email@example.com"]
    db.save.assert_called_once_with(user_with_email)

@pytest.mark.asyncio
async def test_process_users_empty_user_list():
    client = AsyncMock()
    db = AsyncMock()
    client.get.return_value = {"status": 200, "data": []}
    result = await process_users(client, db)
    assert result == []
    db.save.assert_not_called()
# AI_TEST_AGENT_END function=process_users
