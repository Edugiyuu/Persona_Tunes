import { useEffect, useState } from 'react'
import type { GuideTargetId } from './steps'

/**
 * Pages hand the guide an element by tagging it; nothing else couples them.
 */
export function findGuideTarget(
  id: GuideTargetId | null,
): HTMLElement | null {
  if (!id) {
    return null
  }
  return document.querySelector<HTMLElement>(`[data-guide-target="${id}"]`)
}

/**
 * Resolves a tagged element, and keeps resolving it.
 *
 * Two things make a one-shot lookup wrong. The element is routinely absent the
 * moment a step turns over — a click both advances the tour and navigates, and
 * the tour hears about it first — so the lookup has to run again once the new
 * page has committed; that is what `revision` is for, and the caller passes the
 * current path. And a target can arrive with no render of ours behind it —
 * `/musics` fills in after a request settles — which the observer catches.
 */
export function useGuideElement(
  id: GuideTargetId | null,
  revision?: string,
): HTMLElement | null {
  const [element, setElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!id) {
      setElement(null)
      return
    }

    const sync = () => {
      setElement((current) => {
        const next = findGuideTarget(id)
        return next === current ? current : next
      })
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
    }
  }, [id, revision])

  return element
}

/**
 * The element's viewport rect, followed frame by frame.
 *
 * Polling looks heavy-handed next to a ResizeObserver, but the things that
 * move a target here are GSAP transforms — the home menu slides and scales its
 * entries — and a transform changes no size and fires no observer. A frame
 * loop is the only thing that keeps the cutout on the control, and it runs
 * only while a step is spotlighting something.
 */
export function useElementRect(element: HTMLElement | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!element) {
      setRect(null)
      return
    }

    let frame = 0
    const sync = () => {
      const next = element.getBoundingClientRect()
      setRect((current) =>
        current &&
        current.top === next.top &&
        current.left === next.left &&
        current.width === next.width &&
        current.height === next.height
          ? current
          : next,
      )
      frame = window.requestAnimationFrame(sync)
    }

    sync()
    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [element])

  return rect
}
