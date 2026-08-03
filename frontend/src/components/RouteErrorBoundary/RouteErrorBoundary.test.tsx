import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import RouteErrorBoundary from './RouteErrorBoundary'

function BrokenRoute(): never {
  throw new Error('route chunk rejected')
}

describe('RouteErrorBoundary', () => {
  it('replaces a rejected route with an accessible reload action', async () => {
    const user = userEvent.setup()
    const onReload = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <RouteErrorBoundary onReload={onReload}>
        <BrokenRoute />
      </RouteErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Check your connection',
    )
    const reload = screen.getByRole('button', { name: 'Reload application' })
    expect(reload).toHaveFocus()

    await user.click(reload)

    expect(onReload).toHaveBeenCalledOnce()
    consoleError.mockRestore()
  })
})
