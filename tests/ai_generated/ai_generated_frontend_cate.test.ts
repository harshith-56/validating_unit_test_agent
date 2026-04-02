import * as cate from '../../frontend/cate'
import { fetchWithRetry } from '../../frontend/cate'
import { processUsers } from '../../frontend/cate'

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

  it('retries and returns data when client.get fails first then succeeds with status 200', async () => {
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

  it('throws error after all retries fail with rejected promises', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('Network error')),
    }
    const url = 'http://example.com'
    const call = () => fetchWithRetry(client, url, 2)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Network error')
    expect(client.get).toHaveBeenCalledTimes(3)
    expect(client.get).toHaveBeenCalledWith(url)
  })

  it('throws error after all retries when client.get resolves with non-200 status', async () => {
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
      get: jest.fn().mockRejectedValue(new Error('Network down')),
    }
    const url = 'http://example.com'
    const call = () => fetchWithRetry(client, url, 0)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Network down')
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
})
// AI_TEST_AGENT_END function=fetchWithRetry

// AI_TEST_AGENT_START function=processUsers
jest.mock('../../frontend/cate', () => {
  const originalModule = jest.requireActual('../../frontend/cate')
  return {
    __esModule: true,
    ...originalModule,
    fetchWithRetry: jest.fn(),
  }
})

describe('processUsers', () => {
  const mockClient = {}
  let mockDb: { save: jest.Mock }

  beforeEach(() => {
    mockDb = { save: jest.fn() }
    jest.clearAllMocks()
  })

  it('processes users with valid emails and saves them', async () => {
    const users = [
      { id: 1, email: 'a@example.com' },
      { id: 2, email: 'b@example.com' },
    ]
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(users)
    mockDb.save.mockImplementation(async (u) => ({ ...u, saved: true }))

    const result = await processUsers(mockClient, mockDb)

    expect(cate.fetchWithRetry).toHaveBeenCalledTimes(1)
    expect(cate.fetchWithRetry).toHaveBeenCalledWith(mockClient, '/users')
    expect(mockDb.save).toHaveBeenCalledTimes(2)
    expect(mockDb.save).toHaveBeenNthCalledWith(1, users[0])
    expect(mockDb.save).toHaveBeenNthCalledWith(2, users[1])
    expect(result).toEqual([
      { id: 1, email: 'a@example.com', saved: true },
      { id: 2, email: 'b@example.com', saved: true },
    ])
  })

  it('skips users without email and only saves those with email', async () => {
    const users = [
      { id: 1, email: 'a@example.com' },
      { id: 2 },
      { id: 3, email: 'c@example.com' },
      { id: 4, email: '' },
      { id: 5, email: null },
    ]
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(users)
    mockDb.save.mockImplementation(async (u) => ({ ...u, saved: true }))

    const result = await processUsers(mockClient, mockDb)

    expect(cate.fetchWithRetry).toHaveBeenCalledTimes(1)
    expect(mockDb.save).toHaveBeenCalledTimes(2)
    expect(mockDb.save).toHaveBeenNthCalledWith(1, users[0])
    expect(mockDb.save).toHaveBeenNthCalledWith(2, users[2])
    expect(result).toEqual([
      { id: 1, email: 'a@example.com', saved: true },
      { id: 3, email: 'c@example.com', saved: true },
    ])
  })

  it('returns empty array if fetchWithRetry returns empty list', async () => {
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue([])

    const result = await processUsers(mockClient, mockDb)

    expect(cate.fetchWithRetry).toHaveBeenCalledTimes(1)
    expect(mockDb.save).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('throws if fetchWithRetry throws an error', async () => {
    const error = new Error('Network failure')
    (cate.fetchWithRetry as jest.Mock).mockRejectedValue(error)

    await expect(processUsers(mockClient, mockDb)).rejects.toThrow('Network failure')
    expect(mockDb.save).not.toHaveBeenCalled()
  })

  it('handles db.save throwing an error and stops processing further users', async () => {
    const users = [
      { id: 1, email: 'a@example.com' },
      { id: 2, email: 'b@example.com' },
    ]
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(users)
    mockDb.save.mockImplementationOnce(async () => ({ id: 1, saved: true }))
    mockDb.save.mockImplementationOnce(async () => {
      throw new Error('DB save failed')
    })

    await expect(processUsers(mockClient, mockDb)).rejects.toThrow('DB save failed')
    expect(mockDb.save).toHaveBeenCalledTimes(2)
  })

  it('processes users with email as empty string or falsy values correctly', async () => {
    const users = [
      { id: 1, email: '' },
      { id: 2, email: 0 as any },
      { id: 3, email: false as any },
      { id: 4, email: 'valid@example.com' },
    ]
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(users)
    mockDb.save.mockImplementation(async (u) => ({ ...u, saved: true }))

    const result = await processUsers(mockClient, mockDb)

    expect(mockDb.save).toHaveBeenCalledTimes(1)
    expect(mockDb.save).toHaveBeenCalledWith(users[3])
    expect(result).toEqual([{ id: 4, email: 'valid@example.com', saved: true }])
  })

  it('processes users when fetchWithRetry returns null or undefined (invalid)', async () => {
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(null)

    await expect(processUsers(mockClient, mockDb)).rejects.toThrow()

    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(undefined)

    await expect(processUsers(mockClient, mockDb)).rejects.toThrow()
  })

  it('processes users when users array contains non-object entries', async () => {
    const users = [
      { id: 1, email: 'a@example.com' },
      null,
      undefined,
      123 as any,
      'string' as any,
      { id: 2, email: 'b@example.com' },
    ]
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(users)
    mockDb.save.mockImplementation(async (u) => ({ ...u, saved: true }))

    await expect(processUsers(mockClient, mockDb)).rejects.toThrow()
  })
})
// AI_TEST_AGENT_END function=processUsers
