import { fetchWithRetry } from '../../frontend/cate'

// AI_TEST_AGENT_START function=fetchWithRetry
describe('fetchWithRetry', () => {
  it('returns data when client.get resolves with status 200 on first try', async () => {
    const data = { foo: 'bar' }
    const client = {
      get: jest.fn().mockResolvedValue({ status: 200, data }),
    }
    const result = await fetchWithRetry(client, 'http://example.com')
    expect(result).toBe(data)
    expect(client.get).toHaveBeenCalledTimes(1)
    expect(client.get).toHaveBeenCalledWith('http://example.com')
  })

  it('retries and returns data when client.get fails once then succeeds with status 200', async () => {
    const data = { success: true }
    const client = {
      get: jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ status: 200, data }),
    }
    const result = await fetchWithRetry(client, 'http://retry.com', 2)
    expect(result).toBe(data)
    expect(client.get).toHaveBeenCalledTimes(2)
  })

  it('throws error after all retries when client.get always rejects', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('Network down')),
    }
    const call = () => fetchWithRetry(client, 'http://fail.com', 1)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Network down')
    expect(client.get).toHaveBeenCalledTimes(2)
  })

  it('throws error after all retries when client.get resolves with non-200 status', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({ status: 500, data: {} }),
    }
    const call = () => fetchWithRetry(client, 'http://badstatus.com', 0)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Bad response')
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it('handles zero retries and returns data if first call succeeds', async () => {
    const data = { ok: true }
    const client = {
      get: jest.fn().mockResolvedValue({ status: 200, data }),
    }
    const result = await fetchWithRetry(client, 'http://zero.com', 0)
    expect(result).toBe(data)
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it('handles zero retries and throws if first call fails', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('fail')),
    }
    const call = () => fetchWithRetry(client, 'http://zero-fail.com', 0)
    await expect(call()).rejects.toThrow('Failed after retries: Error: fail')
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it('throws error with correct message when last error is non-Error object', async () => {
    const client = {
      get: jest.fn().mockRejectedValue('string error'),
    }
    const call = () => fetchWithRetry(client, 'http://string-error.com', 1)
    await expect(call()).rejects.toThrow('Failed after retries: string error')
    expect(client.get).toHaveBeenCalledTimes(2)
  })

  it('throws error when url is empty string and client.get rejects', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('Invalid URL')),
    }
    const call = () => fetchWithRetry(client, '', 1)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Invalid URL')
    expect(client.get).toHaveBeenCalledTimes(2)
  })

  it('throws error when url is null and client.get rejects', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('Invalid URL')),
    }
    const call = () => fetchWithRetry(client, null as unknown as string, 1)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Invalid URL')
    expect(client.get).toHaveBeenCalledTimes(2)
  })
})
// AI_TEST_AGENT_END function=fetchWithRetry
