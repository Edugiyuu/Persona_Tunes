import { lazy, Suspense, useMemo } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { createStartupManifest, publicAssetUrl } from './bootstrap/startupManifest'
import type { StartupResource } from './bootstrap/startupManifest'
import { useAppBootstrap } from './bootstrap/useAppBootstrap'
import LoadingScreen from './components/loadingScreen/loadingScreen'
import RouteErrorBoundary from './components/RouteErrorBoundary/RouteErrorBoundary'

const Home = lazy(() => import('./components/Home/Home'))
const SelectMusic = lazy(() => import('./components/SelectMusic/SelectMusic'))
const SingMusic = lazy(() => import('./components/SingMusic/SingMusic'))
const PatchNotes = lazy(() => import('./components/PatchNotes/PatchNotes'))
const WorkInProgress = lazy(
  () => import('./components/WorkInProgress/WorkInProgress'),
)

const DEFAULT_BOOTSTRAP_TIMEOUT_MS = 10_000

export interface AppProps {
  readonly bootstrapResources?: readonly StartupResource[]
  readonly bootstrapTimeoutMs?: number
}

function startupResourceUrl(
  resource: StartupResource | undefined,
): string | undefined {
  if (
    resource &&
    'url' in resource &&
    typeof resource.url === 'string'
  ) {
    return resource.url
  }

  return undefined
}

function App({
  bootstrapResources,
  bootstrapTimeoutMs = DEFAULT_BOOTSTRAP_TIMEOUT_MS,
}: AppProps) {
  const resources = useMemo(
    () =>
      bootstrapResources ??
      createStartupManifest(import.meta.env.BASE_URL),
    [bootstrapResources],
  )
  const bootstrap = useAppBootstrap({
    resources,
    timeoutMs: bootstrapTimeoutMs,
  })
  const illustrationSrc =
    startupResourceUrl(resources.find(({ id }) => id === 'loader-art')) ??
    publicAssetUrl(
      import.meta.env.BASE_URL,
      'imgs/Chie/WorkInProgress.png',
    )
  const unavailableStartupResourceIds = useMemo(
    () => new Set(bootstrap.failures.map(({ id }) => id)),
    [bootstrap.failures],
  )

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {bootstrap.canRenderRoutes ? (
        <RouteErrorBoundary>
          <Suspense
            fallback={
              <p aria-live="polite" role="status">
                Loading screen...
              </p>
            }
          >
            <Routes>
              <Route
                element={
                  <Home
                    unavailableStartupResourceIds={
                      unavailableStartupResourceIds
                    }
                  />
                }
                path="/"
              />
              <Route element={<SelectMusic />} path="/musics" />
              <Route element={<SingMusic />} path="/sing-music/:id" />
              <Route element={<PatchNotes />} path="/patch-notes" />
              <Route element={<WorkInProgress />} path="/work-in-progress" />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      ) : (
        <LoadingScreen
          canContinue={bootstrap.canContinue}
          failures={bootstrap.failures}
          illustrationSrc={illustrationSrc}
          onContinue={bootstrap.continueDegraded}
          onRetry={bootstrap.retry}
          settled={bootstrap.settled}
          status={bootstrap.status}
          total={bootstrap.total}
        />
      )}
    </BrowserRouter>
  )
}

export default App