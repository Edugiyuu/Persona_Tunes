import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./SelectMusic.css";
import { animations } from "./animations";
import ViewMusic from "../ViewMusic/ViewMusic";
import axios from "axios";
import { PlayAudio } from "../../utils/PlayAudio";

gsap.registerPlugin(ScrollTrigger);

const SelectMusic = () => {

  type Music = {
    lyrics: string;
    name: string;
    musicUrl: string;
    albumImageUrl: string;
    _id: string;
    difficulty: string;
  };

  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);

  const [musics, setMusics] = useState<Music[]>([])

  useEffect(() => {
    const fetchMusics = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/musics`);
        setMusics(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMusics();
  }, []);

  useEffect(() => {
    if (musics.length > 0) {
      animations();
    }
  }, [musics]);

  return (
    <div className="SelectMusic">
      <div className="AllMusics">
        {musics.map((music) => (
          <div key={music._id} className="Music">
            <img src={`${import.meta.env.BASE_URL}/star.svg`} alt="music icon" />
            <div>
              <p>{music.name}</p>
              <button onClick={() => { setSelectedMusic(music); PlayAudio(`${import.meta.env.BASE_URL}/audios/UI/P4Hover.wav`, 0.7); }}>VIEW MUSIC..</button>
            </div>
          </div>
        ))}
      </div>

      {selectedMusic && (
        <ViewMusic
          name={selectedMusic.name}
          musicUrl={selectedMusic.musicUrl}
          _id={selectedMusic._id}
          albumImageUrl={selectedMusic.albumImageUrl}
          difficulty={selectedMusic.difficulty}
        />
      )}
    </div>
  );
};

export default SelectMusic;