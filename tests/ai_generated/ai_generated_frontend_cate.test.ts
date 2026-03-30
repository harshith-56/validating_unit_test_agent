import fetchWithRetry from '../../frontend/cate'

// AI_TEST_AGENT_START function=fetchWithRetry
describe('fetchWithRetry', () => {
  it('returns data when client.get resolves with status 200 on first try', async () => {
    const client = { get: jest.fn().mockResolvedValue({ status: 200, data: 'success' }) }
    const result = await fetchWithRetry(client, 'http://test.url')
    expect(result).toBe('success')
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it('throws error after retries when client.get always rejects', async () => {
    const client = { get: jest.fn().mockRejectedValue(new Error('network error')) }
    await expect(fetchWithRetry(client, 'http://test.url', 1)).rejects.toThrow('Failed after retries: Error: network error')
    expect(client.get).toHaveBeenCalledTimes(2)
  })

  it('throws error after retries when client.get returns non-200 status', async () => {
    const client = { get: jest.fn().mockResolvedValue({ status: 500, data: 'error' }) }
    await expect(fetchWithRetry(client, 'http://test.url', 0)).rejects.toThrow('Failed after retries: Error: Bad response')
    expect(client.get).toHaveBeenCalledTimes(1)
  })
})
// AI_TEST_AGENT_END function=fetchWithRetry
