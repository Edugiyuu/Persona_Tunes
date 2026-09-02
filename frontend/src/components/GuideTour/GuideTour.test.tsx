import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GuideTour, {
  GUIDE_TARGET_ATTRIBUTE,
  GUIDE_TARGET_VALUE,
} from './GuideTour'

vi.mock('./animation', () => ({
  prefersReducedMotion: () => true,
  useGuideAnimations: vi.fn(),
}))
vi.mock('../../utils/PlayAudio', () => ({ PlayAudio: vi.fn() }))

const STORAGE_KEY = 'rt.guide.seen'
const DAY_MS = 24 * 60 * 60 * 1000

/** The menu entry the guide points at, standing in for Home's real one. */
const mountTarget = () => {
  const target = document.createElement('a')
  target.setAttribute(GUIDE_TARGET_ATTRIBUTE, GUIDE_TARGET_VALUE)
  target.textContent = 'SELECT MUSIC'
  document.body.append(target)
  return target
}

const scrim = () => document.querySelector('.driver-overlay')
const promptDialog = () => screen.queryByRole('dialog')

const accept = () => fireEvent.click(screen.getByRole('button', { name: /yes/i }))
const decline = () => fireEvent.click(screen.getByRole('button', { name: /no/i }))

/** driver.js paints its overlay a tick after being told to, so every test that
 *  looks at the scrim waits for it rather than assuming it is already there. */
const startGuide = async () => {
  accept()
  await waitFor(() => expect(scrim()).toBeInTheDocument())
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  // Only the stand-in target: wiping the whole body here would pull the tree
  // out from under Testing Library's own cleanup.
  for (const node of document.querySelectorAll(`[${GUIDE_TARGET_ATTRIBUTE}]`)) {
    node.remove()
  }
})

describe('the opt-in prompt', () => {
  it('asks on a first load and offers both answers (AC-1)', () => {
    render(<GuideTour />)

    expect(promptDialog()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
  })

  it('holds Home off behind its own scrim until answered (AC-1)', () => {
    render(<GuideTour />)

    expect(document.querySelector('.GuidePromptScrim')).toBeInTheDocument()
    expect(promptDialog()).toHaveAttribute('aria-modal', 'true')
  })

  it('leaves nothing behind when declined (AC-2)', () => {
    render(<GuideTour />)

    decline()

    expect(promptDialog()).not.toBeInTheDocument()
    expect(document.querySelector('.GuidePromptScrim')).not.toBeInTheDocument()
    expect(document.querySelector('.GuideStage')).not.toBeInTheDocument()
    expect(scrim()).not.toBeInTheDocument()
  })

  it('closes on Escape, same as declining (AC-2)', () => {
    render(<GuideTour />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(promptDialog()).not.toBeInTheDocument()
    expect(document.querySelector('.GuideStage')).not.toBeInTheDocument()
  })
})

describe('the running guide', () => {
  beforeEach(() => {
    mountTarget()
  })

  it('covers the viewport with a scrim once accepted (AC-3)', async () => {
    render(<GuideTour />)

    await startGuide()

    expect(scrim()).toBeInTheDocument()
  })

  it('spotlights the SELECT MUSIC entry and nothing else (AC-4)', async () => {
    render(<GuideTour />)

    await startGuide()

    const highlighted = document.querySelectorAll('.driver-active-element')
    expect(highlighted).toHaveLength(1)
    expect(highlighted[0]).toHaveAttribute(
      GUIDE_TARGET_ATTRIBUTE,
      GUIDE_TARGET_VALUE,
    )
  })

  it('renders no driver.js popover — Elizabeth does the talking (AC-4)', async () => {
    render(<GuideTour />)

    await startGuide()

    expect(document.querySelector('.driver-popover')).not.toBeInTheDocument()
    // …and its phantom popover announcement is stripped off the target.
    const highlighted = document.querySelector('.driver-active-element')
    expect(highlighted).not.toHaveAttribute('aria-controls')
    expect(highlighted).not.toHaveAttribute('aria-haspopup')
  })

  it('stands Elizabeth up with every frame mounted (AC-5)', async () => {
    render(<GuideTour />)

    await startGuide()

    expect(screen.getByAltText('Elizabeth')).toBeInTheDocument()
    // Mouth closed / open, each with its eyes-closed twin: nothing is fetched
    // on the first blink or the first spoken syllable.
    expect(document.querySelectorAll('.GuideFrame')).toHaveLength(4)
    expect(document.querySelectorAll('.GuideBlink')).toHaveLength(2)
  })

  it('starts with her mouth closed, the lip-sync seam unused (AC-5)', async () => {
    render(<GuideTour />)

    await startGuide()

    expect(document.querySelector('.GuideFace')).toHaveAttribute(
      'data-speaking',
      'false',
    )
  })

  it('names her and tells the player where to click (AC-6)', async () => {
    render(<GuideTour />)

    await startGuide()

    expect(screen.getByText('ELIZABETH')).toBeInTheDocument()
    expect(document.querySelector('.GuideLine')?.textContent).toMatch(
      /select music/i,
    )
  })

  it('ends when the spotlit entry is used (AC-7)', async () => {
    render(<GuideTour />)

    await startGuide()
    fireEvent.click(document.querySelector(`[${GUIDE_TARGET_ATTRIBUTE}]`)!)

    expect(document.querySelector('.GuideStage')).not.toBeInTheDocument()
    expect(scrim()).not.toBeInTheDocument()
  })

  it('tears the scrim down on unmount, so a route change cannot strand it', async () => {
    const { unmount } = render(<GuideTour />)

    await startGuide()
    unmount()

    expect(scrim()).not.toBeInTheDocument()
  })

  it('stays out of the way when there is nothing to point at', () => {
    for (const node of document.querySelectorAll(`[${GUIDE_TARGET_ATTRIBUTE}]`)) {
      node.remove()
    }
    render(<GuideTour />)

    accept()

    expect(scrim()).not.toBeInTheDocument()
    expect(document.querySelector('.GuideStage')).not.toBeInTheDocument()
  })
})

describe('remembering the answer', () => {
  it('does not ask again after accepting (AC-7, AC-8)', async () => {
    mountTarget()
    const first = render(<GuideTour />)
    await startGuide()
    first.unmount()

    render(<GuideTour />)

    expect(promptDialog()).not.toBeInTheDocument()
    expect(document.querySelector('.GuideStage')).not.toBeInTheDocument()
  })

  it('does not ask again after declining (AC-8)', () => {
    const first = render(<GuideTour />)
    decline()
    first.unmount()

    render(<GuideTour />)

    expect(promptDialog()).not.toBeInTheDocument()
  })

  it('asks again once the stored answer is more than a day old (AC-8)', () => {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now() - DAY_MS - 1))

    render(<GuideTour />)

    expect(promptDialog()).toBeInTheDocument()
  })

  it('stays quiet while the answer is still within the day (AC-8)', () => {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now() - DAY_MS + 5000))

    render(<GuideTour />)

    expect(promptDialog()).not.toBeInTheDocument()
  })

  it('asks again when the stored value is not a timestamp', () => {
    window.localStorage.setItem(STORAGE_KEY, 'yes')

    render(<GuideTour />)

    expect(promptDialog()).toBeInTheDocument()
  })

  it('still asks, and still works, when storage throws (private windows)', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied')
      })
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('denied')
      })

    render(<GuideTour />)
    expect(promptDialog()).toBeInTheDocument()

    decline()
    expect(promptDialog()).not.toBeInTheDocument()

    getItem.mockRestore()
    setItem.mockRestore()
  })
})
