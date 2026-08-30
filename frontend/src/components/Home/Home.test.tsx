import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Home from './Home'

vi.mock('./animations', () => ({
  useStarAnimations: vi.fn(),
  useLogoAnimation: vi.fn(),
  useMenuAnimations: vi.fn(),
}))
vi.mock('../../utils/CustomLink', () => ({
  default: ({ title }: { title: string }) => <a href="/">{title}</a>,
}))
vi.mock('../../utils/PlayAudio', () => ({ PlayAudio: vi.fn() }))

const activeTitles = (container: HTMLElement) =>
  [...container.querySelectorAll('.MenuItem[data-active="true"]')].map(
    (item) => item.textContent,
  )

describe('Home shell assets', () => {
  it('uses base-safe URLs without duplicate slashes', () => {
    const { container } = render(<Home />)
    const logo = container.querySelector('.Icon')
    const stars = [...container.querySelectorAll('.star')]

    expect(logo).toHaveAttribute('src', '/imgs/Logos/PersonaTunes.svg')
    expect(stars).toHaveLength(8)
    for (const star of stars) {
      expect(star).toHaveAttribute('src', '/star.svg')
    }
  })
  it('omits a known-failed optional star after degraded continuation', () => {
    const { container } = render(
      <Home unavailableStartupResourceIds={new Set(['shared-star'])} />,
    )

    expect(container.querySelector('.stars')).not.toBeInTheDocument()
    expect(container.querySelectorAll('img[src="/star.svg"]')).toHaveLength(0)
  })
})

describe('Home menu cursor', () => {
  it('starts with the first item active', () => {
    const { container } = render(<Home />)
    expect(activeTitles(container)).toEqual(['SELECT MUSIC'])
  })

  it('moves the cursor with arrow keys and wraps around', () => {
    const { container } = render(<Home />)
    const nav = container.querySelector('.HomeButtons') as HTMLElement

    fireEvent.keyDown(nav, { key: 'ArrowDown' })
    expect(activeTitles(container)).toEqual(['BONUS MUSICS'])

    fireEvent.keyDown(nav, { key: 'ArrowRight' })
    fireEvent.keyDown(nav, { key: 'ArrowRight' })
    expect(activeTitles(container)).toEqual(['THE PROJECT'])

    fireEvent.keyDown(nav, { key: 'ArrowRight' })
    expect(activeTitles(container)).toEqual(['SELECT MUSIC'])
  })

  it('jumps to the first and last item with Home and End', () => {
    const { container } = render(<Home />)
    const nav = container.querySelector('.HomeButtons') as HTMLElement

    fireEvent.keyDown(nav, { key: 'End' })
    expect(activeTitles(container)).toEqual(['THE PROJECT'])

    fireEvent.keyDown(nav, { key: 'Home' })
    expect(activeTitles(container)).toEqual(['SELECT MUSIC'])
  })
})
