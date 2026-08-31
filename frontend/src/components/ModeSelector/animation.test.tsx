import { render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gsap } from 'gsap'
import { useModeAnimations } from './animation'

const timelineKill = vi.fn()
const timelineTo = vi.fn()
const contextRevert = vi.fn()

vi.mock('gsap', () => {
  // One chainable stub per created timeline, so `timeline` counts creations
  // only — chaining `.to()` must not look like another timeline.
  const timeline = vi.fn(() => {
    const stub = {
      to: (...args: unknown[]) => {
        timelineTo(...args)
        return stub
      },
      kill: timelineKill,
    }
    return stub
  })

  return {
    gsap: {
      to: vi.fn(),
      set: vi.fn(),
      from: vi.fn(),
      killTweensOf: vi.fn(),
      timeline,
      context: vi.fn((fn: () => void) => {
        fn()
        return { revert: contextRevert }
      }),
    },
  }
})

const mockedGsap = vi.mocked(gsap)

/** Minimal stand-in for the real markup: two entries, each with both plates. */
const Harness = ({ activeIndex }: { activeIndex: number }) => {
  const navRef = useRef<HTMLElement>(null)
  useModeAnimations(navRef, activeIndex)

  return (
    <nav ref={navRef}>
      {['Sing together', 'Karaoke'].map((title, index) => (
        <button
          className="ModeItem"
          data-active={index === activeIndex}
          key={title}
          type="button"
        >
          <span className="ModeBlade ModeBladeBack" />
          <span className="ModeBlade ModeBladeFront" />
          <span className="ModeLabel">{title}</span>
        </button>
      ))}
    </nav>
  )
}

const setReducedMotion = (reduce: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('mode selector motion with reduced motion requested', () => {
  beforeEach(() => setReducedMotion(true))

  it('applies the end states instantly instead of tweening', () => {
    render(<Harness activeIndex={0} />)

    expect(mockedGsap.set).toHaveBeenCalled()
    expect(mockedGsap.to).not.toHaveBeenCalled()
  })

  it('never starts the idle drift', () => {
    render(<Harness activeIndex={0} />)

    expect(mockedGsap.timeline).not.toHaveBeenCalled()
  })

  it('skips the intro tween', () => {
    render(<Harness activeIndex={0} />)

    expect(mockedGsap.from).not.toHaveBeenCalled()
  })
})

describe('mode selector motion with motion allowed', () => {
  beforeEach(() => setReducedMotion(false))

  it('drifts only the selected entry, one timeline per plate', () => {
    render(<Harness activeIndex={0} />)

    expect(mockedGsap.timeline).toHaveBeenCalledTimes(2)
  })

  it('stops the drift timelines when the cursor moves away', () => {
    const { rerender } = render(<Harness activeIndex={0} />)
    expect(timelineKill).not.toHaveBeenCalled()

    rerender(<Harness activeIndex={1} />)

    expect(timelineKill).toHaveBeenCalledTimes(2)
  })

  it('kills every tween it owns on unmount, so nothing accumulates', () => {
    const { unmount } = render(<Harness activeIndex={0} />)

    unmount()

    expect(mockedGsap.killTweensOf).toHaveBeenCalledTimes(1)
    expect(contextRevert).toHaveBeenCalledTimes(1)
    expect(timelineKill).toHaveBeenCalledTimes(2)
  })

  it('leaves nothing running across repeated mounts', () => {
    for (let i = 0; i < 3; i += 1) {
      const { unmount } = render(<Harness activeIndex={0} />)
      unmount()
    }

    // Two drift timelines started and stopped on every round trip.
    expect(mockedGsap.timeline).toHaveBeenCalledTimes(6)
    expect(timelineKill).toHaveBeenCalledTimes(6)
    expect(mockedGsap.killTweensOf).toHaveBeenCalledTimes(3)
  })
})
