import { BGM_START_SECONDS, BGM_TRACK } from './bgmContext'

/**
 * One element for the whole site, shared by the startup preload and the
 * provider: two of them would download the track twice.
 */
let element: HTMLAudioElement | null = null

export function backgroundMusicElement(): HTMLAudioElement {
  if (element) {
    return element
  }

  const audio = new Audio()
  audio.preload = 'auto'
  audio.volume = 0
  // Looping is manual: the built-in one would rewind to the intro every pass.
  audio.loop = false
  audio.addEventListener('loadedmetadata', () => {
    if (audio.currentTime === 0) {
      audio.currentTime = BGM_START_SECONDS
    }
  })
  audio.addEventListener('ended', () => {
    audio.currentTime = BGM_START_SECONDS
    void audio.play()?.catch(() => {})
  })
  audio.src = BGM_TRACK
  element = audio

  return audio
}

/** Drop the shared element, so a test starts from a clean one. */
export function resetBackgroundMusicElement(): void {
  element = null
}

/** Enough of the file is buffered to play it without stalling. */
const HAVE_ENOUGH_DATA = 4

/**
 * Resolve once the track is ready to play through, reject if it never arrives:
 * startup holds the site back on this, so a silent failure is not an option.
 */
export function loadBackgroundMusic(signal: AbortSignal): Promise<void> {
  const audio = backgroundMusicElement()

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener('canplaythrough', handleReady)
      audio.removeEventListener('error', handleError)
      signal.removeEventListener('abort', handleAbort)
    }
    const handleReady = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error(`Background music failed to load: ${BGM_TRACK}`))
    }
    const handleAbort = () => {
      cleanup()
      reject(
        new DOMException('Startup resource load was aborted', 'AbortError'),
      )
    }

    if (signal.aborted) {
      handleAbort()
      return
    }
    if (audio.readyState >= HAVE_ENOUGH_DATA) {
      resolve()
      return
    }

    audio.addEventListener('canplaythrough', handleReady)
    audio.addEventListener('error', handleError)
    signal.addEventListener('abort', handleAbort, { once: true })
    audio.load()
  })
}
