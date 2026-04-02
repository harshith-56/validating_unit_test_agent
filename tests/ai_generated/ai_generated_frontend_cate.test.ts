import * as cate from '../../frontend/cate'
import { fetchWithRetry } from '../../frontend/cate'
import { processUsers } from '../../frontend/cate'

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

  it('throws error after all retries when client.get returns non-200 status', async () => {
    const client = {
      get: jest.fn().mockResolvedValue({ status: 500, data: null }),
    }
    const call = () => fetchWithRetry(client, 'http://badstatus.com', 0)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Bad response')
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it('retries correct number of times when retries parameter is zero', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('Fail')),
    }
    const call = () => fetchWithRetry(client, 'http://zero.com', 0)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Fail')
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it('handles empty string url and throws after retries', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('Invalid URL')),
    }
    const call = () => fetchWithRetry(client, '', 1)
    await expect(call()).rejects.toThrow('Failed after retries: Error: Invalid URL')
    expect(client.get).toHaveBeenCalledTimes(2)
  })

  it('handles null url input and throws after retries', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new TypeError('url must be a string')),
    }
    // @ts-expect-error testing invalid input
    const call = () => fetchWithRetry(client, null, 1)
    await expect(call()).rejects.toThrow('Failed after retries: TypeError: url must be a string')
    expect(client.get).toHaveBeenCalledTimes(2)
  })

  it('handles client.get throwing non-Error exception and throws after retries', async () => {
    const client = {
      get: jest.fn().mockImplementation(() => {
        throw 'string error'
      }),
    }
    const call = () => fetchWithRetry(client, 'http://stringerror.com', 1)
    await expect(call()).rejects.toThrow('Failed after retries: string error')
    expect(client.get).toHaveBeenCalledTimes(2)
  })
})
// AI_TEST_AGENT_END function=fetchWithRetry

// AI_TEST_AGENT_START function=processUsers
jest.mock('../../frontend/cate', () => {
  const originalModule = jest.requireActual('../../frontend/cate')
  return {
    __esModule: true,
    ...originalModule,
    fetchWithRetry: jest.fn()
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
      { id: 2, email: 'b@example.com' }
    ]
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(users)
    mockDb.save.mockImplementation(u => ({ ...u, saved: true }))

    const result = await processUsers(mockClient, mockDb)

    expect(cate.fetchWithRetry).toHaveBeenCalledTimes(1)
    expect(cate.fetchWithRetry).toHaveBeenCalledWith(mockClient, '/users')
    expect(mockDb.save).toHaveBeenCalledTimes(2)
    expect(mockDb.save).toHaveBeenNthCalledWith(1, users[0])
    expect(mockDb.save).toHaveBeenNthCalledWith(2, users[1])
    expect(result).toEqual([
      { id: 1, email: 'a@example.com', saved: true },
      { id: 2, email: 'b@example.com', saved: true }
    ])
  })

  it('skips users without email and only saves those with email', async () => {
    const users = [
      { id: 1, email: 'a@example.com' },
      { id: 2 },
      { id: 3, email: 'c@example.com' },
      { id: 4, email: '' },
      { id: 5, email: null }
    ]
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(users)
    mockDb.save.mockImplementation(u => ({ ...u, saved: true }))

    const result = await processUsers(mockClient, mockDb)

    expect(cate.fetchWithRetry).toHaveBeenCalledTimes(1)
    expect(mockDb.save).toHaveBeenCalledTimes(2)
    expect(mockDb.save).toHaveBeenNthCalledWith(1, users[0])
    expect(mockDb.save).toHaveBeenNthCalledWith(2, users[2])
    expect(result).toEqual([
      { id: 1, email: 'a@example.com', saved: true },
      { id: 3, email: 'c@example.com', saved: true }
    ])
  })

  it('returns empty array if fetchWithRetry returns empty list', async () => {
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue([])

    const result = await processUsers(mockClient, mockDb)

    expect(cate.fetchWithRetry).toHaveBeenCalledTimes(1)
    expect(mockDb.save).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('handles fetchWithRetry throwing an error and propagates it', async () => {
    const error = new Error('Network failure')
    (cate.fetchWithRetry as jest.Mock).mockRejectedValue(error)

    await expect(processUsers(mockClient, mockDb)).rejects.toThrow('Network failure')
    expect(mockDb.save).not.toHaveBeenCalled()
  })

  it('handles db.save throwing an error and stops processing further users', async () => {
    const users = [
      { id: 1, email: 'a@example.com' },
      { id: 2, email: 'b@example.com' }
    ]
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(users)
    mockDb.save.mockImplementationOnce(() => ({ id: 1, saved: true }))
    const saveError = new Error('DB save failed')
    mockDb.save.mockImplementationOnce(() => { throw saveError })

    await expect(processUsers(mockClient, mockDb)).rejects.toThrow('DB save failed')
    expect(mockDb.save).toHaveBeenCalledTimes(2)
  })

  it('handles users with email as empty string or falsy values correctly', async () => {
    const users = [
      { id: 1, email: '' },
      { id: 2, email: 0 },
      { id: 3, email: false },
      { id: 4, email: 'valid@example.com' }
    ]
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(users)
    mockDb.save.mockImplementation(u => ({ ...u, saved: true }))

    const result = await processUsers(mockClient, mockDb)

    expect(mockDb.save).toHaveBeenCalledTimes(1)
    expect(mockDb.save).toHaveBeenCalledWith(users[3])
    expect(result).toEqual([{ id: 4, email: 'valid@example.com', saved: true }])
  })

  it('handles users array containing null or undefined entries gracefully', async () => {
    const users = [
      { id: 1, email: 'a@example.com' },
      null,
      undefined,
      { id: 2, email: 'b@example.com' }
    ]
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(users)
    mockDb.save.mockImplementation(u => ({ ...u, saved: true }))

    await expect(processUsers(mockClient, mockDb)).rejects.toThrow()
  })

  it('handles users with email as non-string types', async () => {
    const users = [
      { id: 1, email: 123 },
      { id: 2, email: { address: 'a@b.com' } },
      { id: 3, email: 'valid@example.com' }
    ]
    (cate.fetchWithRetry as jest.Mock).mockResolvedValue(users)
    mockDb.save.mockImplementation(u => ({ ...u, saved: true }))

    const result = await processUsers(mockClient, mockDb)

    expect(mockDb.save).toHaveBeenCalledTimes(3)
    expect(result).toEqual([
      { id: 1, email: 123, saved: true },
      { id: 2, email: { address: 'a@b.com' }, saved: true },
      { id: 3, email: 'valid@example.com', saved: true }
    ])
  })
})
// AI_TEST_AGENT_END function=processUsers
