import { fetchWithRetry } from '../../frontend/cate'

// AI_TEST_AGENT_START function=fetchWithRetry
describe('fetchWithRetry', () => {
  it('returns data when client.get resolves with status 200 on first try', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({ status: 200, data: { success: true } }),
    }
    const url = 'http://example.com'
    const result = await fetchWithRetry(client, url, 2)
    expect(result).toEqual({ success: true })
    expect(client.get).toHaveBeenCalledTimes(1)
    expect(client.get).toHaveBeenCalledWith(url)
  })

  it('retries and returns data when client.get fails once then succeeds with status 200', async () => {
    const client = {
      get: jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ status: 200, data: { success: true } }),
    }
    const url = 'http://example.com'
    const result = await fetchWithRetry(client, url, 2)
    expect(result).toEqual({ success: true })
    expect(client.get).toHaveBeenCalledTimes(2)
    expect(client.get).toHaveBeenCalledWith(url)
  })

  it('throws error after all retries fail with client.get throwing errors', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('Network error')),
    }
    const url = 'http://example.com'
    const call = () => fetchWithRetry(client, url, 2)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Network error')
    expect(client.get).toHaveBeenCalledTimes(3)
    expect(client.get).toHaveBeenCalledWith(url)
  })

  it('throws error after all retries when client.get returns non-200 status', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({ status: 500, data: { error: 'Server error' } }),
    }
    const url = 'http://example.com'
    const call = () => fetchWithRetry(client, url, 1)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Bad response')
    expect(client.get).toHaveBeenCalledTimes(2)
    expect(client.get).toHaveBeenCalledWith(url)
  })

  it('handles zero retries and returns data if first call succeeds', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({ status: 200, data: { ok: true } }),
    }
    const url = 'http://example.com'
    const result = await fetchWithRetry(client, url, 0)
    expect(result).toEqual({ ok: true })
    expect(client.get).toHaveBeenCalledTimes(1)
    expect(client.get).toHaveBeenCalledWith(url)
  })

  it('handles zero retries and throws error if first call fails', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('Fail')),
    }
    const url = 'http://example.com'
    const call = () => fetchWithRetry(client, url, 0)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Fail')
    expect(client.get).toHaveBeenCalledTimes(1)
    expect(client.get).toHaveBeenCalledWith(url)
  })

  it('throws error with correct message when lastError is a string instead of Error object', async () => {
    const client = {
      get: jest.fn().mockRejectedValue('string error'),
    }
    const url = 'http://example.com'
    const call = () => fetchWithRetry(client, url, 1)
    await expect(call()).rejects.toThrow('Failed after retries: string error')
    expect(client.get).toHaveBeenCalledTimes(2)
    expect(client.get).toHaveBeenCalledWith(url)
  })

  it('throws error when url is empty string and client.get rejects', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('Invalid URL')),
    }
    const url = ''
    const call = () => fetchWithRetry(client, url, 1)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Invalid URL')
    expect(client.get).toHaveBeenCalledTimes(2)
    expect(client.get).toHaveBeenCalledWith(url)
  })

  it('throws error when url is null and client.get rejects', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('Invalid URL')),
    }
    const url = null as unknown as string
    const call = () => fetchWithRetry(client, url, 1)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Invalid URL')
    expect(client.get).toHaveBeenCalledTimes(2)
    expect(client.get).toHaveBeenCalledWith(url)
  })
})
// AI_TEST_AGENT_END function=fetchWithRetry
