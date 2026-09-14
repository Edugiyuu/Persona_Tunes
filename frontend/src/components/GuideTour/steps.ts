/**
 * Elizabeth's guided first run, as data (RT-UI-005).
 *
 * The copy here is final: it is quoted verbatim in the task's "The script"
 * table. Reordering or rewording a step is a change to this file only — no
 * component reads a line or a target by hand.
 */

/** Value of the `data-guide-target` attribute a page puts on the element. */
export type GuideTargetId =
  | 'select-music'
  | 'first-music'
  | 'start-music'
  | 'karaoke'
  | 'sing-together'

export type GuideStepId =
  | 'home'
  | 'music-list'
  | 'music-detail'
  | 'mode'
  | 'briefing'

export interface GuideStep {
  readonly id: GuideStepId
  /** Routes the step is allowed to be on. A tour anywhere else ends itself. */
  readonly routes: readonly string[]
  /** The element the spotlight cuts out. `null` — the step has no page target. */
  readonly highlight: GuideTargetId | null
  /** Clicking any of these advances the tour. Empty — the box advances it. */
  readonly advanceOn: readonly GuideTargetId[]
  readonly line: string
  /** Label of the control inside the dialogue box, when the box advances. */
  readonly confirmLabel?: string
}

export const GUIDE_ROUTES = ['/', '/musics', '/sing-music/'] as const

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    id: 'home',
    routes: ['/'],
    highlight: 'select-music',
    advanceOn: ['select-music'],
    line: 'Welcome. I am Elizabeth, attendant of the Velvet Room. Allow me to guide you — begin by choosing a song. Press SELECT MUSIC.',
  },
  {
    id: 'music-list',
    routes: ['/musics'],
    highlight: 'first-music',
    advanceOn: ['first-music'],
    line: 'Here is where you can SING songs, you people sing right?',
  },
  {
    id: 'music-detail',
    routes: ['/musics'],
    highlight: 'start-music',
    advanceOn: ['start-music'],
    line: 'Its details, and a taste of the melody. When it suits you, press START.',
  },
  {
    id: 'mode',
    routes: ['/sing-music/'],
    highlight: 'karaoke',
    advanceOn: ['karaoke', 'sing-together'],
    line: 'Two ways to perform. Sing together keeps the original singer beside you — their voice carries the melody, and you need only follow. Karaoke strips them away entirely. Only the instruments remain, and the song is yours alone to carry.',
  },
  {
    id: 'briefing',
    routes: ['/sing-music/'],
    highlight: null,
    advanceOn: [],
    line: 'A moment before we begin. The lyrics will appear as the song plays — sing them aloud, in time, and your microphone will record everything you offer. When the final note fades, your performance is measured and given a score. Do not be afraid of a poor result; I am told humans improve through repetition. Whenever you are ready, we shall start.',
    confirmLabel: 'BEGIN',
  },
]

export const GUIDE_NAME = 'Elizabeth'

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
