import { useEffect } from 'react';
import { animations } from './animations';
import './ViewMusic.css';
import CustomLink from '../../utils/CustomLink';
import { useGuideTour } from '../GuideTour/guideContext';

import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

type ViewMusicProps = {
    name: string;
    musicUrl: string;
    albumImageUrl: string;
    _id: string;
    difficulty: string;
};

const ViewMusic = ({ name, musicUrl, _id, albumImageUrl, difficulty }: ViewMusicProps) => {
    const triggerAnimation = animations();
    // Elizabeth is talking over this panel during the tour (D-4).
    const { isActive: guideIsActive } = useGuideTour();

    useEffect(() => {
        triggerAnimation();
    }, [triggerAnimation]);

    return (
        <div className="ViewMusic">
            <div className='Infos'>
                <img id='albumImageUrl' src={albumImageUrl} />
                <p>{name}</p>
                <div className='difficulty'>
                    <p>Difficulty: </p>
                    <h2 className={difficulty} id={difficulty}>{difficulty.toLocaleUpperCase().slice(0,1)}</h2>
                    <p id={`p${difficulty}`} className={difficulty}>{difficulty.toLocaleUpperCase().slice(1)}</p>
                    
                </div>

                <div className='StartMusicBox'>
                    <CustomLink data-guide-target='start-music' to={`/sing-music/${_id}`} title='START!' className='StartMusic' />
                    <AudioPlayer
                        autoPlay={!guideIsActive}
                        src={musicUrl}
                        volume={guideIsActive ? 0 : 0.3}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ViewMusic;
