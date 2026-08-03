import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import type { StartupResource } from './bootstrap/startupManifest'

vi.mock('./components/Home/Home', () => ({
  default: () => <main>Home route</main>,
}))
vi.mock('./components/SelectMusic/SelectMusic', () => ({
  default: () => <main>Select music route</main>,
}))
vi.mock('./components/SingMusic/SingMusic', () => ({
  default: () => <main>Sing music route</main>,
}))
vi.mock('./components/PatchNotes/PatchNotes', () => ({
  default: () => <main>Patch notes route</main>,
}))
vi.mock('./components/WorkInProgress/WorkInProgress', () => ({
  default: () => <main>Work in progress route</main>,
}))

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

function resource(
  id: string,
  critical: boolean,
  load: StartupResource['load'],
): StartupResource {
  return { critical, id, label: id, load }
}

describe('App bootstrap boundary', () => {
  it('keeps routes absent until every critical resource settles successfully', async () => {
    const gate = deferred()
    const resources = [resource('home-logo', true, () => gate.promise)]

    render(<App bootstrapResources={resources} bootstrapTimeoutMs={1_000} />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparing Persona Tunes. 0 of 1 resources checked.',
    )
    expect(screen.queryByText('Home route')).not.toBeInTheDocument()

    act(() => gate.resolve())

    expect(await screen.findByText('Home route')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders routes only after explicit continuation from an optional failure', async () => {
    const user = userEvent.setup()
    const resources = [
      resource('loader-art', false, () => Promise.reject(new Error('blocked'))),
    ]

    render(<App bootstrapResources={resources} bootstrapTimeoutMs={1_000} />)

    const continueButton = await screen.findByRole('button', {
      name: 'Continue without optional resources',
    })
    expect(screen.queryByText('Home route')).not.toBeInTheDocument()

    await user.click(continueButton)

    expect(await screen.findByText('Home route')).toBeInTheDocument()
  })

  it('blocks routes on critical failure and succeeds through Retry', async () => {
    const user = userEvent.setup()
    let attempt = 0
    const resources = [
      resource('font-faktos', true, () => {
        attempt += 1
        return attempt === 1
          ? Promise.reject(new Error('missing'))
          : Promise.resolve()
      }),
    ]

    render(<App bootstrapResources={resources} bootstrapTimeoutMs={1_000} />)

    const retry = await screen.findByRole('button', { name: 'Retry startup' })
    expect(
      screen.queryByRole('button', {
        name: 'Continue without optional resources',
      }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Home route')).not.toBeInTheDocument()

    await user.click(retry)

    await waitFor(() => expect(attempt).toBe(2))
    expect(await screen.findByText('Home route')).toBeInTheDocument()
  })
})