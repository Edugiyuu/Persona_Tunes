import { useEffect } from 'react'
import { useBackgroundMusic } from './bgmContext'

/**
 * Hold the ambience quiet while `active` is true — a song playing, a preview
 * running. The claim is released on cleanup, so a component that unmounts
 * mid-song never leaves the site silent.
 */
export function useSilenceBackgroundMusic(active: boolean) {
  const { claimSilence } = useBackgroundMusic()

  useEffect(() => {
    if (!active) {
      return
    }
    return claimSilence()
  }, [active, claimSilence])
}
