import { RefObject, useEffect } from "react";
import { gsap } from "gsap";

/** Title band: slides in from off-screen, then breathes. Unchanged behaviour. */
export const triggerModeSelector = () => {
  gsap.fromTo(
    ".ModeSelectorTitle",
    { y: -250, x: -1300 },
    {
      y: 0,
      x: 0,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.fromTo(
          ".ModeSelectorTitle h2",
          { scale: 1 },
          { scale: 1.01, duration: 0.3, repeat: -1, yoyo: true },
        );
      },
    },
  );
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/**
 * The two looks a mode entry can have, side by side, so you read what
 * "selected" changes instead of evaluating a ternary per property.
 * Mirrors the home menu (`Home/animations.ts`) on purpose — same language.
 */
const ENTRY_LOOK = {
  selected: {
    plateScaleX: 1,
    plateDuration: 0.38,
    plateStagger: 0.06,
    plateEase: "power4.out",
    labelShiftX: 10,
    labelScale: 1.06,
    labelEase: "back.out(2.2)",
  },
  resting: {
    plateScaleX: 0,
    plateDuration: 0.24,
    plateStagger: 0,
    plateEase: "power2.in",
    labelShiftX: 0,
    labelScale: 1,
    labelEase: "power2.out",
  },
} as const;

type EntryLook = (typeof ENTRY_LOOK)[keyof typeof ENTRY_LOOK];

/** The lean lives in CSS too, but GSAP overwrites the whole `transform`,
 *  so every tween has to restate it or the italic straightens out. */
const LABEL_SKEW_X = -5;
const LABEL_DURATION = 0.4;

/**
 * Each plate's resting shape plus the shapes it drifts through while selected.
 * Every polygon keeps the same point count so GSAP interpolates the numbers
 * instead of snapping. The two plates use different durations so their edges
 * fall out of phase.
 */
const PLATE_SHAPES = {
  back: {
    rest: "polygon(0% 38%, 100% 0%, 93% 96%, 0% 56%)",
    drift: [
      "polygon(0% 14%, 100% 3%, 97% 100%, 0% 58%)",
      "polygon(0% 22%, 100% 0%, 90% 92%, 0% 62%)",
    ],
    driftDuration: 1.1,
  },
  front: {
    rest: "polygon(0% 24%, 100% 8%, 89% 92%, 0% 54%)",
    drift: [
      "polygon(0% 20%, 100% 12%, 93% 96%, 0% 58%)",
      "polygon(0% 29%, 100% 5%, 86% 88%, 0% 60%)",
    ],
    driftDuration: 1.45,
  },
} as const;

type PlateShape = (typeof PLATE_SHAPES)[keyof typeof PLATE_SHAPES];

/** The animated pieces of one mode entry. */
interface ModeEntry {
  readonly back: Element | null;
  readonly front: Element | null;
  readonly plates: readonly Element[];
  readonly label: Element | null;
}

const readEntry = (item: HTMLElement): ModeEntry => {
  const back = item.querySelector(".ModeBladeBack");
  const front = item.querySelector(".ModeBladeFront");

  return {
    back,
    front,
    plates: [back, front].filter((el): el is Element => el !== null),
    label: item.querySelector(".ModeLabel"),
  };
};

/** Wipe the plates in or out and nudge the label. */
const animateEntry = (entry: ModeEntry, look: EntryLook) => {
  gsap.to(entry.plates, {
    scaleX: look.plateScaleX,
    scaleY: 1,
    duration: look.plateDuration,
    stagger: look.plateStagger,
    ease: look.plateEase,
    overwrite: "auto",
  });

  if (entry.label) {
    gsap.to(entry.label, {
      x: look.labelShiftX,
      scale: look.labelScale,
      skewX: LABEL_SKEW_X,
      duration: LABEL_DURATION,
      ease: look.labelEase,
      overwrite: "auto",
    });
  }
};

/** Same end result as `animateEntry`, applied instantly for reduced motion. */
const snapEntry = (entry: ModeEntry, look: EntryLook) => {
  gsap.set(entry.plates, { scaleX: look.plateScaleX, scaleY: 1 });

  if (entry.label) {
    gsap.set(entry.label, {
      x: look.labelShiftX,
      scale: look.labelScale,
      skewX: LABEL_SKEW_X,
    });
  }
};

const holdPlateStill = (plate: Element | null, shape: PlateShape) => {
  if (plate) gsap.set(plate, { clipPath: shape.rest });
};

/** Loop one plate through its drift shapes. The caller keeps the timeline so it
 *  can stop it once the entry is no longer selected. */
const startPlateDrift = (plate: Element | null, shape: PlateShape) => {
  if (!plate) return null;

  const timeline = gsap.timeline({ repeat: -1, yoyo: true });
  for (const clipPath of shape.drift) {
    timeline.to(plate, {
      clipPath,
      duration: shape.driftDuration,
      ease: "sine.inOut",
    });
  }

  return timeline;
};

/** Entries slide in from the right once, on mount, after the title lands. */
const useModeIntro = (navRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(".ModeItem", {
        x: 120,
        opacity: 0,
        skewX: -14,
        delay: 1,
        duration: 0.22,
        ease: "back.out(1.7)",
        stagger: 0.12,
      });
    }, nav);

    return () => ctx.revert();
  }, [navRef]);
};

/**
 * The reveal tweens are meant to outlive a cursor move, so `useModeCursor`
 * cannot stop them in its own cleanup — that runs on every move and would
 * freeze a plate halfway whenever the pointer crosses both entries quickly.
 * This effect depends only on the ref, so its cleanup fires just once, when the
 * selector unmounts.
 */
const useModeTweenTeardown = (navRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const nav = navRef.current;

    return () => {
      if (nav) {
        gsap.killTweensOf(nav.querySelectorAll(".ModeBlade, .ModeLabel"));
      }
    };
  }, [navRef]);
};

/**
 * Moves the selection: every entry is animated to its look, and only the
 * selected one keeps its plates drifting.
 */
const useModeCursor = (
  navRef: RefObject<HTMLElement | null>,
  activeIndex: number,
) => {
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const items = Array.from(nav.querySelectorAll<HTMLElement>(".ModeItem"));
    const reduced = prefersReducedMotion();
    const drifts: (gsap.core.Timeline | null)[] = [];

    items.forEach((item, index) => {
      const entry = readEntry(item);
      const isSelected = index === activeIndex;
      const look = isSelected ? ENTRY_LOOK.selected : ENTRY_LOOK.resting;

      if (reduced) {
        snapEntry(entry, look);
        holdPlateStill(entry.back, PLATE_SHAPES.back);
        holdPlateStill(entry.front, PLATE_SHAPES.front);
        return;
      }

      animateEntry(entry, look);

      if (isSelected) {
        drifts.push(
          startPlateDrift(entry.back, PLATE_SHAPES.back),
          startPlateDrift(entry.front, PLATE_SHAPES.front),
        );
      } else {
        holdPlateStill(entry.back, PLATE_SHAPES.back);
        holdPlateStill(entry.front, PLATE_SHAPES.front);
      }
    });

    return () => {
      drifts.forEach((timeline) => timeline?.kill());
    };
  }, [navRef, activeIndex]);
};

/**
 * Persona 3 Reload-style mode selector motion. Same three-part shape as the
 * home menu: a mount intro, a cursor that wipes plates between entries, and an
 * idle drift on the selected entry so the accent never looks static.
 *
 * Work is scoped to `navRef` and cleaned up on unmount. Reduced-motion users
 * get the end states applied instantly.
 */
export const useModeAnimations = (
  navRef: RefObject<HTMLElement | null>,
  activeIndex: number,
) => {
  useModeIntro(navRef);
  useModeTweenTeardown(navRef);
  useModeCursor(navRef, activeIndex);
};
