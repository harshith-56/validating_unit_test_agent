from backend.cate import process_users
from unittest.mock import AsyncMock, MagicMock
import pytest

# AI_TEST_AGENT_START function=process_users
@pytest.mark.asyncio
async def test_process_users_happy_path():
    client = MagicMock()
    db = MagicMock()
    users = [
        {"email": "a@example.com"},
        {"email": "b@example.com"}
    ]
    client.get = AsyncMock(return_value={"status": 200, "data": users})
    db.save = AsyncMock(side_effect=lambda u: {"saved_email": u["email"]})
    result = await process_users(client, db)
    assert result == [{"saved_email": "a@example.com"}, {"saved_email": "b@example.com"}]
    assert db.save.call_count == 2

@pytest.mark.asyncio
async def test_process_users_skips_users_without_email():
    client = MagicMock()
    db = MagicMock()
    users = [
        {"email": "a@example.com"},
        {"name": "noemail"},
        {"email": None},
        {}
    ]
    client.get = AsyncMock(return_value={"status": 200, "data": users})
    db.save = AsyncMock(side_effect=lambda u: {"saved_email": u.get("email")})
    result = await process_users(client, db)
    assert result == [{"saved_email": "a@example.com"}]
    assert db.save.call_count == 1

@pytest.mark.asyncio
async def test_process_users_handles_empty_user_list():
    client = MagicMock()
    db = MagicMock()
    client.get = AsyncMock(return_value={"status": 200, "data": []})
    db.save = AsyncMock()
    result = await process_users(client, db)
    assert result == []
    assert db.save.call_count == 0
# AI_TEST_AGENT_END function=process_users
