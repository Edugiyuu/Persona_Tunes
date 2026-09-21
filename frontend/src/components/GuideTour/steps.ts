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
  /**
   * Elizabeth reading `line` aloud, under `frontend/public/audios/Elizabeth`.
   * Served from the site root, so a player prefixes `import.meta.env.BASE_URL`
   * the way every other call site does. Every step has one; a step added
   * without one is read silently rather than holding the tour up.
   */
  readonly voice?: string
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
    line: 'I have been expecting you. My name is Elizabeth, and I will be your guide here. Press SELECT MUSIC to choose a song.',
    voice: '/audios/Elizabeth/Guide1.mp3',
  },
  {
    id: 'music-list',
    routes: ['/musics'],
    highlight: ['first-music'],
    advanceOn: ['first-music'],
    line: 'Here the songs are gathered. Choose one, and it will be prepared for you.',
    voice: '/audios/Elizabeth/Guide2.mp3',
  },
  {
    id: 'music-detail',
    routes: ['/musics'],
    highlight: ['music-panel'],
    advanceOn: [],
    line: 'Here the song is set out for you: its name, and the difficulty it will ask of you.',
    voice: '/audios/Elizabeth/Guide3.mp3',
    confirmLabel: 'CONTINUE',
  },
  {
    id: 'music-start',
    routes: ['/musics'],
    highlight: ['start-music'],
    advanceOn: ['start-music'],
    line: 'When you have decided, press START.',
    voice: '/audios/Elizabeth/Guide4.mp3',
  },
  {
    id: 'mode-intro',
    routes: ['/sing-music/'],
    highlight: [],
    advanceOn: [],
    line: 'The Velvet Room offers this song in two forms. You may accept only one.',
    voice: '/audios/Elizabeth/Guide5.mp3',
    confirmLabel: 'CONTINUE',
  },
  {
    id: 'mode-sing-together',
    routes: ['/sing-music/'],
    highlight: ['sing-together'],
    advanceOn: [],
    line: 'Sing together keeps the singer with you, so the melody is never truly lost.',
    voice: '/audios/Elizabeth/Guide6.mp3',
    confirmLabel: 'CONTINUE',
  },
  {
    id: 'mode-karaoke',
    routes: ['/sing-music/'],
    highlight: ['karaoke'],
    advanceOn: [],
    line: 'Karaoke takes her away, and leaves the melody entirely in your hands.',
    voice: '/audios/Elizabeth/Guide7.mp3',
    confirmLabel: 'CONTINUE',
  },
  {
    id: 'mode',
    routes: ['/sing-music/'],
    highlight: ['sing-together', 'karaoke'],
    advanceOn: ['karaoke', 'sing-together'],
    line: 'Now — choose whichever suits you. I shall listen either way.',
    voice: '/audios/Elizabeth/Guide8.mp3',
  },
  {
    id: 'briefing',
    routes: ['/sing-music/'],
    highlight: [],
    advanceOn: [],
    line: 'One more thing, the song will show you its lyrics. Speak them aloud, and do not hesitate.',
    voice: '/audios/Elizabeth/Guide9.mp3',
    confirmLabel: 'CONTINUE',
    holdsPlayback: true,
  },
  {
    id: 'briefing-score',
    routes: ['/sing-music/'],
    highlight: [],
    advanceOn: [],
    line: 'When it ends, you will be measured. I would not worry, humans are said to improve by repeating themselves.',
    voice: '/audios/Elizabeth/Guide10.mp3',
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
