import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { backgroundMusicElement } from './bgmAudio'
import {
  BackgroundMusicContext,
  BGM_FADE_MS,
  BGM_VOLUME,
  type BackgroundMusicValue,
} from './bgmContext'

/** Smooth in the foreground; a hidden tab throttles it and still lands. */
const FADE_TICK_MS = 16

/** Gestures a browser accepts as "the user is here", unlocking autoplay. */
const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

/**
 * Start it if the browser will have it. A tab that has not been interacted with
 * may refuse, and jsdom has no media pipeline at all; neither is an error worth
 * logging, but a refusal has to be reported so a gesture can retry it.
 */
function tryPlay(audio: HTMLAudioElement, onRefused: () => void) {
  try {
    void audio.play()?.catch(onRefused)
  } catch {
    onRefused()
  }
}

function tryPause(audio: HTMLAudioElement) {
  try {
    audio.pause()
  } catch {
    // No media support (jsdom): there is nothing playing to stop.
  }
}

export function BackgroundMusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeRef = useRef<number | null>(null)
  /** The browser refused to autoplay, so the next gesture has to start it. */
  const [blocked, setBlocked] = useState(false)
  const [silenceClaims, setSilenceClaims] = useState(0)

  const isSilenced = silenceClaims > 0
  const shouldPlay = !blocked && !isSilenced

  const claimSilence = useCallback(() => {
    setSilenceClaims((count) => count + 1)
    let released = false
    return () => {
      if (released) {
        return
      }
      released = true
      setSilenceClaims((count) => Math.max(0, count - 1))
    }
  }, [])

  /**
   * Ramp the volume instead of cutting it, and hand back when it lands.
   * Timers rather than frames: a backgrounded tab stops painting but keeps
   * playing, and a fade frozen half way there would be heard over the song.
   */
  const fadeTo = useCallback((target: number, onDone?: () => void) => {
    const audio = audioRef.current
    if (!audio) {
      return
    }
    if (fadeRef.current !== null) {
      clearInterval(fadeRef.current)
    }
    const from = audio.volume
    const start = Date.now()
    fadeRef.current = setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / BGM_FADE_MS)
      audio.volume = from + (target - from) * progress
      if (progress < 1) {
        return
      }
      if (fadeRef.current !== null) {
        clearInterval(fadeRef.current)
        fadeRef.current = null
      }
      onDone?.()
    }, FADE_TICK_MS) as unknown as number
  }, [])

  // The element is the one startup already loaded, so nothing downloads twice
  // and the track is ready to play the moment the site appears.
  useEffect(() => {
    const audio = backgroundMusicElement()
    audioRef.current = audio

    return () => {
      if (fadeRef.current !== null) {
        clearInterval(fadeRef.current)
        fadeRef.current = null
      }
      tryPause(audio)
      audioRef.current = null
    }
  }, [])

  // Only needed when the browser turned the opening play() down.
  useEffect(() => {
    if (!blocked) {
      return
    }
    const unlock = () => setBlocked(false)
    for (const event of UNLOCK_EVENTS) {
      window.addEventListener(event, unlock, { once: true, passive: true })
    }
    return () => {
      for (const event of UNLOCK_EVENTS) {
        window.removeEventListener(event, unlock)
      }
    }
  }, [blocked])

  // Duck for a song or a preview, come back once the last claim is released.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }
    if (shouldPlay) {
      tryPlay(audio, () => setBlocked(true))
      fadeTo(BGM_VOLUME)
      return
    }
    fadeTo(0, () => tryPause(audio))
  }, [shouldPlay, fadeTo])

  const value = useMemo<BackgroundMusicValue>(
    () => ({ isPlaying: shouldPlay, isSilenced, claimSilence }),
    [shouldPlay, isSilenced, claimSilence],
  )

  return (
    <BackgroundMusicContext.Provider value={value}>
      {children}
    </BackgroundMusicContext.Provider>
  )
}
