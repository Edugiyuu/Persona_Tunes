import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { RunBootstrapOptions } from './runBootstrap'
import { useAppBootstrap } from './useAppBootstrap'
import type { StartupResource } from './startupManifest'

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, reject, resolve }
}

function resource(
  id: string,
  critical: boolean,
  load: StartupResource['load'],
): StartupResource {
  return { critical, id, label: id, load }
}

describe('useAppBootstrap', () => {
  it('keeps routes gated while a resource is pending and releases them on success', async () => {
    const gate = deferred()
    const resources = [resource('home-logo', true, () => gate.promise)]
    const { result } = renderHook(() =>
      useAppBootstrap({ resources, timeoutMs: 1_000 }),
    )

    expect(result.current.status).toBe('loading')
    expect(result.current.canRenderRoutes).toBe(false)
    expect(result.current.settled).toBe(0)

    act(() => gate.resolve())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.canRenderRoutes).toBe(true)
    expect(result.current.settled).toBe(1)
  })

  it('requires explicit continuation after an optional failure', async () => {
    const resources = [
      resource('loader-art', false, () => Promise.reject(new Error('blocked'))),
    ]
    const { result } = renderHook(() =>
      useAppBootstrap({ resources, timeoutMs: 1_000 }),
    )

    await waitFor(() => expect(result.current.status).toBe('degraded'))
    expect(result.current.canContinue).toBe(true)
    expect(result.current.canRenderRoutes).toBe(false)
    expect(result.current.failures[0]).toMatchObject({
      id: 'loader-art',
      reason: 'blocked',
    })

    act(() => result.current.continueDegraded())

    expect(result.current.status).toBe('degraded')
    expect(result.current.canRenderRoutes).toBe(true)
  })

  it('does not allow continuation after a critical failure', async () => {
    const resources = [
      resource('font-faktos', true, () => Promise.reject(new Error('missing'))),
    ]
    const { result } = renderHook(() =>
      useAppBootstrap({ resources, timeoutMs: 1_000 }),
    )

    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(result.current.canContinue).toBe(false)

    act(() => result.current.continueDegraded())

    expect(result.current.canRenderRoutes).toBe(false)
  })

  it('surfaces an optional timeout as degraded and user-continuable', async () => {
    vi.useFakeTimers()
    const resources = [
      resource('shared-star', false, () => new Promise(() => undefined)),
    ]
    const { result } = renderHook(() =>
      useAppBootstrap({ resources, timeoutMs: 250 }),
    )

    await act(() => vi.advanceTimersByTimeAsync(250))

    expect(result.current.status).toBe('degraded')
    expect(result.current.failures[0]).toMatchObject({
      id: 'shared-star',
      kind: 'timed-out',
    })
    expect(result.current.canContinue).toBe(true)
  })

  it('retries with a fresh attempt and resets progress before reaching ready', async () => {
    let attempt = 0
    const load = vi.fn(() => {
      attempt += 1
      return attempt === 1
        ? Promise.reject(new Error('first attempt failed'))
        : Promise.resolve()
    })
    const resources = [resource('loader-art', false, load)]
    const { result } = renderHook(() =>
      useAppBootstrap({ resources, timeoutMs: 1_000 }),
    )

    await waitFor(() => expect(result.current.status).toBe('degraded'))

    act(() => result.current.retry())

    expect(result.current.status).toBe('loading')
    expect(result.current.settled).toBe(0)
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('aborts stale attempts on retry and the active attempt on unmount', async () => {
    const signals: AbortSignal[] = []
    const resources = [
      resource('home-logo', true, (signal) => {
        signals.push(signal)
        return new Promise(() => undefined)
      }),
    ]
    const { result, unmount } = renderHook(() =>
      useAppBootstrap({ resources, timeoutMs: 1_000 }),
    )

    await waitFor(() => expect(signals).toHaveLength(1))

    act(() => result.current.retry())

    await waitFor(() => expect(signals).toHaveLength(2))
    expect(signals[0].aborted).toBe(true)

    unmount()

    expect(signals[1].aborted).toBe(true)
  })
  it('preserves observed progress when the runner rejects unexpectedly', async () => {
    const resources = [
      resource('font-rodin-db', true, () => Promise.resolve()),
      resource('home-logo', true, () => Promise.resolve()),
    ]
    const runner = async (
      _resources: readonly StartupResource[],
      options: RunBootstrapOptions,
    ) => {
      options.onProgress?.({ failures: [], settled: 1, total: 2 })
      throw new Error('runner crashed')
    }
    const { result } = renderHook(() =>
      useAppBootstrap({ resources, runner, timeoutMs: 1_000 }),
    )

    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(result.current.settled).toBe(1)
    expect(result.current.total).toBe(2)
    expect(result.current.failures[0]?.id).toBe('bootstrap-run')
  })
})