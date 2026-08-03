import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Home from './Home'

vi.mock('./animations', () => ({
  animations: vi.fn(),
  LogoAnimation: vi.fn(),
}))
vi.mock('../../utils/CustomLink', () => ({
  default: ({ title }: { title: string }) => <a href="/">{title}</a>,
}))

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