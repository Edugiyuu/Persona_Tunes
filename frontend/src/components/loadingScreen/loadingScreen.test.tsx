import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { BootstrapFailure } from '../../bootstrap/runBootstrap'
import LoadingScreen from './loadingScreen'

const baseProps = {
  canContinue: false,
  failures: [] as BootstrapFailure[],
  illustrationSrc: '/Persona_Tunes/imgs/Chie/WorkInProgress.png',
  onContinue: vi.fn(),
  onRetry: vi.fn(),
  settled: 2,
  status: 'loading' as const,
  total: 6,
}

describe('LoadingScreen', () => {
  it('announces truthful settled-resource progress with native semantics', () => {
    render(<LoadingScreen {...baseProps} />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparing Persona Tunes. 2 of 6 resources checked.',
    )
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '2')
    expect(screen.getByRole('progressbar')).toHaveAttribute('max', '6')
    expect(screen.getByText('2 / 6')).toBeInTheDocument()
  })

  it('identifies optional failures and exposes retry plus explicit continuation', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    const onRetry = vi.fn()
    const failure: BootstrapFailure = {
      critical: false,
      id: 'loader-art',
      kind: 'rejected',
      label: 'Chie loading illustration',
      reason: 'blocked',
    }

    render(
      <LoadingScreen
        {...baseProps}
        canContinue
        failures={[failure]}
        onContinue={onContinue}
        onRetry={onRetry}
        settled={6}
        status="degraded"
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Chie loading illustration: blocked',
    )
    const retry = screen.getByRole('button', { name: 'Retry startup' })
    await waitFor(() => expect(retry).toHaveFocus())

    await user.click(screen.getByRole('button', { name: 'Continue without optional resources' }))
    expect(onContinue).toHaveBeenCalledOnce()

    await user.click(retry)
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('keeps critical failures blocked with Retry as the only action', async () => {
    const failure: BootstrapFailure = {
      critical: true,
      id: 'font-faktos',
      kind: 'timed-out',
      label: 'Faktos font',
      reason: 'Timed out after 10000ms',
    }

    render(
      <LoadingScreen
        {...baseProps}
        failures={[failure]}
        settled={6}
        status="failed"
      />,
    )

    const retry = screen.getByRole('button', { name: 'Retry startup' })
    await waitFor(() => expect(retry).toHaveFocus())
    expect(
      screen.queryByRole('button', {
        name: 'Continue without optional resources',
      }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Required startup resources could not load.',
    )
  })

  it('replaces failed local illustration content with a CSS-backed accessible fallback', () => {
    render(<LoadingScreen {...baseProps} />)

    const illustration = screen.getByRole('img', {
      name: 'Chie cheering while Persona Tunes prepares',
    })
    expect(illustration).toHaveAttribute(
      'src',
      '/Persona_Tunes/imgs/Chie/WorkInProgress.png',
    )
    expect(illustration.getAttribute('src')).not.toMatch(/^https?:/)

    fireEvent.error(illustration)

    expect(
      screen.getByRole('img', {
        name: 'Chie cheering while Persona Tunes prepares',
      }),
    ).not.toBeInstanceOf(HTMLImageElement)
  })
  it('retries the illustration at the same URL when startup retry begins', () => {
    const { rerender } = render(
      <LoadingScreen {...baseProps} status="degraded" />,
    )
    const illustration = screen.getByRole('img', {
      name: 'Chie cheering while Persona Tunes prepares',
    })

    fireEvent.error(illustration)
    expect(screen.getByRole('img', {
      name: 'Chie cheering while Persona Tunes prepares',
    })).not.toBeInstanceOf(HTMLImageElement)

    rerender(<LoadingScreen {...baseProps} status="loading" />)

    expect(screen.getByRole('img', {
      name: 'Chie cheering while Persona Tunes prepares',
    })).toBeInstanceOf(HTMLImageElement)
  })
})