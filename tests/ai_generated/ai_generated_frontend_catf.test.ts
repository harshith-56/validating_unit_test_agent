import React from 'react'
import { LoginForm } from '../../frontend/catf'
import { render, screen, fireEvent } from '@testing-library/react'

// AI_TEST_AGENT_START function=LoginForm
describe('LoginForm', () => {
  it('shows error message when email does not contain "@"', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'invalidemail' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with email when email is valid', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('user@example.com')
  })

  it('clears error message after submitting valid email following invalid email', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'bademail' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'good@example.com' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('good@example.com')
  })

  it('handles empty string email input and shows error', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('handles email with multiple "@" characters as valid', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'user@@example.com' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('user@@example.com')
  })

  it('handles email with "@" at start as valid', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: '@example.com' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('@example.com')
  })

  it('handles email with "@" at end as valid', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'user@' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('user@')
  })

  it('does not call onSubmit if email is whitespace only', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=LoginForm
