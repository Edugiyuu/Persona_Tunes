import './Home.css'
import { publicAssetUrl } from '../../bootstrap/startupManifest'
import CustomLink from '../../utils/CustomLink'
import { animations, LogoAnimation } from './animations'

const logoUrl = publicAssetUrl(
  import.meta.env.BASE_URL,
  'imgs/Logos/PersonaTunes.svg',
)
const starUrl = publicAssetUrl(import.meta.env.BASE_URL, 'star.svg')

export interface HomeProps {
  readonly unavailableStartupResourceIds?: ReadonlySet<string>
}

const Home = ({ unavailableStartupResourceIds }: HomeProps) => {
  animations()
  LogoAnimation()

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

      <div className="HomeButtons">
        <div>
          <CustomLink className="Link" title="SELECT MUSIC" to="/musics" />
          <CustomLink
            className="Link"
            title="BONUS MUSICS"
            to="/work-in-progress"
          />
        </div>
        <div>
          <CustomLink className="Link" title="PATCH NOTES" to="/patch-notes" />
          <CustomLink
            className="Link"
            title="THE PROJECT"
            to="/work-in-progress"
          />
        </div>
      </div>
    </div>
  )
}

export default Home