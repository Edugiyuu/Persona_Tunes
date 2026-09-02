import { RefObject, useEffect } from "react";
import { gsap } from "gsap";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/** The nodes this module animates. All optional — the guide only mounts them
 *  while it is running, so every hook has to cope with a null ref. */
export interface GuideRefs {
  readonly portraitRef: RefObject<HTMLElement | null>;
  readonly boxRef: RefObject<HTMLElement | null>;
  readonly lineRef: RefObject<HTMLElement | null>;
}

/** Elizabeth walks in from off the right edge; the box comes up under her. */
const PORTRAIT_ENTER = { x: 180, opacity: 0, duration: 0.55, ease: "power3.out" };
const BOX_ENTER = {
  y: 48,
  opacity: 0,
  duration: 0.42,
  delay: 0.14,
  ease: "power2.out",
};

/** Roughly a line of Persona dialogue: fast, but you can still read along. */
const TYPEWRITER_CHARS_PER_SECOND = 42;
const TYPEWRITER_DELAY = 0.5;

/**
 * Slides the portrait and the dialogue box into place once, when the guide
 * starts. Reduced motion gets the same end state with no travel.
 */
const useGuideEntrance = (refs: GuideRefs, active: boolean) => {
  const { portraitRef, boxRef } = refs;

  useEffect(() => {
    const portrait = portraitRef.current;
    const box = boxRef.current;
    if (!active || (!portrait && !box)) return;

    const targets = [portrait, box].filter(
      (node): node is HTMLElement => node !== null,
    );

    if (prefersReducedMotion()) {
      gsap.set(targets, { x: 0, y: 0, opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      if (portrait) gsap.from(portrait, PORTRAIT_ENTER);
      if (box) gsap.from(box, BOX_ENTER);
    });

    return () => {
      gsap.killTweensOf(targets);
      ctx.revert();
    };
  }, [active, portraitRef, boxRef]);
};

/**
 * Types the instruction out character by character.
 *
 * The line is passed in rather than read back off the node: React renders the
 * same string, so the two always agree, and an effect that re-runs after the
 * node has already been emptied cannot capture an empty line and stall.
 * Reduced motion never empties it.
 */
const useTypewriter = (
  lineRef: RefObject<HTMLElement | null>,
  line: string,
  active: boolean,
) => {
  useEffect(() => {
    const node = lineRef.current;
    if (!active || !node) return;

    if (prefersReducedMotion() || line.length === 0) {
      gsap.set(node, { opacity: 1 });
      return;
    }

    const cursor = { chars: 0 };
    node.textContent = "";

    const tween = gsap.to(cursor, {
      chars: line.length,
      duration: line.length / TYPEWRITER_CHARS_PER_SECOND,
      delay: TYPEWRITER_DELAY,
      ease: "none",
      onUpdate: () => {
        node.textContent = line.slice(0, Math.round(cursor.chars));
      },
    });

    return () => {
      tween.kill();
      // Whatever interrupted the reveal, the line is left whole rather than
      // frozen mid-word.
      node.textContent = line;
    };
  }, [active, line, lineRef]);
};

/**
 * Motion for the Elizabeth guide: she slides in from the edge she stands on,
 * her dialogue box rises, and the line types itself out.
 *
 * The spotlight pulse is CSS (`GuideTour.css`), because the highlighted node
 * belongs to `driver.js` and is torn down outside React. Everything here is
 * killed on unmount, and reduced motion gets the end states instantly.
 */
export const useGuideAnimations = (
  refs: GuideRefs,
  line: string,
  active: boolean,
) => {
  useGuideEntrance(refs, active);
  useTypewriter(refs.lineRef, line, active);
};
