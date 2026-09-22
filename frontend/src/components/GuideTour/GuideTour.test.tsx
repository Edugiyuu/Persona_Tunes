import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Home from '../Home/Home'
import ModeSelector from '../ModeSelector/ModeSelector'
import GuideTour from './GuideTour'
import { GuideTourProvider } from './GuideTourProvider'
import { useGuideTour } from './guideContext'
import { GUIDE_STORAGE_KEY, GUIDE_TTL_MS } from './guideStorage'
import { GUIDE_STEPS } from './steps'
import { resetGuideVoiceElement } from './voice'

vi.mock('../Home/animations', () => ({
  useStarAnimations: vi.fn(),
  useLogoAnimation: vi.fn(),
  useMenuAnimations: vi.fn(),
}))
vi.mock('../ModeSelector/animation', () => ({
  triggerModeSelector: vi.fn(),
  useModeAnimations: vi.fn(),
}))
vi.mock('../../utils/PlayAudio', () => ({ PlayAudio: vi.fn() }))
// The real link wraps navigation in a GSAP transition; the tour only cares
// that the click lands and the route changes, so keep the attributes and drop
// the timeline.
vi.mock('../../utils/CustomLink', () => ({
  default: function MockCustomLink({
    to,
    title,
    className,
    ...rest
  }: {
    to: string
    title: string
    className?: string
  }) {
    const navigate = useNavigate()
    return (
      <a
        className={className}
        href={to}
        onClick={(event) => {
          event.preventDefault()
          navigate(to)
        }}
        {...rest}
      >
        <span>{title}</span>
      </a>
    )
  },
}))

const lineOf = (id: string) =>
  GUIDE_STEPS.find((step) => step.id === id)?.line ?? ''

/** Stands in for `/musics`: the list, and the detail panel it opens in place. */
const MusicListPage = ({ songs = 1 }: { songs?: number }) => {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<number | null>(null)
  return (
    <div>
      {Array.from({ length: songs }, (_, index) => (
        <div key={index}>
          <button
            data-guide-target={index === 0 ? 'first-music' : undefined}
            onClick={() => setSelected(index)}
            type="button"
          >
            {`VIEW MUSIC ${index}`}
          </button>
        </div>
      ))}
      {selected !== null && (
        <div data-guide-target="music-panel">
          <p>Difficulty: A</p>
          <button
            data-guide-target="start-music"
            onClick={() => navigate('/sing-music/abc')}
            type="button"
          >
            START!
          </button>
        </div>
      )}
    </div>
  )
}

/** Stands in for `SingMusic`'s player gate: it exists only while allowed. */
const SingMusicPage = () => {
  const { holdsPlayback } = useGuideTour()
  const [mode, setMode] = useState(true)
  return (
    <div>
      {mode && <ModeSelector handleModeSelect={() => setMode(false)} />}
      {!mode && !holdsPlayback && <div data-testid="audio-player" />}
    </div>
  )
}

const renderApp = ({
  entry = '/',
  songs = 1,
}: { entry?: string; songs?: number } = {}) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <GuideTourProvider>
        <Routes>
          <Route element={<Home />} path="/" />
          <Route element={<MusicListPage songs={songs} />} path="/musics" />
          <Route element={<SingMusicPage />} path="/sing-music/:id" />
          <Route element={<p>patch notes</p>} path="/patch-notes" />
        </Routes>
        <GuideTour />
      </GuideTourProvider>
    </MemoryRouter>,
  )

const accept = () => fireEvent.click(screen.getByText('YES, PLEASE'))

const highlighted = (): HTMLElement | null =>
  document.querySelector('[data-guide-highlighted="true"]')

/** Every control the current step lights, in the order the page renders them. */
const allHighlighted = (): string[] =>
  [...document.querySelectorAll<HTMLElement>('[data-guide-highlighted="true"]')]
    .map((element) => element.dataset.guideTarget ?? '')

/** Dismisses a step Elizabeth advances herself, the way a player would. */
const advanceBox = () =>
  fireEvent.click(document.querySelector('.GuideDialogueBox') as HTMLElement)

/** Walks the tour from the prompt to the step named. */
const walkTo = (
  step:
    | 'music-list'
    | 'music-detail'
    | 'music-start'
    | 'mode-intro'
    | 'mode-sing-together'
    | 'mode-karaoke'
    | 'mode'
    | 'briefing'
    | 'briefing-score',
) => {
  accept()
  fireEvent.click(screen.getByText('SELECT MUSIC'))
  if (step === 'music-list') return
  fireEvent.click(screen.getByText('VIEW MUSIC 0'))
  if (step === 'music-detail') return
  advanceBox()
  if (step === 'music-start') return
  fireEvent.click(screen.getByText('START!'))
  if (step === 'mode-intro') return
  advanceBox()
  if (step === 'mode-sing-together') return
  advanceBox()
  if (step === 'mode-karaoke') return
  advanceBox()
  if (step === 'mode') return
  fireEvent.click(screen.getByText('Karaoke'))
  if (step === 'briefing') return
  advanceBox()
}

beforeEach(() => {
  window.localStorage.clear()
  resetGuideVoiceElement()
})

/**
 * Her voice, watched at the element: the module keeps a single one to itself
 * and the component only ever asks it to start and stop, so `play` and `pause`
 * are the whole of what there is to assert on.
 */
const playing = vi.fn()
const paused = vi.fn()

/** The element she is speaking through — the `this` of the last `play()`. */
const voiceElementUnderTest = () =>
  playing.mock.instances.at(-1) as HTMLAudioElement

/** Which recording is loaded in it. */
const currentSrc = () => voiceElementUnderTest().src

/** The open-mouthed frame, whose flag is whether she is talking. */
const speakingFrame = () =>
  document.querySelector('.GuidePortraitSpeaking') as HTMLElement

describe('the opt-in prompt', () => {
  it('asks on a first load of home and offers both answers (AC-1)', () => {
    renderApp()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('YES, PLEASE')).toBeInTheDocument()
    expect(screen.getByText('NO, THANK YOU')).toBeInTheDocument()
    expect(document.querySelector('.GuideScrim')).toBeInTheDocument()
  })

  it('does not ask anywhere but home', () => {
    renderApp({ entry: '/musics' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('declining leaves home clean and remembers the answer (AC-2)', () => {
    renderApp()

    fireEvent.click(screen.getByText('NO, THANK YOU'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.GuideScrim')).not.toBeInTheDocument()
    expect(window.localStorage.getItem(GUIDE_STORAGE_KEY)).not.toBeNull()
  })

  it('Esc declines from anywhere on the page (AC-2)', () => {
    renderApp()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(window.localStorage.getItem(GUIDE_STORAGE_KEY)).not.toBeNull()
  })
})

describe('persistence', () => {
  it('stays quiet for a day after an answer (AC-11)', () => {
    window.localStorage.setItem(GUIDE_STORAGE_KEY, String(Date.now() - 1000))

    renderApp()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('asks again once the answer is older than a day (AC-11)', () => {
    window.localStorage.setItem(
      GUIDE_STORAGE_KEY,
      String(Date.now() - GUIDE_TTL_MS - 1),
    )

    renderApp()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('ignores a garbled entry rather than trusting it (AC-11)', () => {
    window.localStorage.setItem(GUIDE_STORAGE_KEY, 'yesterday, i think')

    renderApp()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('survives a storage that throws on every access (AC-11)', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('private window')
      })
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('private window')
      })

    expect(() => {
      renderApp()
      fireEvent.click(screen.getByText('NO, THANK YOU'))
    }).not.toThrow()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    getItem.mockRestore()
    setItem.mockRestore()
  })
})

describe('the guided run', () => {
  it('accepting opens the tour on Elizabeth and her first line (AC-3)', () => {
    renderApp()

    accept()

    expect(document.querySelector('.GuideScrim')).toBeInTheDocument()
    expect(document.querySelectorAll('.GuidePortraitFrame')).toHaveLength(2)
    expect(screen.getByText('Elizabeth')).toBeInTheDocument()
    expect(screen.getByText(lineOf('home'))).toBeInTheDocument()
  })

  it('spotlights the step target and leaves it clickable (AC-4)', () => {
    renderApp()

    accept()

    const target = highlighted()
    expect(target).toHaveAttribute('data-guide-target', 'select-music')
    expect(target).toHaveTextContent('SELECT MUSIC')
    fireEvent.click(screen.getByText('SELECT MUSIC'))
    expect(screen.getByText('VIEW MUSIC 0')).toBeInTheDocument()
  })

  it('follows the player across a route change (AC-5)', () => {
    renderApp()

    accept()
    fireEvent.click(screen.getByText('SELECT MUSIC'))

    expect(screen.getByText(lineOf('music-list'))).toBeInTheDocument()
    expect(highlighted()).toHaveAttribute('data-guide-target', 'first-music')
    expect(document.querySelectorAll('.GuidePortraitFrame')).toHaveLength(2)
  })

  it('walks the list, the detail panel and the mode screen (AC-6, AC-7)', () => {
    renderApp()

    walkTo('music-list')
    expect(highlighted()).toHaveAttribute('data-guide-target', 'first-music')

    fireEvent.click(screen.getByText('VIEW MUSIC 0'))
    expect(screen.getByText(lineOf('music-detail'))).toBeInTheDocument()
    // The whole panel first — she is reading it out, not pointing at a control.
    expect(highlighted()).toHaveAttribute('data-guide-target', 'music-panel')

    advanceBox()
    expect(screen.getByText(lineOf('music-start'))).toBeInTheDocument()
    expect(highlighted()).toHaveAttribute('data-guide-target', 'start-music')

    fireEvent.click(screen.getByText('START!'))
    expect(screen.getByText(lineOf('mode-intro'))).toBeInTheDocument()
    // Nothing is lit while she says there are two of them.
    expect(highlighted()).toBeNull()
  })

  it('lights each mode as she describes it, without offering the press', () => {
    renderApp()

    walkTo('mode-sing-together')
    expect(allHighlighted()).toEqual(['sing-together'])
    expect(
      document.querySelector('[data-guide-target="sing-together"]'),
    ).toHaveAttribute('data-guide-showcase', 'true')

    advanceBox()
    expect(screen.getByText(lineOf('mode-karaoke'))).toBeInTheDocument()
    expect(allHighlighted()).toEqual(['karaoke'])
  })

  it('lights both entries once the choice is really the player to make', () => {
    renderApp()

    walkTo('mode')

    expect(screen.getByText(lineOf('mode'))).toBeInTheDocument()
    expect(allHighlighted()).toEqual(['sing-together', 'karaoke'])
    // Neither is a showcase any more: both are there to be pressed.
    expect(
      document.querySelectorAll('[data-guide-showcase="true"]'),
    ).toHaveLength(0)
  })

  it('takes either mode to the briefing (AC-7)', () => {
    renderApp()

    walkTo('mode')
    fireEvent.click(screen.getByText('Sing together'))

    expect(screen.getByText(lineOf('briefing'))).toBeInTheDocument()
  })

  it('does not choose a mode from a press on the one she is describing', () => {
    renderApp()

    walkTo('mode-sing-together')
    fireEvent.click(screen.getByText('Sing together'))

    // The press moved her on; it did not pick the mode and skip the rest.
    expect(screen.getByText(lineOf('mode-karaoke'))).toBeInTheDocument()
    expect(screen.getByText('Sing together')).toBeInTheDocument()
  })

  it('holds the song across both briefing steps, then lets it play (AC-8, AC-9)', () => {
    renderApp()

    walkTo('briefing')
    expect(screen.getByText(lineOf('briefing'))).toBeInTheDocument()
    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument()

    advanceBox()
    expect(screen.getByText(lineOf('briefing-score'))).toBeInTheDocument()
    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('BEGIN'))

    expect(screen.getByTestId('audio-player')).toBeInTheDocument()
    expect(document.querySelector('.GuideScrim')).not.toBeInTheDocument()
    expect(document.querySelector('.GuidePortrait')).not.toBeInTheDocument()
    expect(highlighted()).toBeNull()
  })

  it('tells the player how to move past a step she advances herself', () => {
    renderApp()

    walkTo('mode-intro')

    const box = document.querySelector('.GuideDialogueBox') as HTMLElement
    expect(box).toHaveAttribute('data-guide-advance', 'true')
    expect(box).toHaveTextContent('Click or press Enter to CONTINUE')
  })

  it('moves on from a click anywhere, not only on the box', () => {
    renderApp()

    walkTo('mode-intro')
    fireEvent.click(document.querySelector('.GuideScrim') as HTMLElement)

    expect(screen.getByText(lineOf('mode-sing-together'))).toBeInTheDocument()
  })

  it('moves past it on a key as well as on a click', () => {
    renderApp()

    walkTo('mode-intro')
    fireEvent.keyDown(document, { key: 'Enter' })

    expect(screen.getByText(lineOf('mode-sing-together'))).toBeInTheDocument()
  })

  it('leaves the keys alone on a step the spotlit control advances', () => {
    renderApp()

    walkTo('music-list')
    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: ' ' })

    expect(screen.getByText(lineOf('music-list'))).toBeInTheDocument()
  })

  it('counts a press on the box prompt once, not twice', () => {
    renderApp()

    walkTo('briefing')
    fireEvent.click(screen.getByText('CONTINUE'))

    expect(screen.getByText(lineOf('briefing-score'))).toBeInTheDocument()
  })

  it('counts a press on the spotlit control once, not twice', () => {
    renderApp()

    walkTo('mode')
    fireEvent.click(screen.getByText('Karaoke'))

    expect(screen.getByText(lineOf('briefing'))).toBeInTheDocument()
  })

  // The tour carries no skip control: the player opted in at the prompt, and
  // walking off the script is the way out (below).
  it('offers nothing to press but the step itself', () => {
    renderApp()

    walkTo('music-list')

    expect(screen.queryByText('SKIP GUIDE')).not.toBeInTheDocument()
    expect(document.querySelector('.GuideSkip')).not.toBeInTheDocument()
  })

  it('leaves quietly when the player walks off the route (AC-10)', () => {
    renderApp()

    accept()
    fireEvent.click(screen.getByText('PATCH NOTES'))

    expect(screen.getByText('patch notes')).toBeInTheDocument()
    expect(document.querySelector('.GuideScrim')).not.toBeInTheDocument()
  })

  it('gives up when the step target never arrives (AC-6)', () => {
    vi.useFakeTimers()
    try {
      renderApp({ songs: 0 })

      accept()
      fireEvent.click(screen.getByText('SELECT MUSIC'))
      expect(screen.getByText(lineOf('music-list'))).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(10_000)
      })

      expect(document.querySelector('.GuideScrim')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('her voice', () => {
  beforeEach(() => {
    playing.mockReset().mockResolvedValue(undefined)
    paused.mockReset()
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(playing)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(paused)
  })

  it('reads her line aloud from the step that opens the tour', () => {
    renderApp()

    accept()

    expect(playing).toHaveBeenCalledTimes(1)
    expect(currentSrc()).toContain('/audios/Elizabeth/Guide1.mp3')
  })

  it('plays each step in turn, and never two of her at once', () => {
    renderApp()

    walkTo('music-list')

    expect(currentSrc()).toContain('/audios/Elizabeth/Guide2.mp3')
    // Stopped on the way out of the first step, so the welcome is not still
    // running underneath the line now on screen.
    expect(paused).toHaveBeenCalled()
    expect(playing).toHaveBeenCalledTimes(2)
  })

  it('has a recording for every line she has', () => {
    expect(GUIDE_STEPS.filter((step) => !step.voice)).toEqual([])
  })

  it('keeps speaking through the briefing, which holds the song', () => {
    renderApp()

    walkTo('briefing-score')

    expect(currentSrc()).toContain('/audios/Elizabeth/Guide10.mp3')
    expect(playing).toHaveBeenCalledTimes(GUIDE_STEPS.length)
  })

  it('falls quiet when the recording ends, with her line left on screen', () => {
    renderApp()

    accept()
    expect(speakingFrame()).toHaveAttribute('data-guide-speaking', 'true')

    act(() => {
      voiceElementUnderTest().dispatchEvent(new Event('ended'))
    })

    expect(speakingFrame()).toHaveAttribute('data-guide-speaking', 'false')
    expect(screen.getByText(lineOf('home'))).toBeInTheDocument()
  })

  it('times her mouth off the line when the recording will not play', async () => {
    playing.mockRejectedValue(new Error('autoplay refused'))
    renderApp()

    accept()
    await act(async () => {})

    // Still talking: the guess took over, rather than her mouth shutting the
    // moment the browser refused the audio.
    expect(speakingFrame()).toHaveAttribute('data-guide-speaking', 'true')
  })
})

describe('the page hooks the tour relies on', () => {
  it('marks SELECT MUSIC on the home menu', () => {
    renderApp()
    fireEvent.click(screen.getByText('NO, THANK YOU'))

    expect(
      document.querySelector('[data-guide-target="select-music"]'),
    ).toHaveTextContent('SELECT MUSIC')
  })

  it('marks both entries on the mode selector', () => {
    render(<ModeSelector handleModeSelect={vi.fn()} />)

    expect(
      document.querySelector('[data-guide-target="sing-together"]'),
    ).toHaveTextContent('Sing together')
    expect(
      document.querySelector('[data-guide-target="karaoke"]'),
    ).toHaveTextContent('Karaoke')
  })
})

describe('with the guide never accepted (AC-12)', () => {
  it('adds no scrim, no portrait and no highlight to the page', () => {
    renderApp()

    fireEvent.click(screen.getByText('NO, THANK YOU'))

    expect(document.querySelector('.GuideScrim')).not.toBeInTheDocument()
    expect(document.querySelector('.GuideLayer')).not.toBeInTheDocument()
    expect(highlighted()).toBeNull()
  })
})

describe('where she stands', () => {
  const side = () =>
    document.querySelector('.GuidePortrait')?.getAttribute('data-guide-side')

  it('stands on the left on the first step', () => {
    renderApp()

    accept()

    expect(side()).toBe('left')
  })

  it('has not moved by the mode screen', () => {
    renderApp()

    walkTo('mode')

    expect(side()).toBe('left')
  })
})
