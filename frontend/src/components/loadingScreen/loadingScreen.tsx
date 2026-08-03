import { useEffect, useRef, useState } from 'react'
import type { BootstrapFailure } from '../../bootstrap/runBootstrap'
import type { AppBootstrapStatus } from '../../bootstrap/useAppBootstrap'
import './loadingScreen.css'

export interface LoadingScreenProps {
  readonly canContinue: boolean
  readonly failures: readonly BootstrapFailure[]
  readonly illustrationSrc: string
  readonly onContinue: () => void
  readonly onRetry: () => void
  readonly settled: number
  readonly status: AppBootstrapStatus
  readonly total: number
}

const ILLUSTRATION_ALT = 'Chie cheering while Persona Tunes prepares'

function LoadingScreen({
  canContinue,
  failures,
  illustrationSrc,
  onContinue,
  onRetry,
  settled,
  status,
  total,
}: LoadingScreenProps) {
  const [illustrationFailed, setIllustrationFailed] = useState(false)
  const retryRef = useRef<HTMLButtonElement>(null)
  const hasFailure = status === 'degraded' || status === 'failed'
  const hasCriticalFailure = status === 'failed'

  useEffect(() => {
    if (status === 'loading') {
      setIllustrationFailed(false)
    }
  }, [illustrationSrc, status])

  useEffect(() => {
    if (hasFailure) {
      retryRef.current?.focus()
    }
  }, [hasFailure])

  const announcement =
    status === 'loading' || status === 'idle'
      ? `Preparing Persona Tunes. ${settled} of ${total} resources checked.`
      : status === 'degraded'
        ? 'Startup checks finished with optional resource failures.'
        : status === 'failed'
          ? 'Startup checks finished with required resource failures.'
          : 'Persona Tunes is ready.'

  return (
    <div className="loadingScreen">
      <section
        aria-label="Persona Tunes startup"
        className="loadingScreen__panel"
      >
        <div className="loadingScreen__artFrame">
          {illustrationFailed ? (
            <span
              aria-label={ILLUSTRATION_ALT}
              className="loadingScreen__artFallback"
              role="img"
            >
              PT
            </span>
          ) : (
            <img
              alt={ILLUSTRATION_ALT}
              className="loadingScreen__art"
              onError={() => setIllustrationFailed(true)}
              src={illustrationSrc}
            />
          )}
        </div>

        <div className="loadingScreen__content">
          <p
            aria-atomic="true"
            aria-live="polite"
            className="loadingScreen__status"
            role="status"
          >
            {announcement}
          </p>

          <div className="loadingScreen__progressRow">
            <progress
              aria-label="Startup resources checked"
              className="loadingScreen__progress"
              max={total}
              value={settled}
            />
            <span aria-hidden="true" className="loadingScreen__progressValue">
              {settled} / {total}
            </span>
          </div>

          {hasFailure && (
            <div className="loadingScreen__alert" role="alert">
              <p className="loadingScreen__alertTitle">
                {hasCriticalFailure
                  ? 'Required startup resources could not load.'
                  : 'Some optional startup resources could not load.'}
              </p>
              <ul className="loadingScreen__failureList">
                {failures.map((failure) => (
                  <li className="loadingScreen__failure" key={failure.id}>
                    <span className="loadingScreen__failureLabel">
                      {failure.label}:
                    </span>{' '}
                    {failure.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasFailure && (
            <div className="loadingScreen__actions">
              <button
                className="loadingScreen__button"
                onClick={onRetry}
                ref={retryRef}
                type="button"
              >
                Retry startup
              </button>
              {canContinue && (
                <button
                  className="loadingScreen__button loadingScreen__button--secondary"
                  onClick={onContinue}
                  type="button"
                >
                  Continue without optional resources
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default LoadingScreen