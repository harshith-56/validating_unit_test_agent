import React from 'react'
import { LoginForm } from '../../frontend/catf'
import { render, screen, fireEvent } from '@testing-library/react'

// AI_TEST_AGENT_START function=LoginForm
describe('LoginForm', () => {
  it('calls onSubmit with valid email and clears error', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button'))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('user@example.com')
    expect(screen.queryByText('Invalid email')).toBeNull()
  })

  it('shows error message and does not call onSubmit for invalid email', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: 'invalidemail' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows error for empty email and does not call onSubmit', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
// AI_TEST_AGENT_END function=LoginForm
