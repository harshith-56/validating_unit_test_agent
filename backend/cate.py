#function
import asyncio

async def fetch_with_retry(client, url, retries=2):
    last_error = None

    for _ in range(retries + 1):
        try:
            res = await client.get(url)
            if res["status"] == 200:
                return res["data"]
            else:
                raise RuntimeError("Bad response")
        except Exception as e:
            last_error = e
            await asyncio.sleep(0)  # simulate retry delay

    raise RuntimeError(f"Failed after retries: {last_error}")




#function
async def process_users(client, db):
    users = await fetch_with_retry(client, "/users")

    saved = []
    for u in users:
        if not u.get("email"):
            continue

        record = await db.save(u)
        saved.append(record)

    return saved


