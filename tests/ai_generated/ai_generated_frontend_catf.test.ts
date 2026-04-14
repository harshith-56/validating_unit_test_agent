import React from 'react'
import { LoginForm } from '../../frontend/catf'
import { render, screen, fireEvent } from '@testing-library/react'

// AI_TEST_AGENT_START function=LoginForm
describe('LoginForm', () => {
  it('shows error message when email does not contain "@" and does not call onSubmit', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'invalidemail' } })
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

  it('shows error message again if user corrects invalid email to another invalid email and does not call onSubmit', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'bademail' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'stillbademail' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('clears error message if user fixes email after invalid submission and submits successfully', () => {
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

  it('handles empty string email input and shows error without calling onSubmit', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('handles email with multiple "@" characters and calls onSubmit', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'user@@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('user@@example.com')
  })

  it('handles email with "@" at the start and calls onSubmit', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: '@start.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('@start.com')
  })

  it('handles email with "@" at the end and calls onSubmit', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('email')
    fireEvent.change(input, { target: { value: 'end@' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('end@')
  })
})
// AI_TEST_AGENT_END function=LoginForm
