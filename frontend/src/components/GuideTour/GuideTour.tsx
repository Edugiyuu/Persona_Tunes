import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './spotlight.css'
import './guide.css'
import { publicAssetUrl } from '../../bootstrap/startupManifest'
import { useGuideTour } from './guideContext'
import { GUIDE_NAME, isPlayerAdvanced, isShowcase } from './steps'
import { useElementsRect } from './useGuideTarget'
import { speakGuideLine } from './voice'

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
  const { phase, step, targetElements, accept, decline, advance } =
    useGuideTour()
  const scrimRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const dialogueRef = useRef<HTMLDivElement>(null)
  const dialogueInset = useRef(24)
  const [speaking, setSpeaking] = useState(false)
  const [dialogueAtTop, setDialogueAtTop] = useState(false)
  const rect = useElementsRect(targetElements)
  // A step with nothing to point at is one the player dismisses themselves;
  // one with a spotlit control is dismissed by pressing it, and must not also
  // answer to a stray click or key.
  const playerAdvances = Boolean(step && isPlayerAdvanced(step))

  // She talks for as long as the line takes to say, then falls quiet with the
  // text still on screen. A step carrying a recording is timed by the
  // recording: her mouth stops on the last word she actually says, not on a
  // guess about it.
  //
  // The guess is still here, and it is what a step without one falls back on —
  // as does a step whose recording will not play, which on a first visit is
  // usually the browser refusing to start audio. Either way the window is read
  // off the line's length, capped, because her longest speech would otherwise
  // leave her mouth going for half a minute.
  //
  // Leaving a step stops her mid-line on purpose. The player has moved on, and
  // the alternative is the step they just left talking over the one they are
  // on.
  useEffect(() => {
    if (!step) {
      setSpeaking(false)
      return
    }
    setSpeaking(true)

    let timer = 0
    const readAloud = () => {
      timer = window.setTimeout(
        () => setSpeaking(false),
        Math.min(12000, Math.max(1600, step.line.length * 40)),
      )
    }

    if (!step.voice) {
      readAloud()
      return () => window.clearTimeout(timer)
    }

    const stop = speakGuideLine({
      src: step.voice,
      onEnded: () => setSpeaking(false),
      onFailed: readAloud,
    })
    return () => {
      window.clearTimeout(timer)
      stop()
    }
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
  //
  // A control the step lights but does not take a press on is marked as well:
  // she is describing it, not sending the player to it, so it is lifted into
  // the light and held out of the click. The press then falls through to the
  // page behind it and the step advances like any other of hers — what it must
  // not do is choose a mode she has not finished explaining.
  useEffect(() => {
    if (!step || targetElements.length === 0) {
      return
    }
    for (const element of targetElements) {
      element.dataset.guideHighlighted = 'true'
      const id = element.dataset.guideTarget
      if (id && isShowcase(step, id as never)) {
        element.dataset.guideShowcase = 'true'
      }
    }
    return () => {
      for (const element of targetElements) {
        delete element.dataset.guideHighlighted
        delete element.dataset.guideShowcase
      }
    }
  }, [step, targetElements])

  // "Click or press a key", both halves, and only on the steps the player
  // advances — elsewhere the way on is the spotlit control, and a stray click
  // or key that jumped the step would leave that control unpressed.
  //
  // The click is taken on the document, not on the scrim: a control she is
  // only showing sits in a hole in the scrim, and a press on it should move
  // her on like a press anywhere else. One listener also means one advance per
  // press, wherever it lands — the button below carries the label and the
  // focus, not a second handler.
  //
  // Capture phase, for two reasons. It is the only phase that has already gone
  // by when this listener is attached, so the very click that turned the page
  // over to this step cannot also advance past it. And it is early enough to
  // take the press away from a showcased control: she is describing that mode,
  // not sending the player to it, so pressing it must not choose it.
  //
  // Space is taken from the page so it advances instead of scrolling behind
  // the scrim, and preventing the default is also what stops a focused button
  // from firing a click of its own on top of this.
  useEffect(() => {
    if (phase !== 'running' || !playerAdvances) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        advance()
      }
    }
    const onClick = (event: MouseEvent) => {
      const origin = event.target
      const tagged =
        origin instanceof Element
          ? origin.closest<HTMLElement>('[data-guide-target]')
          : null
      if (tagged?.dataset.guideShowcase === 'true') {
        event.preventDefault()
        event.stopPropagation()
      }
      advance()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('click', onClick, true)
    }
  }, [advance, phase, playerAdvances])

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

          <div className="GuideDialogueBox" data-guide-advance={playerAdvances}>
            <p className="GuideLine">{step.line}</p>
            {playerAdvances && (
              <div className="GuideDialogueActions">
                {/* The press is caught on the document, where every other
                    click on this step is caught, so this carries the label and
                    the focus and no handler of its own. */}
                <button className="GuideConfirm" type="button">
                  <span className="GuideConfirmHint">
                    Click or press{' '}
                    <kbd className="GuideKey">Enter</kbd> to{' '}
                    <span className="GuideConfirmLabel">
                      {step.confirmLabel ?? 'CONTINUE'}
                    </span>
                  </span>
                  <span aria-hidden="true" className="GuideConfirmCaret">
                    ▼
                  </span>
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
