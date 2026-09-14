import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './spotlight.css'
import './guide.css'
import { publicAssetUrl } from '../../bootstrap/startupManifest'
import { useGuideTour } from './guideContext'
import { GUIDE_NAME } from './steps'
import { useElementRect } from './useGuideTarget'

const portraitMouthClosedUrl = publicAssetUrl(
  import.meta.env.BASE_URL,
  'imgs/Elizabeth/Guide/Elizabeth0.png',
)
const portraitMouthOpenUrl = publicAssetUrl(
  import.meta.env.BASE_URL,
  'imgs/Elizabeth/Guide/Elizabeth1.png',
)

/**
 * Elizabeth's guided first run.
 *
 * Markup and behaviour only: class names and `data-` attributes are the seam
 * the visual pass hangs off, and the sole stylesheet next door is the scrim
 * mechanics. No animation lives here yet — the `speaking` frame stack is the
 * hook the talk animation hangs off.
 */
const GuideTour = () => {
  const { phase, step, targetElement, accept, decline, advance } =
    useGuideTour()
  const scrimRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const dialogueRef = useRef<HTMLDivElement>(null)
  const dialogueInset = useRef(24)
  const [speaking, setSpeaking] = useState(false)
  const [dialogueAtTop, setDialogueAtTop] = useState(false)
  const rect = useElementRect(targetElement)

  // She talks for as long as the line takes to say, then falls quiet with the
  // text still on screen. There is no voice track to sync to, so the window is
  // read off the line's length — capped, because her longest speech would
  // otherwise leave her mouth going for half a minute.
  useEffect(() => {
    if (!step) {
      setSpeaking(false)
      return
    }
    setSpeaking(true)
    const timer = window.setTimeout(
      () => setSpeaking(false),
      Math.min(12000, Math.max(1600, step.line.length * 40)),
    )
    return () => window.clearTimeout(timer)
  }, [step])

  // Geometry again, and the same reason: the box is the one piece of chrome
  // that takes clicks, so it must never come to rest on the control the step is
  // pointing at — which is exactly what happens on a phone, where the box runs
  // the full width and the pages stack their controls low.
  //
  // What counts as "on it" is the control's middle, not any overlap at all: the
  // box and a tilted menu plate graze each other's edges on plenty of window
  // sizes, and throwing the box to the other end of the screen over a few
  // pixels is worse than the graze. The test is against where the box would sit
  // at the bottom, never against where it sits now, or moving it would clear
  // the overlap and bounce it straight back.
  useLayoutEffect(() => {
    const box = dialogueRef.current
    if (!box || !rect) {
      setDialogueAtTop(false)
      return
    }
    const box_ = box.getBoundingClientRect()
    // How tall the box came out. At the top end the box is hung off Elizabeth's
    // feet rather than off the ceiling, and that sum needs a height the
    // stylesheet cannot know: the box is as tall as the line it is holding.
    // Its height does not depend on where it is put, so writing it here cannot
    // feed back into the placement it feeds.
    layerRef.current?.style.setProperty(
      '--guide-dialogue-height',
      `${box_.height}px`,
    )
    if (!dialogueAtTop) {
      dialogueInset.current = window.innerHeight - box_.bottom
    }
    const bottom = window.innerHeight - dialogueInset.current
    const top = bottom - box_.height
    const centreX = rect.left + rect.width / 2
    const centreY = rect.top + rect.height / 2
    setDialogueAtTop(
      centreX > box_.left &&
        centreX < box_.right &&
        centreY > top &&
        centreY < bottom,
    )
  }, [dialogueAtTop, rect])

  // Geometry, not styling: the cutout's size and place are the only things the
  // stylesheet cannot know on its own.
  useEffect(() => {
    const scrim = scrimRef.current
    if (!scrim || !rect) {
      return
    }
    scrim.style.setProperty('--guide-rect-top', `${rect.top}px`)
    scrim.style.setProperty('--guide-rect-left', `${rect.left}px`)
    scrim.style.setProperty('--guide-rect-width', `${rect.width}px`)
    scrim.style.setProperty('--guide-rect-height', `${rect.height}px`)
  }, [rect])

  // The spotlit control has to out-rank the scrim, and hand the rank back when
  // the tour moves on.
  useEffect(() => {
    if (!targetElement) {
      return
    }
    targetElement.dataset.guideHighlighted = 'true'
    return () => {
      delete targetElement.dataset.guideHighlighted
    }
  }, [targetElement])

  // Esc backs out of the prompt from anywhere, not only from the focused
  // button (AC-2).
  useEffect(() => {
    if (phase !== 'asking') {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        decline()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [decline, phase])

  if (phase === 'asking') {
    return (
      <>
        <div className="GuideScrim" data-guide-cutout={false} />
        <div className="GuideLayer" data-guide-phase="asking">
          <div
            aria-labelledby="guide-prompt-title"
            aria-modal="true"
            className="GuidePrompt"
            role="dialog"
          >
            <h2 className="GuidePromptTitle" id="guide-prompt-title">
              Shall I show you around?
            </h2>
            <div className="GuidePromptActions">
              <button
                autoFocus
                className="GuidePromptAccept"
                onClick={accept}
                type="button"
              >
                YES, PLEASE
              </button>
              <button
                className="GuidePromptDecline"
                onClick={decline}
                type="button"
              >
                NO, THANK YOU
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (phase !== 'running' || !step) {
    return null
  }

  return (
    <>
      <div
        className="GuideScrim"
        data-guide-cutout={Boolean(rect)}
        ref={scrimRef}
      />
      <div
        className="GuideLayer"
        data-guide-place={dialogueAtTop ? 'top' : 'bottom'}
        data-guide-step={step.id}
        ref={layerRef}
      >
        {/* Both frames stay mounted and stacked, mirroring the mode
            selector's blink: the talk animation swaps the top one in and out
            and nothing else has to move. */}
        <div aria-hidden="true" className="GuidePortrait" data-guide-side="left">
          <img alt="" className="GuidePortraitFrame" src={portraitMouthClosedUrl} />
          <img
            alt=""
            className="GuidePortraitFrame GuidePortraitSpeaking"
            data-guide-speaking={speaking ? 'true' : 'false'}
            src={portraitMouthOpenUrl}
          />
        </div>

        {/* Two boxes, not one: the name plate is its own box sitting above the
            line, the way a Persona name tag sits on its text box. The wrapper
            is layout only — it carries no look and no clicks. */}
        <div
          aria-live="polite"
          className="GuideDialogue"
          data-guide-place={dialogueAtTop ? 'top' : 'bottom'}
          ref={dialogueRef}
          role="status"
        >
          <p className="GuideSpeaker">{GUIDE_NAME}</p>

          <div className="GuideDialogueBox">
            <p className="GuideLine">{step.line}</p>
            {step.confirmLabel && (
              <div className="GuideDialogueActions">
                <button
                  className="GuideConfirm"
                  onClick={advance}
                  type="button"
                >
                  {step.confirmLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default GuideTour
