import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BackgroundMusicProvider } from './BackgroundMusicProvider'
import { loadBackgroundMusic, resetBackgroundMusicElement } from './bgmAudio'
import { BGM_START_SECONDS, BGM_TRACK, BGM_VOLUME } from './bgmContext'
import { useSilenceBackgroundMusic } from './useSilenceBackgroundMusic'

/** jsdom has no media pipeline, so stand in for the element the provider owns. */
class FakeAudio {
  static instances: FakeAudio[] = []
  readonly listeners: Record<string, (() => void)[]> = {}
  src = ''
  volume = 1
  loop = false
  preload = ''
  paused = true
  currentTime = 0
  readyState = 0

  addEventListener(type: string, handler: () => void) {
    ;(this.listeners[type] ??= []).push(handler)
  }

  removeEventListener(type: string, handler: () => void) {
    this.listeners[type] = (this.listeners[type] ?? []).filter(
      (entry) => entry !== handler,
    )
  }

  emit(type: string) {
    for (const handler of [...(this.listeners[type] ?? [])]) {
      handler()
    }
  }

  load = vi.fn()
  refusePlay = false
  play = vi.fn(() => {
    if (this.refusePlay) {
      return Promise.reject(new DOMException('NotAllowedError'))
    }
    this.paused = false
    return Promise.resolve()
  })
  pause = vi.fn(() => {
    this.paused = true
  })

  constructor(src = '') {
    this.src = src
    FakeAudio.instances.push(this)
  }
}

/** The ambience fades on a timer, so drive it instead of waiting on it. */
function settleFades() {
  act(() => {
    vi.advanceTimersByTime(2_000)
  })
}

function currentAudio(): FakeAudio {
  const audio = FakeAudio.instances.at(-1)
  if (!audio) {
    throw new Error('the provider never created an audio element')
  }
  return audio
}

function Silencer({ active }: { active: boolean }) {
  useSilenceBackgroundMusic(active)
  return <p>{active ? 'song playing' : 'song idle'}</p>
}

function renderBgm(path: string, children?: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <BackgroundMusicProvider>{children}</BackgroundMusicProvider>
    </MemoryRouter>,
  )
}

/** Stand in for the visitor touching the page. */
function unlock() {
  act(() => {
    window.dispatchEvent(new Event('pointerdown'))
  })
  settleFades()
}

describe('the background music', () => {
  beforeEach(() => {
    FakeAudio.instances = []
    // The element is a module singleton, so each test needs a fresh one.
    resetBackgroundMusicElement()
    vi.stubGlobal('Audio', FakeAudio)
    vi.useFakeTimers()
  })

  it('starts as soon as the site loads, without waiting for a gesture', () => {
    renderBgm('/')
    settleFades()

    const audio = currentAudio()
    expect(audio.src).toBe(BGM_TRACK)
    expect(audio.play).toHaveBeenCalled()
    expect(audio.paused).toBe(false)
    expect(audio.volume).toBeCloseTo(BGM_VOLUME)
  })

  it('falls back to the first gesture when the browser refuses to autoplay', async () => {
    // The element is built on first render, so arm the refusal through the
    // constructor the provider is about to call.
    const refusing = new FakeAudio()
    refusing.refusePlay = true
    vi.stubGlobal('Audio', function () {
      return refusing
    })

    renderBgm('/')
    await act(async () => {
      await Promise.resolve()
    })
    settleFades()
    expect(refusing.paused).toBe(true)

    refusing.refusePlay = false
    unlock()

    expect(refusing.paused).toBe(false)
    expect(refusing.volume).toBeCloseTo(BGM_VOLUME)
  })

  it('loops the lounge theme quietly', () => {
    renderBgm('/')
    unlock()

    const audio = currentAudio()
    expect(audio.src).toBe(BGM_TRACK)
    expect(audio.play).toHaveBeenCalled()
    expect(audio.volume).toBeCloseTo(BGM_VOLUME)
  })

  it('keeps the same track across the whole site', () => {
    renderBgm('/musics')
    unlock()

    expect(currentAudio().src).toBe(BGM_TRACK)
  })

  it('fades out and stops while a song or preview holds it silent', () => {
    const { rerender } = renderBgm('/musics', <Silencer active={false} />)
    unlock()
    expect(currentAudio().volume).toBeCloseTo(BGM_VOLUME)

    rerender(
      <MemoryRouter initialEntries={['/musics']}>
        <BackgroundMusicProvider>
          <Silencer active />
        </BackgroundMusicProvider>
      </MemoryRouter>,
    )
    settleFades()

    expect(screen.getByText('song playing')).toBeInTheDocument()
    expect(currentAudio().volume).toBeCloseTo(0)
    expect(currentAudio().pause).toHaveBeenCalled()
  })

  it('comes back once the song releases it', () => {
    const tree = (active: boolean) => (
      <MemoryRouter initialEntries={['/musics']}>
        <BackgroundMusicProvider>
          <Silencer active={active} />
        </BackgroundMusicProvider>
      </MemoryRouter>
    )
    const { rerender } = render(tree(false))
    unlock()

    rerender(tree(true))
    settleFades()
    expect(currentAudio().volume).toBeCloseTo(0)

    rerender(tree(false))
    settleFades()
    expect(currentAudio().volume).toBeCloseTo(BGM_VOLUME)
  })

  it('keeps quiet until every claim is released', () => {
    const tree = (first: boolean, second: boolean) => (
      <MemoryRouter initialEntries={['/musics']}>
        <BackgroundMusicProvider>
          <Silencer active={first} />
          <Silencer active={second} />
        </BackgroundMusicProvider>
      </MemoryRouter>
    )
    const { rerender } = render(tree(false, false))
    unlock()

    rerender(tree(true, true))
    settleFades()
    expect(currentAudio().volume).toBeCloseTo(0)

    // One of the two lets go: the other still wants the room quiet.
    rerender(tree(false, true))
    settleFades()
    expect(currentAudio().volume).toBeCloseTo(0)

    rerender(tree(false, false))
    settleFades()
    expect(currentAudio().volume).toBeCloseTo(BGM_VOLUME)
  })
})

describe('loading the ambience at startup', () => {
  beforeEach(() => {
    FakeAudio.instances = []
    resetBackgroundMusicElement()
    vi.stubGlobal('Audio', FakeAudio)
  })

  it('resolves once the track can play through', async () => {
    const signal = new AbortController().signal
    const pending = loadBackgroundMusic(signal)
    const audio = currentAudio()

    expect(audio.src).toBe(BGM_TRACK)
    expect(audio.load).toHaveBeenCalled()
    audio.emit('canplaythrough')

    await expect(pending).resolves.toBeUndefined()
  })

  it('rejects when the track never arrives, so startup can report it', async () => {
    const pending = loadBackgroundMusic(new AbortController().signal)
    currentAudio().emit('error')

    await expect(pending).rejects.toThrow(/Background music failed to load/)
  })

  it('rejects when startup aborts the load', async () => {
    const controller = new AbortController()
    const pending = loadBackgroundMusic(controller.signal)
    controller.abort()

    await expect(pending).rejects.toThrow(/aborted/i)
  })

  it('opens past the intro instead of at zero', () => {
    loadBackgroundMusic(new AbortController().signal)
    const audio = currentAudio()
    audio.emit('loadedmetadata')

    expect(audio.currentTime).toBe(BGM_START_SECONDS)
  })

  it('loops back past the intro rather than replaying it', () => {
    loadBackgroundMusic(new AbortController().signal)
    const audio = currentAudio()
    audio.emit('loadedmetadata')
    audio.currentTime = 298
    audio.emit('ended')

    expect(audio.currentTime).toBe(BGM_START_SECONDS)
    expect(audio.play).toHaveBeenCalled()
  })
})
