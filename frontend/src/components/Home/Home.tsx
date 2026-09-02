import './Home.css'
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'
import { publicAssetUrl } from '../../bootstrap/startupManifest'
import CustomLink from '../../utils/CustomLink'
import GuideTour, {
  GUIDE_TARGET_ATTRIBUTE,
  GUIDE_TARGET_VALUE,
} from '../GuideTour/GuideTour'
import { PlayAudio } from '../../utils/PlayAudio'
import {
  useLogoAnimation,
  useMenuAnimations,
  useStarAnimations,
} from './animations'

const logoUrl = publicAssetUrl(
  import.meta.env.BASE_URL,
  'imgs/Logos/PersonaTunes.svg',
)
const starUrl = publicAssetUrl(import.meta.env.BASE_URL, 'star.svg')
const hoverSoundUrl = publicAssetUrl(
  import.meta.env.BASE_URL,
  'audios/UI/P4Hover.wav',
)

interface MenuItemDef {
  readonly title: string
  readonly to: string
  /** Marks the entry the Elizabeth guide spotlights (RT-UI-005). */
  readonly guideTarget?: boolean
}

const MENU_ITEMS: readonly MenuItemDef[] = [
  { title: 'SELECT MUSIC', to: '/musics', guideTarget: true },
  { title: 'BONUS MUSICS', to: '/work-in-progress' },
  { title: 'PATCH NOTES', to: '/patch-notes' },
  { title: 'THE PROJECT', to: '/work-in-progress' },
]

export interface HomeProps {
  readonly unavailableStartupResourceIds?: ReadonlySet<string>
}

const Home = ({ unavailableStartupResourceIds }: HomeProps) => {
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)

  useStarAnimations()
  useLogoAnimation()
  useMenuAnimations(navRef, activeIndex)

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  const moveCursor = useCallback((next: number, focus = false) => {
    const total = MENU_ITEMS.length
    const clamped = ((next % total) + total) % total
    if (clamped !== activeIndexRef.current) {
      PlayAudio(hoverSoundUrl, 0.5)
    }
    activeIndexRef.current = clamped
    setActiveIndex(clamped)
    if (focus) {
      itemRefs.current[clamped]?.focus()
    }
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const current = activeIndexRef.current
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        moveCursor(current + 1, true)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        moveCursor(current - 1, true)
        break
      case 'Home':
        event.preventDefault()
        moveCursor(0, true)
        break
      case 'End':
        event.preventDefault()
        moveCursor(MENU_ITEMS.length - 1, true)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        itemRefs.current[current]?.querySelector('a')?.click()
        break
      default:
        break
    }
  }

  return (
    <div className="Home">
      <img alt="Persona Tunes" className="Icon" src={logoUrl} />

      {!unavailableStartupResourceIds?.has('shared-star') && (
        <div aria-hidden="true" className="stars">
          <img alt="" className="star star1" src={starUrl} />
          <img alt="" className="star star2" src={starUrl} />
          <img alt="" className="star star3" src={starUrl} />
          <img alt="" className="star star4" src={starUrl} />
          <img alt="" className="star star5" src={starUrl} />
          <img alt="" className="star star6" src={starUrl} />
          <img alt="" className="star star7" src={starUrl} />
          <img alt="" className="star star8" src={starUrl} />
        </div>
      )}

      <nav
        aria-label="Main menu"
        className="HomeButtons"
        onKeyDown={handleKeyDown}
        ref={navRef}
      >
        {[0, 1].map((row) => (
          <div key={row}>
            {MENU_ITEMS.slice(row * 2, row * 2 + 2).map((item, column) => {
              const index = row * 2 + column
              const isActive = index === activeIndex
              return (
                <div
                  className="MenuItem"
                  data-active={isActive}
                  {...(item.guideTarget
                    ? { [GUIDE_TARGET_ATTRIBUTE]: GUIDE_TARGET_VALUE }
                    : {})}
                  key={item.title + item.to}
                  onMouseEnter={() => moveCursor(index)}
                  ref={(element) => {
                    itemRefs.current[index] = element
                  }}
                  tabIndex={isActive ? 0 : -1}
                >
                  <span aria-hidden="true" className="MenuBlade BladeBack" />
                  <span aria-hidden="true" className="MenuBlade BladeFront" />

                  <CustomLink
                    className="Link"
                    tabIndex={-1}
                    title={item.title}
                    to={item.to}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <GuideTour />
    </div>
  )
}

export default Home
