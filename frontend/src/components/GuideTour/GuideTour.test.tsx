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
        <button
          data-guide-target="start-music"
          onClick={() => navigate('/sing-music/abc')}
          type="button"
        >
          START!
        </button>
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

/** Walks the tour from the prompt to the step named. */
const walkTo = (step: 'music-list' | 'music-detail' | 'mode' | 'briefing') => {
  accept()
  fireEvent.click(screen.getByText('SELECT MUSIC'))
  if (step === 'music-list') return
  fireEvent.click(screen.getByText('VIEW MUSIC 0'))
  if (step === 'music-detail') return
  fireEvent.click(screen.getByText('START!'))
  if (step === 'mode') return
  fireEvent.click(screen.getByText('Karaoke'))
}

beforeEach(() => {
  window.localStorage.clear()
})

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
    expect(highlighted()).toHaveAttribute('data-guide-target', 'start-music')

    fireEvent.click(screen.getByText('START!'))
    expect(screen.getByText(lineOf('mode'))).toBeInTheDocument()
    expect(highlighted()).toHaveAttribute('data-guide-target', 'karaoke')
  })

  it('takes either mode to the briefing (AC-7)', () => {
    renderApp()

    walkTo('mode')
    fireEvent.click(screen.getByText('Sing together'))

    expect(screen.getByText(lineOf('briefing'))).toBeInTheDocument()
  })

  it('holds the song while the briefing is up, then lets it play (AC-8, AC-9)', () => {
    renderApp()

    walkTo('briefing')
    expect(screen.getByText(lineOf('briefing'))).toBeInTheDocument()
    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('BEGIN'))

    expect(screen.getByTestId('audio-player')).toBeInTheDocument()
    expect(document.querySelector('.GuideScrim')).not.toBeInTheDocument()
    expect(document.querySelector('.GuidePortrait')).not.toBeInTheDocument()
    expect(highlighted()).toBeNull()
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
