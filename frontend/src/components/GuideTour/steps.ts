/**
 * Elizabeth's guided first run, as data (RT-UI-005).
 *
 * The copy here is final: it is quoted verbatim in the task's "The script"
 * table. Reordering or rewording a step is a change to this file only — no
 * component reads a line or a target by hand.
 *
 * Two fields, and between them every shape a step comes in:
 *  - `highlight` — what the spotlight cuts out of the scrim. Any number of
 *    controls, so a step can light the one it is describing, or every one the
 *    player may choose between.
 *  - `advanceOn` — which of them, pressed, moves the tour on. A highlighted
 *    control missing from this list is being SHOWN, not offered: it is held
 *    out of the click so a press on it cannot run ahead of her line.
 * An empty `advanceOn` is Elizabeth talking rather than directing, and then
 * the player advances the step themselves with a click or a key; those steps
 * carry a `confirmLabel` and the box tells the player so.
 *
 * Keeping a line short enough to read in one breath is what splits a long
 * speech into several of these rather than one tall box.
 */

/** Value of the `data-guide-target` attribute a page puts on the element. */
export type GuideTargetId =
  | 'select-music'
  | 'first-music'
  | 'music-panel'
  | 'start-music'
  | 'karaoke'
  | 'sing-together'

export type GuideStepId =
  | 'home'
  | 'music-list'
  | 'music-detail'
  | 'music-start'
  | 'mode-intro'
  | 'mode-sing-together'
  | 'mode-karaoke'
  | 'mode'
  | 'briefing'
  | 'briefing-score'

export interface GuideStep {
  readonly id: GuideStepId
  /** Routes the step is allowed to be on. A tour anywhere else ends itself. */
  readonly routes: readonly string[]
  /** The elements the spotlight cuts out. Empty — nothing on the page is lit. */
  readonly highlight: readonly GuideTargetId[]
  /** Clicking any of these advances the tour. Empty — the player advances it. */
  readonly advanceOn: readonly GuideTargetId[]
  readonly line: string
  /** What the player is advancing towards, named in the box's own prompt. */
  readonly confirmLabel?: string
  /** The song waits while this step is up: she is still explaining it. */
  readonly holdsPlayback?: boolean
}

export const GUIDE_ROUTES = ['/', '/musics', '/sing-music/'] as const

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    id: 'home',
    routes: ['/'],
    highlight: ['select-music'],
    advanceOn: ['select-music'],
    line: 'Welcome. I am Elizabeth, attendant of the Velvet Room. Allow me to guide you — begin by choosing a song. Press SELECT MUSIC.',
  },
  {
    id: 'music-list',
    routes: ['/musics'],
    highlight: ['first-music'],
    advanceOn: ['first-music'],
    line: 'Here is where you can SING songs, you people sing right?',
  },
  {
    id: 'music-detail',
    routes: ['/musics'],
    highlight: ['music-panel'],
    advanceOn: [],
    line: 'Here the song is set out for you: its name, and the difficulty it will ask of you.',
    confirmLabel: 'CONTINUE',
  },
  {
    id: 'music-start',
    routes: ['/musics'],
    highlight: ['start-music'],
    advanceOn: ['start-music'],
    line: 'When you have decided, press START.',
  },
  {
    id: 'mode-intro',
    routes: ['/sing-music/'],
    highlight: [],
    advanceOn: [],
    line: 'There are two ways to perform, and you must choose one.',
    confirmLabel: 'CONTINUE',
  },
  {
    id: 'mode-sing-together',
    routes: ['/sing-music/'],
    highlight: ['sing-together'],
    advanceOn: [],
    line: 'Sing together keeps the original singer at your side — their voice carries the melody, and you need only follow.',
    confirmLabel: 'CONTINUE',
  },
  {
    id: 'mode-karaoke',
    routes: ['/sing-music/'],
    highlight: ['karaoke'],
    advanceOn: [],
    line: 'Karaoke takes them away entirely. Only the instruments remain, and the song is yours alone to carry.',
    confirmLabel: 'CONTINUE',
  },
  {
    id: 'mode',
    routes: ['/sing-music/'],
    highlight: ['sing-together', 'karaoke'],
    advanceOn: ['karaoke', 'sing-together'],
    line: 'Now — choose whichever suits you. I shall listen either way.',
  },
  {
    id: 'briefing',
    routes: ['/sing-music/'],
    highlight: [],
    advanceOn: [],
    line: 'A moment before we begin. The lyrics will appear as the song plays — sing them aloud, in time, and your microphone will keep everything you offer.',
    confirmLabel: 'CONTINUE',
    holdsPlayback: true,
  },
  {
    id: 'briefing-score',
    routes: ['/sing-music/'],
    highlight: [],
    advanceOn: [],
    line: 'When the final note fades, your performance is measured and given a score. Do not fear a poor result; I am told humans improve through repetition. Whenever you are ready, we shall start.',
    confirmLabel: 'BEGIN',
    holdsPlayback: true,
  },
]

export const GUIDE_NAME = 'Elizabeth'

/** Whether the player — not a spotlit control — is the one who advances it. */
export function isPlayerAdvanced(step: GuideStep): boolean {
  return step.advanceOn.length === 0
}

/** Lit to be looked at, not to be pressed: she is describing this one. */
export function isShowcase(step: GuideStep, id: GuideTargetId): boolean {
  return !step.advanceOn.includes(id)
}

export function stepAt(index: number): GuideStep | undefined {
  return GUIDE_STEPS[index]
}

export function stepIndexById(id: GuideStepId): number {
  return GUIDE_STEPS.findIndex((step) => step.id === id)
}

/** Whether `pathname` is one of the routes the tour ever runs on. */
export function isTourRoute(pathname: string): boolean {
  return GUIDE_ROUTES.some((route) =>
    route.endsWith('/') && route !== '/'
      ? pathname.startsWith(route)
      : pathname === route,
  )
}
