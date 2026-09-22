import { publicAssetUrl } from '../../bootstrap/startupManifest'

/** Loud enough to carry over the lounge bed, which sits at 0.10. */
export const GUIDE_VOICE_VOLUME = 0.9

/**
 * One element for every line she has. Elizabeth speaks one at a time, and a
 * second element would let the step you just left keep talking over the one
 * you are on — the usual way a rushed tour ends up with two of her.
 */
let element: HTMLAudioElement | null = null

function voiceElement(): HTMLAudioElement {
  if (!element) {
    element = new Audio()
    element.preload = 'auto'
  }
  return element
}

/** Drop the shared element, so a test starts from a clean one. */
export function resetGuideVoiceElement(): void {
  element = null
}

export interface SpeakGuideLine {
  /** Where the recording sits, as `steps.ts` writes it: rooted at the site. */
  readonly src: string
  /** She reached the end of the line on her own. */
  readonly onEnded: () => void
  /** Nothing came out — no file, or the browser refused to start it. */
  readonly onFailed: () => void
}

/**
 * Play one of her lines, and hand back the way to cut it off. Calling the
 * returned function — which every caller does on the way out of a step — stops
 * the audio without reporting an end, so leaving a step early is not mistaken
 * for her finishing it.
 */
export function speakGuideLine({
  src,
  onEnded,
  onFailed,
}: SpeakGuideLine): () => void {
  const audio = voiceElement()
  let live = true

  const finish = (report: () => void) => {
    if (!live) {
      return
    }
    live = false
    cleanup()
    report()
  }
  const handleEnded = () => finish(onEnded)
  const handleError = () => finish(onFailed)
  const cleanup = () => {
    audio.removeEventListener('ended', handleEnded)
    audio.removeEventListener('error', handleError)
  }

  audio.addEventListener('ended', handleEnded)
  audio.addEventListener('error', handleError)

  audio.pause()
  audio.src = publicAssetUrl(import.meta.env.BASE_URL, src)
  audio.currentTime = 0
  audio.volume = GUIDE_VOICE_VOLUME
  // An autoplay refusal rejects here rather than raising `error`, and it is
  // the one failure the caller most needs told about: it is how a whole tour
  // would otherwise run mute.
  void audio.play()?.catch(handleError)

  return () => {
    if (!live) {
      return
    }
    live = false
    cleanup()
    audio.pause()
  }
}
