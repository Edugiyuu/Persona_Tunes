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

const NONE: readonly HTMLElement[] = []

/**
 * Resolves a step's tagged elements, and keeps resolving them.
 *
 * Two things make a one-shot lookup wrong. An element is routinely absent the
 * moment a step turns over — a click both advances the tour and navigates, and
 * the tour hears about it first — so the lookup has to run again once the new
 * page has committed; that is what `revision` is for, and the caller passes the
 * current path. And a target can arrive with no render of ours behind it —
 * `/musics` fills in after a request settles — which the observer catches.
 *
 * A step may light more than one control, so this resolves the set and hands
 * back the same array until the set itself changes: the rect loop below keys
 * off that identity.
 */
export function useGuideElements(
  ids: readonly GuideTargetId[],
  revision?: string,
): readonly HTMLElement[] {
  const [elements, setElements] = useState<readonly HTMLElement[]>(NONE)
  // The ids are written inline in `steps.ts`, so the array is a new one on
  // every render and cannot be an effect's dependency. What it holds can.
  const key = ids.join('|')

  useEffect(() => {
    if (!key) {
      setElements(NONE)
      return
    }

    const wanted = key.split('|') as GuideTargetId[]
    const sync = () => {
      setElements((current) => {
        const next = wanted
          .map(findGuideTarget)
          .filter((element): element is HTMLElement => element !== null)
        const same =
          next.length === current.length &&
          next.every((element, index) => element === current[index])
        return same ? current : next
      })
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
    }
  }, [key, revision])

  return elements
}

/** A viewport rectangle: the hole the scrim cuts, in the end. */
export interface GuideRect {
  readonly top: number
  readonly left: number
  readonly width: number
  readonly height: number
}

/**
 * One rect around everything the step lights, followed frame by frame.
 *
 * Polling looks heavy-handed next to a ResizeObserver, but the things that
 * move a target here are GSAP transforms — the home menu slides and scales its
 * entries — and a transform changes no size and fires no observer. A frame
 * loop is the only thing that keeps the cutout on the control, and it runs
 * only while a step is spotlighting something.
 *
 * Several controls come back as the box around them all: the scrim cuts one
 * hole, and where a step offers a choice the two entries sit in a column with
 * nothing between them worth keeping covered.
 */
export function useElementsRect(
  elements: readonly HTMLElement[],
): GuideRect | null {
  const [rect, setRect] = useState<GuideRect | null>(null)

  useEffect(() => {
    if (elements.length === 0) {
      setRect(null)
      return
    }

    let frame = 0
    const sync = () => {
      let top = Infinity
      let left = Infinity
      let right = -Infinity
      let bottom = -Infinity
      for (const element of elements) {
        const box = element.getBoundingClientRect()
        top = Math.min(top, box.top)
        left = Math.min(left, box.left)
        right = Math.max(right, box.right)
        bottom = Math.max(bottom, box.bottom)
      }
      const next: GuideRect = {
        top,
        left,
        width: right - left,
        height: bottom - top,
      }
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
  }, [elements])

  return rect
}
