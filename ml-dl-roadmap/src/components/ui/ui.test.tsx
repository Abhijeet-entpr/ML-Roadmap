import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

describe('StatusBadge', () => {
  it('renders status label accessibly', () => {
    render(<StatusBadge status="in_progress">In progress</StatusBadge>)
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })
})

describe('Button', () => {
  it('fires click handlers', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(
      <MemoryRouter>
        <Button onClick={() => { clicked = true }}>Complete task</Button>
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Complete task' }))
    expect(clicked).toBe(true)
  })
})
