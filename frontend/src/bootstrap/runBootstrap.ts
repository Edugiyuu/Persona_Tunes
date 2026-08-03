import type { StartupResource } from './startupManifest'

export type BootstrapOutcome = 'ready' | 'degraded' | 'failed'
export type BootstrapFailureKind = 'rejected' | 'timed-out'

export interface BootstrapFailure {
  readonly id: string
  readonly label: string
  readonly critical: boolean
  readonly kind: BootstrapFailureKind
  readonly reason: string
}

export interface BootstrapProgress {
  readonly settled: number
  readonly total: number
  readonly failures: readonly BootstrapFailure[]
}

export interface BootstrapRunResult extends BootstrapProgress {
  readonly outcome: BootstrapOutcome
}

export interface RunBootstrapOptions {
  readonly timeoutMs: number
  readonly signal?: AbortSignal
  readonly onProgress?: (progress: BootstrapProgress) => void
}

export class BootstrapAbortedError extends Error {
  constructor() {
    super('Bootstrap run was aborted')
    this.name = 'BootstrapAbortedError'
  }
}

function failureReason(reason: unknown): string {
  if (reason instanceof Error) {
    return reason.message
  }

  if (typeof reason === 'string') {
    return reason
  }

  try {
    return JSON.stringify(reason) ?? String(reason)
  } catch {
    return String(reason)
  }
}

export async function runBootstrap(
  resources: readonly StartupResource[],
  options: RunBootstrapOptions,
): Promise<BootstrapRunResult> {
  const controller = new AbortController()
  const pendingIds = new Set(resources.map(({ id }) => id))
  const failures: BootstrapFailure[] = []
  let settled = 0
  let resolveTimeout!: () => void
  let rejectAbort!: (error: BootstrapAbortedError) => void

  const notify = () => {
    options.onProgress?.({
      failures: [...failures],
      settled,
      total: resources.length,
    })
  }

  const settle = (resource: StartupResource, failure?: BootstrapFailure) => {
    if (!pendingIds.delete(resource.id)) {
      return
    }

    if (failure) {
      failures.push(failure)
    }
    settled += 1
    notify()
  }

  const abortPromise = new Promise<never>((_, reject) => {
    rejectAbort = reject
  })
  const timeoutPromise = new Promise<void>((resolve) => {
    resolveTimeout = resolve
  })

  const handleExternalAbort = () => {
    controller.abort()
    rejectAbort(new BootstrapAbortedError())
  }

  if (options.signal?.aborted) {
    handleExternalAbort()
  } else {
    options.signal?.addEventListener('abort', handleExternalAbort, { once: true })
  }

  notify()

  const resourceRuns = resources.map(async (resource) => {
    try {
      await resource.load(controller.signal)
      settle(resource)
    } catch (error) {
      if (!pendingIds.has(resource.id)) {
        return
      }

      if (controller.signal.aborted && options.signal?.aborted) {
        return
      }

      settle(resource, {
        critical: resource.critical,
        id: resource.id,
        kind: 'rejected',
        label: resource.label,
        reason: failureReason(error),
      })
    }
  })

  const allResources = Promise.all(resourceRuns).then(() => undefined)

  const timeoutHandle = setTimeout(() => {
    for (const resource of resources) {
      if (!pendingIds.has(resource.id)) {
        continue
      }

      settle(resource, {
        critical: resource.critical,
        id: resource.id,
        kind: 'timed-out',
        label: resource.label,
        reason: `Timed out after ${options.timeoutMs}ms`,
      })
    }

    controller.abort()
    resolveTimeout()
  }, Math.max(0, options.timeoutMs))

  try {
    await Promise.race([allResources, timeoutPromise, abortPromise])
  } finally {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle)
    }
    options.signal?.removeEventListener('abort', handleExternalAbort)
  }

  const outcome: BootstrapOutcome =
    failures.length === 0
      ? 'ready'
      : failures.some(({ critical }) => critical)
        ? 'failed'
        : 'degraded'

  return {
    failures,
    outcome,
    settled,
    total: resources.length,
  }
}
