import { describe, expect, it, vi } from 'vitest'
import { BootstrapAbortedError, runBootstrap } from './runBootstrap'
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

describe('runBootstrap', () => {
  it('reports only settled entries and becomes ready after every resource succeeds', async () => {
    const pending = deferred()
    const snapshots: Array<{ settled: number; total: number }> = []
    const run = runBootstrap(
      [
        resource('font-rodin-db', true, () => Promise.resolve()),
        resource('home-logo', true, () => pending.promise),
      ],
      {
        onProgress: ({ settled, total }) => snapshots.push({ settled, total }),
        timeoutMs: 1_000,
      },
    )

    await Promise.resolve()
    await Promise.resolve()
    expect(snapshots).toContainEqual({ settled: 1, total: 2 })
    expect(snapshots).not.toContainEqual({ settled: 2, total: 2 })

    pending.resolve()

    await expect(run).resolves.toMatchObject({
      failures: [],
      outcome: 'ready',
      settled: 2,
      total: 2,
    })
    expect(snapshots.at(-1)).toEqual({ settled: 2, total: 2 })
  })

  it('classifies an optional rejection as degraded with an identifiable reason', async () => {
    await expect(
      runBootstrap(
        [resource('loader-art', false, () => Promise.reject(new Error('blocked')))],
        { timeoutMs: 1_000 },
      ),
    ).resolves.toMatchObject({
      failures: [
        {
          critical: false,
          id: 'loader-art',
          kind: 'rejected',
          reason: 'blocked',
        },
      ],
      outcome: 'degraded',
    })
  })

  it('classifies a critical rejection as failed', async () => {
    await expect(
      runBootstrap(
        [resource('font-faktos', true, () => Promise.reject('unavailable'))],
        { timeoutMs: 1_000 },
      ),
    ).resolves.toMatchObject({
      failures: [
        {
          critical: true,
          id: 'font-faktos',
          kind: 'rejected',
          reason: 'unavailable',
        },
      ],
      outcome: 'failed',
    })
  })

  it('settles pending entries as timed out without inventing success', async () => {
    vi.useFakeTimers()
    const run = runBootstrap(
      [
        resource('home-logo', true, () => new Promise(() => undefined)),
        resource('star', false, () => Promise.resolve()),
      ],
      { timeoutMs: 500 },
    )

    await vi.advanceTimersByTimeAsync(500)

    await expect(run).resolves.toMatchObject({
      failures: [
        {
          critical: true,
          id: 'home-logo',
          kind: 'timed-out',
        },
      ],
      outcome: 'failed',
      settled: 2,
      total: 2,
    })
    vi.useRealTimers()
  })

  it('aborts active resource loaders and rejects with a typed abort error', async () => {
    const controller = new AbortController()
    let observedSignal: AbortSignal | undefined
    const run = runBootstrap(
      [
        resource('home-logo', true, (signal) => {
          observedSignal = signal
          return new Promise(() => undefined)
        }),
      ],
      { signal: controller.signal, timeoutMs: 1_000 },
    )

    controller.abort()

    await expect(run).rejects.toBeInstanceOf(BootstrapAbortedError)
    expect(observedSignal?.aborted).toBe(true)
  })
})