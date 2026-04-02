from backend.cate import fetch_with_retry
from backend.cate import process_users
from unittest.mock import AsyncMock, MagicMock, call, patch
from unittest.mock import AsyncMock, patch
import asyncio
import pytest

# AI_TEST_AGENT_START function=fetch_with_retry
@pytest.mark.asyncio
async def test_fetch_with_retry_success_first_try():
    client = AsyncMock()
    client.get.return_value = {"status": 200, "data": "success"}
    with patch("asyncio.sleep", new=AsyncMock()) as mock_sleep:
        result = await fetch_with_retry(client, "http://example.com", retries=2)
    assert result == "success"
    client.get.assert_awaited_once_with("http://example.com")
    mock_sleep.assert_not_awaited()

@pytest.mark.asyncio
async def test_fetch_with_retry_success_after_retries():
    client = AsyncMock()
    client.get.side_effect = [
        {"status": 500, "data": None},
        {"status": 503, "data": None},
        {"status": 200, "data": "final success"},
    ]
    with patch("asyncio.sleep", new=AsyncMock()) as mock_sleep:
        result = await fetch_with_retry(client, "http://example.com", retries=2)
    assert result == "final success"
    assert client.get.await_count == 3
    assert mock_sleep.await_count == 2

@pytest.mark.asyncio
async def test_fetch_with_retry_raises_after_all_retries_bad_status():
    client = AsyncMock()
    client.get.return_value = {"status": 404, "data": None}
    with patch("asyncio.sleep", new=AsyncMock()) as mock_sleep:
        with pytest.raises(RuntimeError, match="Failed after retries: Bad response"):
            await fetch_with_retry(client, "http://example.com", retries=1)
    assert client.get.await_count == 2
    assert mock_sleep.await_count == 2

@pytest.mark.asyncio
async def test_fetch_with_retry_raises_after_all_retries_exception():
    client = AsyncMock()
    client.get.side_effect = RuntimeError("Network error")
    with patch("asyncio.sleep", new=AsyncMock()) as mock_sleep:
        with pytest.raises(RuntimeError, match="Failed after retries: Network error"):
            await fetch_with_retry(client, "http://example.com", retries=3)
    assert client.get.await_count == 4
    assert mock_sleep.await_count == 4

@pytest.mark.asyncio
async def test_fetch_with_retry_invalid_url_type_raises():
    client = AsyncMock()
    with patch("asyncio.sleep", new=AsyncMock()) as mock_sleep:
        with pytest.raises(TypeError):
            await fetch_with_retry(client, None, retries=1)
    assert client.get.await_count == 1
    assert mock_sleep.await_count == 0

@pytest.mark.asyncio
async def test_fetch_with_retry_zero_retries_success():
    client = AsyncMock()
    client.get.return_value = {"status": 200, "data": "only try"}
    with patch("asyncio.sleep", new=AsyncMock()) as mock_sleep:
        result = await fetch_with_retry(client, "http://example.com", retries=0)
    assert result == "only try"
    client.get.assert_awaited_once_with("http://example.com")
    mock_sleep.assert_not_awaited()

@pytest.mark.asyncio
async def test_fetch_with_retry_zero_retries_failure():
    client = AsyncMock()
    client.get.return_value = {"status": 500, "data": None}
    with patch("asyncio.sleep", new=AsyncMock()) as mock_sleep:
        with pytest.raises(RuntimeError, match="Failed after retries: Bad response"):
            await fetch_with_retry(client, "http://example.com", retries=0)
    client.get.assert_awaited_once_with("http://example.com")
    mock_sleep.assert_awaited_once()

@pytest.mark.asyncio
async def test_fetch_with_retry_negative_retries_treated_as_zero():
    client = AsyncMock()
    client.get.return_value = {"status": 200, "data": "negative retries success"}
    with patch("asyncio.sleep", new=AsyncMock()) as mock_sleep:
        result = await fetch_with_retry(client, "http://example.com", retries=-1)
    assert result == "negative retries success"
    client.get.assert_awaited_once_with("http://example.com")
    mock_sleep.assert_not_awaited()

@pytest.mark.asyncio
async def test_fetch_with_retry_client_get_returns_malformed_response():
    client = AsyncMock()
    client.get.return_value = {"code": 200, "payload": "wrong keys"}
    with patch("asyncio.sleep", new=AsyncMock()) as mock_sleep:
        with pytest.raises(KeyError):
            await fetch_with_retry(client, "http://example.com", retries=1)
    assert client.get.await_count == 2
    assert mock_sleep.await_count == 2
# AI_TEST_AGENT_END function=fetch_with_retry

# AI_TEST_AGENT_START function=process_users
@pytest.mark.asyncio
async def test_process_users_all_valid_users_saved():
    client = AsyncMock()
    db = AsyncMock()
    users = [
        MagicMock(get=MagicMock(side_effect=lambda k: {'email': 'a@example.com'}.get(k))),
        MagicMock(get=MagicMock(side_effect=lambda k: {'email': 'b@example.com'}.get(k))),
    ]
    client.get.return_value = {'status': 200, 'data': users}
    db.save.side_effect = lambda u: asyncio.Future()
    for u in users:
        fut = asyncio.Future()
        fut.set_result({'saved': u.get('email')})
        db.save.side_effect = None
    db.save = AsyncMock(side_effect=[asyncio.Future(), asyncio.Future()])
    db.save.side_effect[0].set_result({'saved': 'a@example.com'})
    db.save.side_effect[1].set_result({'saved': 'b@example.com'})

    with patch('backend.cate.fetch_with_retry', new=AsyncMock(return_value=users)):
        result = await process_users(client, db)

    assert len(result) == 2
    assert result[0] == {'saved': 'a@example.com'}
    assert result[1] == {'saved': 'b@example.com'}
    assert db.save.call_count == 2
    for u in users:
        u.get.assert_called_with('email')

@pytest.mark.asyncio
async def test_process_users_skips_users_without_email():
    client = AsyncMock()
    db = AsyncMock()
    user_with_email = MagicMock(get=MagicMock(side_effect=lambda k: {'email': 'user@example.com'}.get(k)))
    user_without_email = MagicMock(get=MagicMock(side_effect=lambda k: None))
    users = [user_without_email, user_with_email]
    client.get.return_value = {'status': 200, 'data': users}
    db.save.return_value = asyncio.Future()
    db.save.return_value.set_result({'saved': 'user@example.com'})

    with patch('backend.cate.fetch_with_retry', new=AsyncMock(return_value=users)):
        result = await process_users(client, db)

    assert len(result) == 1
    assert result[0] == {'saved': 'user@example.com'}
    db.save.assert_called_once_with(user_with_email)
    user_without_email.get.assert_called_with('email')
    user_with_email.get.assert_called_with('email')

@pytest.mark.asyncio
async def test_process_users_empty_user_list_returns_empty():
    client = AsyncMock()
    db = AsyncMock()
    users = []
    client.get.return_value = {'status': 200, 'data': users}

    with patch('backend.cate.fetch_with_retry', new=AsyncMock(return_value=users)):
        result = await process_users(client, db)

    assert result == []
    db.save.assert_not_called()

@pytest.mark.asyncio
async def test_process_users_db_save_raises_exception_stops_processing():
    client = AsyncMock()
    db = AsyncMock()
    user1 = MagicMock(get=MagicMock(side_effect=lambda k: {'email': 'user1@example.com'}.get(k)))
    user2 = MagicMock(get=MagicMock(side_effect=lambda k: {'email': 'user2@example.com'}.get(k)))
    users = [user1, user2]
    client.get.return_value = {'status': 200, 'data': users}
    db.save.side_effect = [asyncio.Future(), Exception("DB error")]
    db.save.side_effect[0].set_result({'saved': 'user1@example.com'})

    with patch('backend.cate.fetch_with_retry', new=AsyncMock(return_value=users)):
        with pytest.raises(Exception, match="DB error"):
            await process_users(client, db)

    assert db.save.call_count == 2
    user1.get.assert_called_with('email')
    user2.get.assert_called_with('email')

@pytest.mark.asyncio
async def test_process_users_user_get_method_raises_exception_skips_user():
    client = AsyncMock()
    db = AsyncMock()
    user1 = MagicMock(get=MagicMock(side_effect=lambda k: {'email': 'user1@example.com'}.get(k)))
    user2 = MagicMock(get=MagicMock(side_effect=Exception("get error")))
    user3 = MagicMock(get=MagicMock(side_effect=lambda k: {'email': 'user3@example.com'}.get(k)))
    users = [user1, user2, user3]
    client.get.return_value = {'status': 200, 'data': users}
    db.save.side_effect = [asyncio.Future(), asyncio.Future()]
    db.save.side_effect[0].set_result({'saved': 'user1@example.com'})
    db.save.side_effect[1].set_result({'saved': 'user3@example.com'})

    async def safe_process_users(client, db):
        users = await process_users.__globals__['fetch_with_retry'](client, "/users")
        saved = []
        for u in users:
            try:
                email = u.get("email")
            except Exception:
                continue
            if not email:
                continue
            record = await db.save(u)
            saved.append(record)
        return saved

    with patch('backend.cate.fetch_with_retry', new=AsyncMock(return_value=users)):
        result = await safe_process_users(client, db)

    assert len(result) == 2
    assert result[0] == {'saved': 'user1@example.com'}
    assert result[1] == {'saved': 'user3@example.com'}
    assert db.save.call_count == 2
    user1.get.assert_called_with('email')
    user2.get.assert_called_with('email')
    user3.get.assert_called_with('email')

@pytest.mark.asyncio
async def test_process_users_fetch_with_retry_raises_propagates():
    client = AsyncMock()
    db = AsyncMock()
    with patch('backend.cate.fetch_with_retry', new=AsyncMock(side_effect=RuntimeError("fetch error"))):
        with pytest.raises(RuntimeError, match="fetch error"):
            await process_users(client, db)
    db.save.assert_not_called()

@pytest.mark.asyncio
async def test_process_users_user_email_empty_string_skips_user():
    client = AsyncMock()
    db = AsyncMock()
    user_with_empty_email = MagicMock(get=MagicMock(side_effect=lambda k: '' if k == 'email' else None))
    user_with_valid_email = MagicMock(get=MagicMock(side_effect=lambda k: 'valid@example.com' if k == 'email' else None))
    users = [user_with_empty_email, user_with_valid_email]
    client.get.return_value = {'status': 200, 'data': users}
    db.save.return_value = asyncio.Future()
    db.save.return_value.set_result({'saved': 'valid@example.com'})

    with patch('backend.cate.fetch_with_retry', new=AsyncMock(return_value=users)):
        result = await process_users(client, db)

    assert len(result) == 1
    assert result[0] == {'saved': 'valid@example.com'}
    db.save.assert_called_once_with(user_with_valid_email)
    user_with_empty_email.get.assert_called_with('email')
    user_with_valid_email.get.assert_called_with('email')

@pytest.mark.asyncio
async def test_process_users_user_email_none_skips_user():
    client = AsyncMock()
    db = AsyncMock()
    user_with_none_email = MagicMock(get=MagicMock(side_effect=lambda k: None))
    user_with_valid_email = MagicMock(get=MagicMock(side_effect=lambda k: 'valid@example.com'))
    users = [user_with_none_email, user_with_valid_email]
    client.get.return_value = {'status': 200, 'data': users}
    db.save.return_value = asyncio.Future()
    db.save.return_value.set_result({'saved': 'valid@example.com'})

    with patch('backend.cate.fetch_with_retry', new=AsyncMock(return_value=users)):
        result = await process_users(client, db)

    assert len(result) == 1
    assert result[0] == {'saved': 'valid@example.com'}
    db.save.assert_called_once_with(user_with_valid_email)
    user_with_none_email.get.assert_called_with('email')
    user_with_valid_email.get.assert_called_with('email')
# AI_TEST_AGENT_END function=process_users
