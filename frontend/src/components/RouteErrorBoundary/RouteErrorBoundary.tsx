import { Component, type ErrorInfo, type ReactNode } from 'react'
import './RouteErrorBoundary.css'

interface RouteErrorBoundaryProps {
  readonly children: ReactNode
  readonly onReload?: () => void
}

interface RouteErrorBoundaryState {
  readonly failed: boolean
}

class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[route-chunk] Route failed to render', error, info)
    }
  }

  private readonly reload = (): void => {
    if (this.props.onReload) {
      this.props.onReload()
      return
    }

    window.location.reload()
  }

  render(): ReactNode {
    if (!this.state.failed) {
      return this.props.children
    }

    return (
      <main className="routeErrorBoundary">
        <section
          aria-labelledby="route-error-title"
          className="routeErrorBoundary__panel"
        >
          <p className="routeErrorBoundary__eyebrow">PERSONA TUNES</p>
          <h1 id="route-error-title">This screen could not load.</h1>
          <p className="routeErrorBoundary__message" role="alert">
            Check your connection, then reload the application to try the screen
            again.
          </p>
          <button
            autoFocus
            className="routeErrorBoundary__button"
            onClick={this.reload}
            type="button"
          >
            Reload application
          </button>
        </section>
      </main>
    )
  }
}

export default RouteErrorBoundary
