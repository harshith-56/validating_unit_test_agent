from backend.cate import fetch_with_retry
from backend.cate import process_users
from unittest.mock import AsyncMock, MagicMock
from unittest.mock import AsyncMock, MagicMock, call
from unittest.mock import AsyncMock, MagicMock, call, patch
import asyncio
import pytest

# AI_TEST_AGENT_START function=fetch_with_retry
@pytest.mark.asyncio
async def test_fetch_with_retry_success_first_try():
    client = AsyncMock()
    client.get.return_value = {"status": 200, "data": "success"}
    asyncio.sleep = AsyncMock()
    result = await fetch_with_retry(client, "http://example.com", retries=2)
    assert result == "success"
    client.get.assert_awaited_once_with("http://example.com")
    asyncio.sleep.assert_not_awaited()

@pytest.mark.asyncio
async def test_fetch_with_retry_success_after_retries():
    client = AsyncMock()
    client.get.side_effect = [
        {"status": 500, "data": None},
        {"status": 200, "data": "success_after_retry"}
    ]
    asyncio.sleep = AsyncMock()
    result = await fetch_with_retry(client, "http://example.com", retries=2)
    assert result == "success_after_retry"
    assert client.get.await_count == 2
    asyncio.sleep.assert_awaited_once()

@pytest.mark.asyncio
async def test_fetch_with_retry_raises_after_all_retries_bad_response():
    client = AsyncMock()
    client.get.return_value = {"status": 404, "data": None}
    asyncio.sleep = AsyncMock()
    with pytest.raises(RuntimeError, match="Failed after retries: Bad response"):
        await fetch_with_retry(client, "http://example.com", retries=1)
    assert client.get.await_count == 2
    assert asyncio.sleep.await_count == 2

@pytest.mark.asyncio
async def test_fetch_with_retry_raises_after_all_retries_exception():
    client = AsyncMock()
    client.get.side_effect = RuntimeError("Network error")
    asyncio.sleep = AsyncMock()
    with pytest.raises(RuntimeError, match="Failed after retries: Network error"):
        await fetch_with_retry(client, "http://example.com", retries=3)
    assert client.get.await_count == 4
    assert asyncio.sleep.await_count == 4

@pytest.mark.asyncio
async def test_fetch_with_retry_invalid_url_type_raises():
    client = AsyncMock()
    asyncio.sleep = AsyncMock()
    with pytest.raises(TypeError):
        await fetch_with_retry(client, None, retries=1)

@pytest.mark.asyncio
async def test_fetch_with_retry_zero_retries_success():
    client = AsyncMock()
    client.get.return_value = {"status": 200, "data": "immediate"}
    asyncio.sleep = AsyncMock()
    result = await fetch_with_retry(client, "http://example.com", retries=0)
    assert result == "immediate"
    client.get.assert_awaited_once()
    asyncio.sleep.assert_not_awaited()

@pytest.mark.asyncio
async def test_fetch_with_retry_zero_retries_failure():
    client = AsyncMock()
    client.get.return_value = {"status": 500, "data": None}
    asyncio.sleep = AsyncMock()
    with pytest.raises(RuntimeError, match="Failed after retries: Bad response"):
        await fetch_with_retry(client, "http://example.com", retries=0)
    client.get.assert_awaited_once()
    asyncio.sleep.assert_awaited_once()

@pytest.mark.asyncio
async def test_fetch_with_retry_negative_retries_treated_as_zero():
    client = AsyncMock()
    client.get.return_value = {"status": 200, "data": "negative_retries"}
    asyncio.sleep = AsyncMock()
    result = await fetch_with_retry(client, "http://example.com", retries=-1)
    assert result == "negative_retries"
    client.get.assert_awaited_once()
    asyncio.sleep.assert_not_awaited()

@pytest.mark.asyncio
async def test_fetch_with_retry_client_get_returns_malformed_response():
    client = AsyncMock()
    client.get.return_value = {"code": 200, "payload": "wrong keys"}
    asyncio.sleep = AsyncMock()
    with pytest.raises(KeyError):
        await fetch_with_retry(client, "http://example.com", retries=1)
    assert client.get.await_count == 2
    assert asyncio.sleep.await_count == 2
# AI_TEST_AGENT_END function=fetch_with_retry

# AI_TEST_AGENT_START function=process_users
@pytest.mark.asyncio
async def test_process_users_db_save_raises_exception_stops_processing():
    client = AsyncMock()
    db = AsyncMock()

    user1 = MagicMock()
    user1.get = MagicMock(return_value="user1@example.com")
    user2 = MagicMock()
    user2.get = MagicMock(return_value="user2@example.com")

    client.get.return_value = {"status": 200, "data": [user1, user2]}

    # db.save will succeed for first user, then raise for second user
    async def save_side_effect(u):
        if u is user1:
            return "saved-user1"
        else:
            raise RuntimeError("DB save failed")

    db.save.side_effect = save_side_effect

    with pytest.raises(RuntimeError, match="DB save failed"):
        await process_users(client, db)

    client.get.assert_awaited_once_with("/users")
    user1.get.assert_called_once_with("email")
    user2.get.assert_called_once_with("email")
    assert db.save.await_count == 2

@pytest.mark.asyncio
async def test_process_users_user_get_raises_exception_skips_user():
    client = AsyncMock()
    db = AsyncMock()

    user1 = MagicMock()
    user1.get = MagicMock(return_value="user1@example.com")
    user2 = MagicMock()
    # user2.get raises exception
    def get_side_effect(key):
        if key == "email":
            raise KeyError("missing email")
        return None
    user2.get = MagicMock(side_effect=get_side_effect)
    user3 = MagicMock()
    user3.get = MagicMock(return_value="user3@example.com")

    client.get.return_value = {"status": 200, "data": [user1, user2, user3]}

    db.save.side_effect = [asyncio.Future(), asyncio.Future()]
    db.save.side_effect[0].set_result("saved-user1")
    db.save.side_effect[1].set_result("saved-user3")

    result = await process_users(client, db)

    client.get.assert_awaited_once_with("/users")
    user1.get.assert_called_once_with("email")
    user2.get.assert_called_once_with("email")
    user3.get.assert_called_once_with("email")
    assert db.save.await_count == 2
    assert result == ["saved-user1", "saved-user3"]
# AI_TEST_AGENT_END function=process_users
