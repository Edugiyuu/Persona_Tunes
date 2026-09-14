import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import {
  GuideTourContext,
  GUIDE_TARGET_TIMEOUT_MS,
  type GuidePhase,
  type GuideTourValue,
} from './guideContext'
import { hasAnsweredRecently, rememberAnswer } from './guideStorage'
import { GUIDE_STEPS, isTourRoute } from './steps'
import { useGuideElement } from './useGuideTarget'

export function GuideTourProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [phase, setPhase] = useState<GuidePhase>('idle')
  const [stepIndex, setStepIndex] = useState(0)

  const step = phase === 'running' ? (GUIDE_STEPS[stepIndex] ?? null) : null
  const nextStep = phase === 'running' ? (GUIDE_STEPS[stepIndex + 1] ?? null) : null

  const targetElement = useGuideElement(step?.highlight ?? null, pathname)
  const nextElement = useGuideElement(nextStep?.highlight ?? null, pathname)

  // Ask once, on the way in, and only where the tour starts.
  useEffect(() => {
    if (phase !== 'idle') {
      return
    }
    if (pathname === '/' && !hasAnsweredRecently()) {
      setPhase('asking')
    }
  }, [pathname, phase])

  const finish = useCallback(() => {
    setPhase('done')
    rememberAnswer()
  }, [])

  const accept = useCallback(() => {
    rememberAnswer()
    setStepIndex(0)
    setPhase('running')
  }, [])

  const advance = useCallback(() => {
    setStepIndex((current) => {
      if (current + 1 >= GUIDE_STEPS.length) {
        setPhase('done')
        return current
      }
      return current + 1
    })
  }, [])

  // A step also yields to the next one the moment that one's element shows up:
  // the player may reach it by a route the highlighted control did not own.
  useEffect(() => {
    if (phase === 'running' && nextStep?.highlight && nextElement) {
      advance()
    }
  }, [advance, nextElement, nextStep, phase])

  // Clicking the spotlit control moves the tour along. Capture phase, because
  // the control's own handler navigates and may unmount the page under us.
  useEffect(() => {
    if (phase !== 'running' || !step || step.advanceOn.length === 0) {
      return
    }

    const onClick = (event: MouseEvent) => {
      const origin = event.target
      if (!(origin instanceof Element)) {
        return
      }
      const tagged = origin.closest<HTMLElement>('[data-guide-target]')
      const id = tagged?.dataset.guideTarget
      if (id && step.advanceOn.includes(id as never)) {
        advance()
      }
    }

    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
    }
  }, [advance, phase, step])

  // Off the tour's routes, the guide has nothing to point at: leave quietly.
  useEffect(() => {
    if (phase === 'running' && !isTourRoute(pathname)) {
      finish()
    }
  }, [finish, pathname, phase])

  // An element that never arrives — an empty list, a failed request — ends the
  // tour instead of leaving a scrim over a screen with no way forward.
  useEffect(() => {
    if (phase !== 'running' || !step?.highlight || targetElement) {
      return
    }
    const timer = window.setTimeout(finish, GUIDE_TARGET_TIMEOUT_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [finish, phase, step, targetElement])

  const value = useMemo<GuideTourValue>(
    () => ({
      phase,
      step,
      targetElement,
      isActive: phase === 'asking' || phase === 'running',
      holdsPlayback: phase === 'running' && step?.id === 'briefing',
      accept,
      decline: finish,
      skip: finish,
      advance,
    }),
    [accept, advance, finish, phase, step, targetElement],
  )

  return (
    <GuideTourContext.Provider value={value}>
      {children}
    </GuideTourContext.Provider>
  )
}
