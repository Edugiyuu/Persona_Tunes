import { createContext, useContext } from 'react'
import type { GuideStep } from './steps'

/** How long a step waits for its element before the tour gives up (AC-6). */
export const GUIDE_TARGET_TIMEOUT_MS = 10_000

export type GuidePhase = 'idle' | 'asking' | 'running' | 'done'

export interface GuideTourValue {
  readonly phase: GuidePhase
  readonly step: GuideStep | null
  /** The element the current step spotlights, once it exists. */
  readonly targetElement: HTMLElement | null
  /** The prompt or the tour is on screen: pages should stay out of the way. */
  readonly isActive: boolean
  /** The briefing is up, so the song must not start yet (AC-8). */
  readonly holdsPlayback: boolean
  readonly accept: () => void
  readonly decline: () => void
  readonly skip: () => void
  readonly advance: () => void
}

/** What a page sees with no tour around it: nothing to obey. */
const INERT: GuideTourValue = {
  phase: 'idle',
  step: null,
  targetElement: null,
  isActive: false,
  holdsPlayback: false,
  accept: () => {},
  decline: () => {},
  skip: () => {},
  advance: () => {},
}

export const GuideTourContext = createContext<GuideTourValue>(INERT)

/**
 * Reading the guide never requires being inside it: a page rendered on its own
 * (a unit test, a route the tour never visits) sees an inert tour.
 */
export function useGuideTour(): GuideTourValue {
  return useContext(GuideTourContext)
}
