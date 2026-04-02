import React from 'react'
import { LoginForm } from '../../frontend/catf'
import { UserList } from '../../frontend/catf'
import { render, screen, fireEvent } from '@testing-library/react'
import { render, screen, waitFor } from '@testing-library/react'

// AI_TEST_AGENT_START function=LoginForm
describe('LoginForm', () => {
  it('shows error message when email does not contain "@"', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'invalidemail' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with email when email is valid', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('user@example.com')
  })

  it('clears error message after correcting invalid email and submitting valid email', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'bademail' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'good@email.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('good@email.com')
  })

  it('handles empty string email input and shows error', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('handles email with multiple "@" characters as valid', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'user@@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('user@@example.com')
  })

  it('handles email with "@" at start as valid', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: '@start.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('@start.com')
  })

  it('handles email with "@" at end as valid', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'end@' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('end@')
  })

  it('handles rapid input changes and submits last valid email', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'bademail' } })
    fireEvent.change(input, { target: { value: 'stillbad' } })
    fireEvent.change(input, { target: { value: 'valid@domain.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('valid@domain.com')
  })

  it('does not call onSubmit if onSubmit is not a function', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    render(<LoginForm onSubmit={null as any} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    consoleErrorSpy.mockRestore()
  })
})
// AI_TEST_AGENT_END function=LoginForm

// AI_TEST_AGENT_START function=UserList
describe('UserList', () => {
  it('renders loading initially', () => {
    const api = { getUsers: jest.fn(() => new Promise(() => {})) }
    render(<UserList api={api} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(api.getUsers).toHaveBeenCalledTimes(1)
  })

  it('renders list of users after successful fetch', async () => {
    const users = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]
    const api = { getUsers: jest.fn().mockResolvedValue(users) }
    render(<UserList api={api} />)
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull()
    })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(api.getUsers).toHaveBeenCalledTimes(1)
  })

  it('renders empty list when api returns empty array', async () => {
    const api = { getUsers: jest.fn().mockResolvedValue([]) }
    render(<UserList api={api} />)
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull()
    })
    expect(screen.queryByRole('listitem')).toBeNull()
    expect(api.getUsers).toHaveBeenCalledTimes(1)
  })

  it('handles api rejection by never removing loading state', async () => {
    const api = { getUsers: jest.fn().mockRejectedValue(new Error('fail')) }
    render(<UserList api={api} />)
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
    expect(api.getUsers).toHaveBeenCalledTimes(1)
  })

  it('handles api returning null instead of array', async () => {
    const api = { getUsers: jest.fn().mockResolvedValue(null) }
    render(<UserList api={api} />)
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull()
    })
    expect(screen.queryByRole('listitem')).toBeNull()
    expect(api.getUsers).toHaveBeenCalledTimes(1)
  })

  it('handles api returning array with null and undefined users', async () => {
    const users = [null, undefined, { id: 3, name: 'Charlie' }]
    const api = { getUsers: jest.fn().mockResolvedValue(users) }
    render(<UserList api={api} />)
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull()
    })
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    expect(api.getUsers).toHaveBeenCalledTimes(1)
  })

  it('handles users with missing id or name fields gracefully', async () => {
    const users = [
      { id: 4, name: 'Dana' },
      { id: 5 },
      { name: 'Eve' },
      {},
    ]
    const api = { getUsers: jest.fn().mockResolvedValue(users) }
    render(<UserList api={api} />)
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull()
    })
    expect(screen.getByText('Dana')).toBeInTheDocument()
    expect(screen.getByText('')).toBeInTheDocument()
    expect(api.getUsers).toHaveBeenCalledTimes(1)
  })
})
// AI_TEST_AGENT_END function=UserList
