import { render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gsap } from 'gsap'
import { useGuideAnimations } from './animation'

const tweenKill = vi.fn()
const contextRevert = vi.fn()

vi.mock('gsap', () => ({
  gsap: {
    to: vi.fn(() => ({ kill: tweenKill })),
    set: vi.fn(),
    from: vi.fn(),
    killTweensOf: vi.fn(),
    context: vi.fn((fn: () => void) => {
      fn()
      return { revert: contextRevert }
    }),
  },
}))

const mockedGsap = vi.mocked(gsap)

const LINE = 'Choose "SELECT MUSIC" to begin.'

/** Minimal stand-in for the guide's markup: portrait, box, and the line. */
const Harness = ({ active }: { active: boolean }) => {
  const portraitRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLParagraphElement>(null)

  useGuideAnimations({ portraitRef, boxRef, lineRef }, LINE, active)

  return (
    <div>
      <div className="GuidePortrait" ref={portraitRef} />
      <div className="GuideDialogue" ref={boxRef}>
        <p className="GuideLine" ref={lineRef}>
          {LINE}
        </p>
      </div>
    </div>
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

describe('guide motion with reduced motion requested', () => {
  beforeEach(() => setReducedMotion(true))

  it('applies the end states instantly instead of tweening (AC-9)', () => {
    render(<Harness active />)

    expect(mockedGsap.set).toHaveBeenCalled()
    expect(mockedGsap.to).not.toHaveBeenCalled()
    expect(mockedGsap.from).not.toHaveBeenCalled()
  })

  it('leaves the line whole rather than typing it out (AC-9)', () => {
    const { container } = render(<Harness active />)

    expect(container.querySelector('.GuideLine')).toHaveTextContent(LINE)
  })
})

describe('guide motion with motion allowed', () => {
  beforeEach(() => setReducedMotion(false))

  it('slides the portrait and the box in, and types the line', () => {
    render(<Harness active />)

    expect(mockedGsap.from).toHaveBeenCalledTimes(2)
    expect(mockedGsap.to).toHaveBeenCalledTimes(1)
  })

  it('empties the line so the typewriter has something to fill', () => {
    const { container } = render(<Harness active />)

    expect(container.querySelector('.GuideLine')).toHaveTextContent('')
  })

  it('does nothing at all while the guide is not running', () => {
    render(<Harness active={false} />)

    expect(mockedGsap.from).not.toHaveBeenCalled()
    expect(mockedGsap.to).not.toHaveBeenCalled()
    expect(mockedGsap.set).not.toHaveBeenCalled()
  })

  it('kills every tween it owns on unmount, so nothing accumulates', () => {
    const { unmount } = render(<Harness active />)

    unmount()

    expect(mockedGsap.killTweensOf).toHaveBeenCalledTimes(1)
    expect(contextRevert).toHaveBeenCalledTimes(1)
    expect(tweenKill).toHaveBeenCalledTimes(1)
  })

  it('restores the full line if the reveal is interrupted', () => {
    const { container, unmount } = render(<Harness active />)
    const line = container.querySelector('.GuideLine')

    unmount()

    expect(line).toHaveTextContent(LINE)
  })

  it('leaves nothing running across repeated mounts', () => {
    for (let i = 0; i < 3; i += 1) {
      const { unmount } = render(<Harness active />)
      unmount()
    }

    expect(mockedGsap.killTweensOf).toHaveBeenCalledTimes(3)
    expect(contextRevert).toHaveBeenCalledTimes(3)
    expect(tweenKill).toHaveBeenCalledTimes(3)
  })
})
