import { createContext, useContext } from 'react'

/** Audio lives under Cloudinary's `video/upload`; `br_64k` keeps ambience small. */
export const BGM_TRACK =
  'https://res.cloudinary.com/dkhej3aqu/video/upload/br_64k/bgm/blues-in-velvet-room.mp3'

/**
 * The track opens on twenty seconds of room noise before the piano comes in,
 * so the ambience starts past it — and loops past it, never replaying the intro.
 */
export const BGM_START_SECONDS = 20

/** Quiet enough to sit under the UI sounds, which play at 0.5-0.8. */
export const BGM_VOLUME = 0.10

/** Long enough to read as a fade, short enough not to overlap a song. */
export const BGM_FADE_MS = 600

export interface BackgroundMusicValue {
  /** The track is audible right now (unlocked, and nothing is ducking it). */
  readonly isPlaying: boolean
  /** Something on screen asked for silence, so the ambience is faded out. */
  readonly isSilenced: boolean
  /**
   * Ask the ambience to step aside. Call the returned function to give it
   * back; the music only returns once every claim has been released.
   */
  readonly claimSilence: () => () => void
}

/** What a page sees with no provider around it: an ambience that does nothing. */
const INERT: BackgroundMusicValue = {
  isPlaying: false,
  isSilenced: false,
  claimSilence: () => () => {},
}

export const BackgroundMusicContext =
  createContext<BackgroundMusicValue>(INERT)

export function useBackgroundMusic(): BackgroundMusicValue {
  return useContext(BackgroundMusicContext)
}
