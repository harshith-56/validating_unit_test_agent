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
    expect(onSubmit).toBeCalledWith('user@example.com')
    expect(screen.queryByText('Invalid email')).toBeNull()
  })

  it('shows error message for invalid email without @', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: 'invalidemail' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toBeCalled()
  })

  it('handles empty email input as invalid', () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(onSubmit).not.toBeCalled()
  })
})
// AI_TEST_AGENT_END function=LoginForm
