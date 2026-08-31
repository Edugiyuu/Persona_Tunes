import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ModeSelector from './ModeSelector'
import { PlayAudio } from '../../utils/PlayAudio'

vi.mock('./animation', () => ({
  triggerModeSelector: vi.fn(),
  useModeAnimations: vi.fn(),
}))
vi.mock('../../utils/PlayAudio', () => ({ PlayAudio: vi.fn() }))

const playAudio = vi.mocked(PlayAudio)

beforeEach(() => {
  playAudio.mockClear()
})

const activeLabels = (container: HTMLElement) =>
  [...container.querySelectorAll('.ModeItem[data-active="true"]')].map(
    (item) => item.textContent,
  )

const renderSelector = () => {
  const handleModeSelect = vi.fn()
  const { container } = render(
    <ModeSelector handleModeSelect={handleModeSelect} />,
  )
  const nav = container.querySelector('nav') as HTMLElement
  return { container, handleModeSelect, nav }
}

describe('ModeSelector mode choice', () => {
  it('reports the singer-voice mode from the first entry', () => {
    const { container, handleModeSelect } = renderSelector()
    const items = container.querySelectorAll('.ModeItem')

    fireEvent.click(items[0])

    expect(handleModeSelect).toHaveBeenCalledWith(true)
  })

  it('reports karaoke mode from the second entry', () => {
    const { container, handleModeSelect } = renderSelector()
    const items = container.querySelectorAll('.ModeItem')

    fireEvent.click(items[1])

    expect(handleModeSelect).toHaveBeenCalledWith(false)
  })

  it('renders the artwork instead of a 3D canvas', () => {
    const { container } = renderSelector()

    expect(container.querySelector('canvas')).toBeNull()
    expect(container.querySelector('.ModeArtwork')).not.toBeNull()
  })

  it('mounts both blink frames up front, so the first blink cannot flash', () => {
    const { container } = renderSelector()
    const frames = [...container.querySelectorAll('.ModeArtworkFrame')]

    expect(frames.map((frame) => frame.getAttribute('src'))).toEqual([
      '/imgs/Aigis/Blink/Aegis0.png',
      '/imgs/Aigis/Blink/Aegis1.png',
    ])
    expect(frames[1]).toHaveClass('ModeArtworkBlink')
  })
})

describe('ModeSelector cursor', () => {
  it('starts on the first entry', () => {
    const { container } = renderSelector()

    expect(activeLabels(container)).toEqual(['Sing together'])
  })

  it('moves with the arrow keys and wraps at both ends', () => {
    const { container, nav } = renderSelector()

    fireEvent.keyDown(nav, { key: 'ArrowDown' })
    expect(activeLabels(container)).toEqual(['Karaoke'])

    fireEvent.keyDown(nav, { key: 'ArrowDown' })
    expect(activeLabels(container)).toEqual(['Sing together'])

    fireEvent.keyDown(nav, { key: 'ArrowUp' })
    expect(activeLabels(container)).toEqual(['Karaoke'])
  })

  it('jumps to the first and last entry with Home and End', () => {
    const { container, nav } = renderSelector()

    fireEvent.keyDown(nav, { key: 'End' })
    expect(activeLabels(container)).toEqual(['Karaoke'])

    fireEvent.keyDown(nav, { key: 'Home' })
    expect(activeLabels(container)).toEqual(['Sing together'])
  })

  it('follows the pointer', () => {
    const { container } = renderSelector()
    const items = container.querySelectorAll('.ModeItem')

    fireEvent.mouseEnter(items[1])

    expect(activeLabels(container)).toEqual(['Karaoke'])
  })

  it('plays the hover cue when the cursor moves, and only then', () => {
    const { container, nav } = renderSelector()

    expect(playAudio).not.toHaveBeenCalled()

    fireEvent.keyDown(nav, { key: 'ArrowDown' })
    expect(playAudio).toHaveBeenCalledWith('/audios/UI/P4Hover.wav', 0.5)

    playAudio.mockClear()
    fireEvent.mouseEnter(container.querySelectorAll('.ModeItem')[1])
    expect(playAudio).not.toHaveBeenCalled()
  })

  it('plays the select cue on activation', () => {
    const { container } = renderSelector()

    fireEvent.click(container.querySelectorAll('.ModeItem')[0])

    expect(playAudio).toHaveBeenCalledWith('/audios/UI/P4Select.wav', 0.5)
  })

  it('keeps exactly one entry reachable by tab', () => {
    const { container } = renderSelector()
    const items = [...container.querySelectorAll('.ModeItem')]

    expect(items.filter((i) => i.getAttribute('tabindex') === '0')).toHaveLength(
      1,
    )
  })
})
