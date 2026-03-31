export async function fetchWithRetry(client: any, url: string, retries = 2) {
  let lastError: any;

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await client.get(url);

      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error("Bad response");
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(`Failed after retries: ${lastError}`);
}

export async function processUsers(client: any, db: any) {
  const users = await fetchWithRetry(client, "/users");

  const saved: any[] = [];

  for (const u of users) {
    if (!u?.email) continue;

    const record = await db.save(u);
    saved.push(record);
  }

  return saved;
}