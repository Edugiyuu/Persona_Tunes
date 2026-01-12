import { useEffect, useState } from 'react';
import CustomLink from '../../utils/CustomLink';
import '../MusicEnded/MusicEnded.css';
import { triggerAlbumImg, triggerResult, triggerScoreBar } from './animation';
import axios from 'axios';

interface MusicEndedProps {
  albumImageUrl: string;
  musicName: string;
  userAudioId: string;
}

function MusicEnded({ albumImageUrl, userAudioId }: MusicEndedProps) {
  const [score, setScore] = useState<number | null>(null);
  const [rank, setRank] = useState<string>('');

  useEffect(() => {
    triggerAlbumImg();
    triggerResult();
  }, []);

  useEffect(() => {
    if (!userAudioId) return;

    const interval = setInterval(() => {
      axios
        .get(`${import.meta.env.VITE_API_URL}/score/result/${userAudioId}`)
        .then((res) => {
          const newScore = res.data?.score;
          console.log("Tentando pegar score:", newScore);
          if (newScore) {
            setScore(newScore);
            clearInterval(interval); // para de tentar após obter
          }
        })
        .catch((err) => {
          console.error("Erro ao buscar score:", err);
        });
    }, 10000);

    return () => clearInterval(interval);
  }, [userAudioId]);

  useEffect(() => {
    if (score !== null) {
      let newRank;
      if (score >= 90) {
        newRank = 'A';
      } else if (score >= 76) {
        newRank = 'B';
      } else if (score >= 60) {
        newRank = 'C';
      } else if (score >= 42) {
        newRank = 'D';
      } else if (score >= 23) {
        newRank = 'E';
      } else {
        newRank = 'F';
      }
      setRank(newRank);
      triggerScoreBar(score, newRank);
    }
  }, [score]);


  return (
    <div className='MusicEnded'>
      <img src={albumImageUrl} alt="Album Cover" />
      <div className='Result'>
        
        <div className='Score'>
          <div className='ScorePoints'>
            <p id='PointsShow'>Points:</p>
            <p id='Points'>{score ? score.toFixed() : "..."}</p>
          </div>
          <div className='ScoreRank'>
            <p id='RankShow'>Rank:</p>
          <p id='Rank' className={`Label${rank}`}>{rank ? rank : "?"}</p>
          </div>
          

        </div>
        <div className="ScoreWrapper">
          <div className="ScoreLabels">
            <span className='LabelF'>F</span>
            <span className='LabelE'>E</span>
            <span className='LabelD'>D</span>
            <span className='LabelC'>C</span>
            <span className='LabelB'>B</span>
            <span className='LabelA'>A</span>
          </div>

          <div className="ScoreBackground">
            <div className="ScoreBar"></div>
          </div>
        </div>

        <CustomLink className='Return' to='/musics' title="Return" />
        <footer>The results may take awhile to calculate be patient..</footer>
      </div>
    </div>
  );
}

export default MusicEnded;
