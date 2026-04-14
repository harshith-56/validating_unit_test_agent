import {LoginForm} from '../../frontend/catf.ts'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// AI_TEST_AGENT_START function=LoginForm
describe('LoginForm', () => {
  it('renders input and submit button', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    expect(screen.getByPlaceholderText('email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('shows error message when email does not contain "@" and does not call onSubmit', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: 'invalidemail' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with email when email contains "@" and clears error', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).not.toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('user@example.com')
  })

  it('clears previous error message when submitting valid email after invalid email', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: 'invalidemail' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: 'valid@domain.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).not.toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledWith('valid@domain.com')
  })

  it('handles empty email input and shows error', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('handles email with multiple "@" characters as valid', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: 'user@@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText('Invalid email')).not.toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledWith('user@@example.com')
  })

  it('does not show error message initially', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    expect(screen.queryByText('Invalid email')).not.toBeInTheDocument()
  })
})
// AI_TEST_AGENT_END function=LoginForm
