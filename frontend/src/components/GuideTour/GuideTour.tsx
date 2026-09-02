import "driver.js/dist/driver.css";
import "./GuideTour.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { driver, type Driver } from "driver.js";
import { publicAssetUrl } from "../../bootstrap/startupManifest";
import { PlayAudio } from "../../utils/PlayAudio";
import { prefersReducedMotion, useGuideAnimations } from "./animation";

/** Marks the menu entry the guide points at. `Home` stamps it on "SELECT
 *  MUSIC"; nothing else in the app should carry it. */
export const GUIDE_TARGET_ATTRIBUTE = "data-guide-target";
export const GUIDE_TARGET_VALUE = "select-music";
const GUIDE_TARGET_SELECTOR = `[${GUIDE_TARGET_ATTRIBUTE}="${GUIDE_TARGET_VALUE}"]`;

/** One key holds the moment the visitor last answered the prompt. Older than
 *  a day and we ask again — the choice is a convenience, not a setting. */
const STORAGE_KEY = "rt.guide.seen";
const SEEN_TTL_MS = 24 * 60 * 60 * 1000;

const ELIZABETH_NAME = "ELIZABETH";
const ELIZABETH_LINE =
  'Welcome to Persona Tunes. Choose "SELECT MUSIC" and I will take you to the songs.';
const PROMPT_TITLE = "NEED A HAND?";
const PROMPT_BODY =
  "It is your first visit. Shall I show you where to start?";
const ACCEPT_LABEL = "YES, PLEASE";
const DECLINE_LABEL = "NO, THANKS";

const asset = (path: string) => publicAssetUrl(import.meta.env.BASE_URL, path);

/** Mouth closed / open, each with an eyes-closed twin for the blink. The
 *  mouth pair is the seam the voice lines will drive later. */
const PORTRAIT_FRAMES = {
  mouthClosed: {
    eyesOpen: asset("imgs/Elizabeth/Guide/Elizabeth0.png"),
    eyesClosed: asset("imgs/Elizabeth/Guide/ElizabethEyesClosed0.png"),
  },
  mouthOpen: {
    eyesOpen: asset("imgs/Elizabeth/Guide/Elizabeth1.png"),
    eyesClosed: asset("imgs/Elizabeth/Guide/ElizabethEyesClosed1.png"),
  },
} as const;

const selectSoundUrl = asset("audios/UI/P4Select.wav");
const hoverSoundUrl = asset("audios/UI/P4Hover.wav");

/** `prompt` asks, `guiding` runs the one step, `off` renders nothing. */
type GuidePhase = "prompt" | "guiding" | "off";

const readSeenAt = (): number | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const at = Number(raw);
    return Number.isFinite(at) ? at : null;
  } catch {
    // Private windows throw on access rather than returning null.
    return null;
  }
};

/** True while a stored answer is still fresh enough to skip the prompt. */
const hasFreshAnswer = () => {
  const at = readSeenAt();
  return at !== null && Date.now() - at < SEEN_TTL_MS;
};

const rememberAnswer = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Nothing to do: the prompt simply asks again next time.
  }
};

/** driver.js announces a popover on the element it highlights. We render no
 *  popover, so the announcement points at nothing — strip it. */
const POPOVER_ARIA = ["aria-haspopup", "aria-expanded", "aria-controls"];

/** driver.js with every piece of its own chrome switched off — we want the
 *  cutout and nothing else, because Elizabeth does the talking. */
const createSpotlight = (): Driver =>
  driver({
    animate: !prefersReducedMotion(),
    overlayColor: "#03041f",
    overlayOpacity: 0.82,
    stagePadding: 16,
    stageRadius: 6,
    allowClose: false,
    allowKeyboardControl: false,
    showButtons: [],
    // The whole point of the step: the entry underneath stays clickable.
    disableActiveInteraction: false,
    onHighlighted: (element) => {
      for (const attribute of POPOVER_ARIA) element?.removeAttribute(attribute);
    },
  });

/**
 * A one-step, opt-in tour of the home menu, fronted by Elizabeth.
 *
 * First visit asks whether to run it. Accepting darkens the page, cuts
 * "SELECT MUSIC" out of the scrim and leaves it clickable, and stands
 * Elizabeth on the right with a Persona dialogue box. Either answer is
 * remembered for a day.
 */
const GuideTour = () => {
  const [phase, setPhase] = useState<GuidePhase>(() =>
    hasFreshAnswer() ? "off" : "prompt",
  );
  // Reserved for the voice-line follow-up: the frames are already stacked, so
  // flipping this cross-fades her mouth open. Nothing sets it yet.
  const [speaking] = useState(false);

  const portraitRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);

  useGuideAnimations(
    { portraitRef, boxRef, lineRef },
    ELIZABETH_LINE,
    phase === "guiding",
  );

  const dismiss = useCallback(() => {
    rememberAnswer();
    setPhase("off");
  }, []);

  const accept = useCallback(() => {
    PlayAudio(selectSoundUrl, 0.5);
    rememberAnswer();
    setPhase("guiding");
  }, []);

  const decline = useCallback(() => {
    PlayAudio(selectSoundUrl, 0.5);
    dismiss();
  }, [dismiss]);

  useEffect(() => {
    if (phase === "off") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      dismiss();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, dismiss]);

  useEffect(() => {
    if (phase !== "guiding") return;

    const target = document.querySelector(GUIDE_TARGET_SELECTOR);
    if (!target) {
      // Nothing to point at — better no guide than a scrim over everything.
      setPhase("off");
      return;
    }

    const spotlight = createSpotlight();
    spotlight.highlight({ element: target });

    // The entry keeps its own navigation; the guide just stops when it fires.
    const endOnUse = () => setPhase("off");
    target.addEventListener("click", endOnUse);

    return () => {
      target.removeEventListener("click", endOnUse);
      spotlight.destroy();
    };
  }, [phase]);

  if (phase === "off") return null;

  if (phase === "prompt") {
    return createPortal(
      <div className="GuidePrompt">
        <div aria-hidden="true" className="GuidePromptScrim" />
        <div
          aria-labelledby="GuidePromptTitle"
          aria-modal="true"
          className="GuidePromptPlate"
          role="dialog"
        >
          <h2 className="GuidePromptTitle" id="GuidePromptTitle">
            {PROMPT_TITLE}
          </h2>
          <p className="GuidePromptBody">{PROMPT_BODY}</p>
          <div className="GuidePromptActions">
            <button
              autoFocus
              className="GuidePromptButton GuidePromptAccept"
              onClick={accept}
              onMouseEnter={() => PlayAudio(hoverSoundUrl, 0.5)}
              type="button"
            >
              {ACCEPT_LABEL}
            </button>
            <button
              className="GuidePromptButton GuidePromptDecline"
              onClick={decline}
              onMouseEnter={() => PlayAudio(hoverSoundUrl, 0.5)}
              type="button"
            >
              {DECLINE_LABEL}
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="GuideStage" data-speaking={speaking}>
      {/* All four frames stay mounted and stacked, so neither a blink nor the
          first spoken syllable ever waits on a fetch. */}
      <div className="GuidePortrait" ref={portraitRef}>
        <div className="GuideFace" data-speaking={speaking}>
          <div className="GuideMouth GuideMouthClosed">
            <img alt="Elizabeth" className="GuideFrame" src={PORTRAIT_FRAMES.mouthClosed.eyesOpen} />
            <img
              alt=""
              aria-hidden="true"
              className="GuideFrame GuideBlink"
              src={PORTRAIT_FRAMES.mouthClosed.eyesClosed}
            />
          </div>
          <div aria-hidden="true" className="GuideMouth GuideMouthOpen">
            <img alt="" className="GuideFrame" src={PORTRAIT_FRAMES.mouthOpen.eyesOpen} />
            <img
              alt=""
              className="GuideFrame GuideBlink"
              src={PORTRAIT_FRAMES.mouthOpen.eyesClosed}
            />
          </div>
        </div>
      </div>

      <div className="GuideDialogue" ref={boxRef} role="status">
        <span className="GuideSpeaker">{ELIZABETH_NAME}</span>
        <div className="GuideDialoguePlate">
          <p className="GuideLine" ref={lineRef}>
            {ELIZABETH_LINE}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default GuideTour;
