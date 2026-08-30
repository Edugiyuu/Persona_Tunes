import { RefObject, useEffect } from 'react'
import gsap from 'gsap'

export const useStarAnimations = () => {
  useEffect(() => {
    gsap.to('.star', {
        y: "-=40",
        duration: 2,
        repeat: -1,
        yoyo: true,
        stagger: 0.2,
        ease: "power1.inOut",
    });
    gsap.to('.star', {
        scale: 1.8,
        rotationX: 200,
        rotationY: 200,
        duration: 1.3,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        stagger: 0.2,
        transformOrigin: "center",
        perspective: 500
    });
  }, [])
}

export const useLogoAnimation = () => {
  useEffect(() => {
    // Animação de batida de coração
    gsap.set('.Icon', { scale: 1, filter: 'drop-shadow(0 0 0px transparent)' });
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.1 });
    tl.to('.Icon', {
      scale: 1.18,
      duration: 0.18,
      ease: 'power1.in',
      filter: 'drop-shadow(25px 0 0px rgb(255, 255, 255))'
    })
    .to('.Icon', {
      scale: 0.98,
      duration: 0.20,
      ease: 'power1.out',
      filter: 'drop-shadow(-25px 0 0px transparent)'
    })
    .to('.Icon', {
      scale: 1.12,
      duration: 0.13,
      ease: 'power1.in',
      filter: 'drop-shadow(25px 0 0px #1a9ef6)'
    })
    .to('.Icon', {
      scale: 1,
      duration: 0.25,
      ease: 'power1.out',
      filter: 'drop-shadow(-25px 0 0px transparent)'
    })
    .to('.Icon', {
      duration: 0.2
    }); // Pausa entre batidas
  }, [])
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/**
 * The two looks a menu entry can have. Keeping them side by side means you read
 * what "selected" changes instead of evaluating a ternary on every property.
 */
const ENTRY_LOOK = {
  selected: {
    plateScaleX: 1,
    plateDuration: 0.38,
    plateStagger: 0.06,
    plateEase: 'power4.out',
    labelShiftX: 10,
    labelScale: 1.06,
    labelEase: 'back.out(2.2)',
  },
  resting: {
    plateScaleX: 0,
    plateDuration: 0.24,
    plateStagger: 0,
    plateEase: 'power2.in',
    labelShiftX: 0,
    labelScale: 1,
    labelEase: 'power2.out',
  },
} as const

type EntryLook = (typeof ENTRY_LOOK)[keyof typeof ENTRY_LOOK]

/** The label lean lives in CSS too, but GSAP overwrites the whole `transform`,
 *  so every tween has to restate it or the italic straightens out. */
const LABEL_SKEW_X = -5
const LABEL_DURATION = 0.4

/**
 * Each plate's resting shape plus the shapes it drifts through while its entry
 * stays selected. Every polygon has the same point count on purpose: that is
 * what lets GSAP interpolate the numbers instead of snapping between shapes.
 * The two plates use different durations so their edges fall out of phase.
 */
const PLATE_SHAPES = {
  back: {
    rest: 'polygon(0% 38%, 100% 0%, 93% 96%, 0% 56%)',
    drift: [
      'polygon(0% 14%, 100% 3%, 97% 100%, 0% 58%)',
      'polygon(0% 22%, 100% 0%, 90% 92%, 0% 62%)',
    ],
    driftDuration: 1.1,
  },
  front: {
    rest: 'polygon(0% 24%, 100% 8%, 89% 92%, 0% 54%)',
    drift: [
      'polygon(0% 20%, 100% 12%, 93% 96%, 0% 58%)',
      'polygon(0% 29%, 100% 5%, 86% 88%, 0% 60%)',
    ],
    driftDuration: 1.45,
  },
} as const

type PlateShape = (typeof PLATE_SHAPES)[keyof typeof PLATE_SHAPES]

/** The animated pieces of one menu entry. */
interface MenuEntry {
  readonly back: Element | null
  readonly front: Element | null
  readonly plates: readonly Element[]
  readonly label: Element | null
}

const readEntry = (item: HTMLElement): MenuEntry => {
  const back = item.querySelector('.BladeBack')
  const front = item.querySelector('.BladeFront')

  return {
    back,
    front,
    plates: [back, front].filter((el): el is Element => el !== null),
    label: item.querySelector('.Link'),
  }
}

/** Wipe the plates in or out and nudge the label. */
const animateEntry = (entry: MenuEntry, look: EntryLook) => {
  gsap.to(entry.plates, {
    scaleX: look.plateScaleX,
    scaleY: 1,
    duration: look.plateDuration,
    stagger: look.plateStagger,
    ease: look.plateEase,
    overwrite: 'auto',
  })

  if (entry.label) {
    gsap.to(entry.label, {
      x: look.labelShiftX,
      scale: look.labelScale,
      skewX: LABEL_SKEW_X,
      duration: LABEL_DURATION,
      ease: look.labelEase,
      overwrite: 'auto',
    })
  }
}

/** Same end result as `animateEntry`, applied instantly for reduced motion. */
const snapEntry = (entry: MenuEntry, look: EntryLook) => {
  gsap.set(entry.plates, { scaleX: look.plateScaleX, scaleY: 1 })

  if (entry.label) {
    gsap.set(entry.label, {
      x: look.labelShiftX,
      scale: look.labelScale,
      skewX: LABEL_SKEW_X,
    })
  }
}

const holdPlateStill = (plate: Element | null, shape: PlateShape) => {
  if (plate) gsap.set(plate, { clipPath: shape.rest })
}

/** Loop one plate through its drift shapes. The caller keeps the timeline so it
 *  can stop it once the entry is no longer selected. */
const startPlateDrift = (plate: Element | null, shape: PlateShape) => {
  if (!plate) return null

  const timeline = gsap.timeline({ repeat: -1, yoyo: true })
  for (const clipPath of shape.drift) {
    timeline.to(plate, {
      clipPath,
      duration: shape.driftDuration,
      ease: 'sine.inOut',
    })
  }

  return timeline
}

/** Menu entries slide in from the left once, on mount. */
const useMenuIntro = (navRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const nav = navRef.current
    if (!nav || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.from('.MenuItem', {
        x: -60,
        opacity: 0,
        skewX: -14,
        duration: 0.15,
        ease: 'back.out(1.7)',
        stagger: 0.08,
      })
    }, nav)

    return () => ctx.revert()
  }, [navRef])
}

/**
 * The reveal tweens are meant to outlive a cursor move, so `useMenuCursor`
 * cannot stop them in its own cleanup — that runs on every move and would
 * freeze a plate halfway whenever the pointer crosses two entries quickly.
 * This effect depends only on the ref, so its cleanup fires just once, when the
 * menu unmounts, which is the right moment to drop anything still running.
 */
const useMenuTweenTeardown = (navRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const nav = navRef.current

    return () => {
      if (nav) {
        gsap.killTweensOf(nav.querySelectorAll('.MenuBlade, .Link'))
      }
    }
  }, [navRef])
}

/**
 * Moves the selection: every entry is animated to its look, and only the
 * selected one keeps its plates drifting.
 */
const useMenuCursor = (
  navRef: RefObject<HTMLElement | null>,
  activeIndex: number,
) => {
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const items = Array.from(nav.querySelectorAll<HTMLElement>('.MenuItem'))
    const reduced = prefersReducedMotion()
    const drifts: (gsap.core.Timeline | null)[] = []

    items.forEach((item, index) => {
      const entry = readEntry(item)
      const isSelected = index === activeIndex
      const look = isSelected ? ENTRY_LOOK.selected : ENTRY_LOOK.resting

      if (reduced) {
        snapEntry(entry, look)
        holdPlateStill(entry.back, PLATE_SHAPES.back)
        holdPlateStill(entry.front, PLATE_SHAPES.front)
        return
      }

      animateEntry(entry, look)

      if (isSelected) {
        drifts.push(
          startPlateDrift(entry.back, PLATE_SHAPES.back),
          startPlateDrift(entry.front, PLATE_SHAPES.front),
        )
      } else {
        holdPlateStill(entry.back, PLATE_SHAPES.back)
        holdPlateStill(entry.front, PLATE_SHAPES.front)
      }
    })

    return () => {
      drifts.forEach((timeline) => timeline?.kill())
    }
  }, [navRef, activeIndex])
}

/**
 * Persona 3 Reload-style Home menu motion.
 *
 * - Intro: menu items slide in from the left with a springy stagger on mount.
 * - Cursor: whenever `activeIndex` changes, the previous item's plates collapse
 *   while the new item's plates wipe in and its label overshoots to the right.
 * - Idle: the selected item's plates keep shearing through their clip-path
 *   keyframes so the accent never looks static.
 *
 * Work is scoped to `navRef` and cleaned up so tweens never leak across route
 * changes. Reduced-motion users get the end states applied instantly.
 */
export const useMenuAnimations = (
  navRef: RefObject<HTMLElement | null>,
  activeIndex: number,
) => {
  useMenuIntro(navRef)
  useMenuTweenTeardown(navRef)
  useMenuCursor(navRef, activeIndex)
}
