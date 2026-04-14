import React from 'react'
import { LoginForm } from '../../frontend/catf'
import { UserList } from '../../frontend/catf'
import { render, screen, fireEvent } from '@testing-library/react'
import { render, screen, waitFor } from '@testing-library/react'

// AI_TEST_AGENT_START function=LoginForm
describe('LoginForm', () => {
  it('shows error message when email does not contain "@" and does not call onSubmit', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'invalidemail.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with email when email contains "@" and clears error', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('user@example.com')
  })

  it('updates input value when user types', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'test@domain.com' } })
    expect(input).toHaveValue('test@domain.com')
  })

  it('shows error message again if user submits invalid email after a valid submission', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'valid@domain.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    fireEvent.change(input, { target: { value: 'invalidemail' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledTimes(1)
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
    expect(onSubmit).toHaveBeenCalledWith('user@@example.com')
  })

  it('handles email with "@" at start as valid', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: '@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledWith('@example.com')
  })

  it('handles email with "@" at end as valid', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'user@' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledWith('user@')
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
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })
    expect(api.getUsers).toHaveBeenCalledTimes(1)
  })

  it('renders empty list when api returns empty array', async () => {
    const api = { getUsers: jest.fn().mockResolvedValue([]) }
    render(<UserList api={api} />)
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull()
      expect(screen.queryByRole('listitem')).toBeNull()
      expect(screen.getByRole('list')).toBeInTheDocument()
    })
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
      expect(screen.queryByRole('listitem')).toBeNull()
      expect(screen.getByRole('list')).toBeInTheDocument()
    })
    expect(api.getUsers).toHaveBeenCalledTimes(1)
  })

  it('handles api returning array with invalid user objects', async () => {
    const users = [{ id: null, name: null }, { id: 3 }]
    const api = { getUsers: jest.fn().mockResolvedValue(users) }
    render(<UserList api={api} />)
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull()
      expect(screen.getByRole('list')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem').length).toBe(2)
    })
    expect(api.getUsers).toHaveBeenCalledTimes(1)
  })

  it('handles api returning array with duplicate user ids', async () => {
    const users = [
      { id: 1, name: 'Alice' },
      { id: 1, name: 'Alice Duplicate' },
    ]
    const api = { getUsers: jest.fn().mockResolvedValue(users) }
    render(<UserList api={api} />)
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull()
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Alice Duplicate')).toBeInTheDocument()
    })
    expect(api.getUsers).toHaveBeenCalledTimes(1)
  })

  it('handles api returning array with empty string names', async () => {
    const users = [
      { id: 1, name: '' },
      { id: 2, name: 'Bob' },
    ]
    const api = { getUsers: jest.fn().mockResolvedValue(users) }
    render(<UserList api={api} />)
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull()
      expect(screen.getByRole('list')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem').length).toBe(2)
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })
    expect(api.getUsers).toHaveBeenCalledTimes(1)
  })
})
// AI_TEST_AGENT_END function=UserList
