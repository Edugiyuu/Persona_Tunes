import { useCallback, useEffect, useState } from 'react'
import {
  BootstrapAbortedError,
  runBootstrap,
  type BootstrapFailure,
  type BootstrapOutcome,
  type BootstrapProgress,
  type RunBootstrapOptions,
} from './runBootstrap'
import type { StartupResource } from './startupManifest'

export type AppBootstrapStatus = 'idle' | 'loading' | BootstrapOutcome

export interface AppBootstrapState extends BootstrapProgress {
  readonly status: AppBootstrapStatus
}

export interface AppBootstrapController extends AppBootstrapState {
  readonly canContinue: boolean
  readonly canRenderRoutes: boolean
  readonly continueDegraded: () => void
  readonly retry: () => void
}

export interface UseAppBootstrapOptions {
  readonly resources: readonly StartupResource[]
  readonly timeoutMs: number
  readonly runner?: (
    resources: readonly StartupResource[],
    options: RunBootstrapOptions,
  ) => ReturnType<typeof runBootstrap>
  readonly reportFailures?: (failures: readonly BootstrapFailure[]) => void
}

function loadingState(total: number): AppBootstrapState {
  return {
    failures: [],
    settled: 0,
    status: 'loading',
    total,
  }
}

function reportDevelopmentFailures(
  failures: readonly BootstrapFailure[],
): void {
  if (!import.meta.env.DEV) {
    return
  }

  for (const failure of failures) {
    console.error(
      `[startup-bootstrap] ${failure.id} (${failure.kind}): ${failure.reason}`,
    )
  }
}

function unexpectedFailure(error: unknown): BootstrapFailure {
  return {
    critical: true,
    id: 'bootstrap-run',
    kind: 'rejected',
    label: 'Application bootstrap',
    reason: error instanceof Error ? error.message : String(error),
  }
}

export function useAppBootstrap({
  reportFailures = reportDevelopmentFailures,
  resources,
  runner = runBootstrap,
  timeoutMs,
}: UseAppBootstrapOptions): AppBootstrapController {
  const [attempt, setAttempt] = useState(0)
  const [continued, setContinued] = useState(false)
  const [state, setState] = useState<AppBootstrapState>(() =>
    loadingState(resources.length),
  )

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    setState(loadingState(resources.length))

    void runner(resources, {
      onProgress: (progress) => {
        if (!active) {
          return
        }

        setState({
          ...progress,
          status: 'loading',
        })
      },
      signal: controller.signal,
      timeoutMs,
    }).then(
      (result) => {
        if (!active) {
          return
        }

        setState({
          failures: result.failures,
          settled: result.settled,
          status: result.outcome,
          total: result.total,
        })

        if (result.failures.length > 0) {
          reportFailures(result.failures)
        }
      },
      (error: unknown) => {
        if (!active || error instanceof BootstrapAbortedError) {
          return
        }

        const failure = unexpectedFailure(error)
        setState((currentState) => ({
          failures: [failure],
          settled: currentState.settled,
          status: 'failed',
          total: resources.length,
        }))
        reportFailures([failure])
      },
    )

    return () => {
      active = false
      controller.abort()
    }
  }, [attempt, reportFailures, resources, runner, timeoutMs])

  const retry = useCallback(() => {
    setContinued(false)
    setState(loadingState(resources.length))
    setAttempt((currentAttempt) => currentAttempt + 1)
  }, [resources.length])

  const continueDegraded = useCallback(() => {
    if (state.status === 'degraded') {
      setContinued(true)
    }
  }, [state.status])

  return {
    ...state,
    canContinue: state.status === 'degraded',
    canRenderRoutes:
      state.status === 'ready' || (state.status === 'degraded' && continued),
    continueDegraded,
    retry,
  }
}