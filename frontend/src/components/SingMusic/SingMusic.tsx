import { useEffect, useState } from "react";
import ModeSelector from "../ModeSelector/ModeSelector";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "../SingMusic/SingMusic.css";
import axios from "axios";
import { useParams } from "react-router-dom";
import AutoVoiceRecorder from "../AudioRecorder/AutoVoiceRecorder";
import { triggerDialogAnimation, triggerBackDialogAnimation, TPDialogBack, triggerBackDialogAnimationMode, CutInAnimation, LyricsAnimation } from "./animations";
import { PlayAudio } from "../../utils/PlayAudio";
import MusicEnded from "../MusicEnded/MusicEnded";

interface Music {
  musicUrl: string;
  instrumentalUrl: string;
  albumImageUrl: string;
  name: string;
}

interface Subtitle {
  time: number;
  text: string;
}

function SingMusic() {
  const [lyrics, setLyrics] = useState<Subtitle[]>([]);
  const [data, setData] = useState<Music>();
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [randomNumber, setRandomNumber] = useState<number>(0);
  const [selectMode, setSelectMode] = useState<boolean>(true);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [showLyrics, setShowLyrics] = useState(true);
  const [startRecording, setStartRecording] = useState(false);
  const [stopRecording, setStopRecording] = useState(false);
  const [userAudioId, setUserAudioId] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [character, setCharacter] = useState('');
  const [videoUrl] = useState<string>(() => {
    const videos = [
      import.meta.env.VITE_VIDEO1_URL,
      import.meta.env.VITE_VIDEO2_URL,
      import.meta.env.VITE_VIDEO3_URL
    ];
    return videos[Math.floor(Math.random() * videos.length)];
  });
  const { id } = useParams();


  useEffect(() => {
    TPDialogBack();
    axios.get(`${import.meta.env.VITE_API_URL}/music/${id}`)
      .then((res) => {
        setData(res.data);
        setLyrics(res.data.lyrics);
        triggerBackDialogAnimation();
      })
      .catch((err) => {
        console.error(err);
      });
  }, [id]);

  useEffect(() => {
    LyricsAnimation();
    if (currentSubtitle === "♪♪♪") {
      const characters = ["Yosuke", "Chie"];
      const character = characters[Math.floor(Math.random() * characters.length)];
      setCharacter(character);
      triggerDialogAnimation();
      setRandomNumber(Math.floor(Math.random() * 2));
    } else {
      triggerBackDialogAnimation();
    }
    if (showResult) {
      triggerBackDialogAnimation();
    }
    if (currentSubtitle === "!!!") {
      PlayAudio(`${import.meta.env.BASE_URL}/audios/UI/P4Cut-In.wav`, 0.5);
      setRandomNumber(Math.floor(Math.random() * 5));
      CutInAnimation();
    }
  }, [currentSubtitle, showResult]);

  const handleTimeUpdate = () => {
    const audio = document.querySelector("audio");
    if (!audio) return;

    // guarda em segundos o momento atual da música
    setCurrentTime(audio.currentTime);
    // procura qual legenda deve aparecer neste momento
    // .slice cria uma cópia do array para não modificar o original
    // .reverse inverte a ordem do array para que a legenda mais recente apareça primeiro
    // .find procura a primeira legenda que tem o tempo menor ou igual ao momento atual
    const subtitle = lyrics.slice().reverse().find((subtitle) => currentTime >= subtitle.time)

    // se encontrou uma legenda nova, seta o currentSubtitle
    if (subtitle && subtitle.text !== currentSubtitle) {
      setCurrentSubtitle(subtitle.text);
    }
  };
  const handleModeSelect = (useSingerVoice: boolean) => {
    if (!data) {
      return console.log("no data");
    };

    if (useSingerVoice) {
      setAudioUrl(data.musicUrl)
    } else {
      setAudioUrl(data.instrumentalUrl)
    }
    triggerBackDialogAnimationMode();
    setSelectMode(false);
  };

  return (
    <div className="SingMusic">
      {!selectMode && (
        <video
          className="background-video"
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      {audioUrl && (
        <AudioPlayer
          src={audioUrl}
          onListen={handleTimeUpdate}
          showSkipControls={false}
          showJumpControls={false}
          customVolumeControls={[]}
          layout="horizontal"
          autoPlay={true}
          volume={0.8}
          onPlay={() => setStartRecording(true)}
          onEnded={() => {
            setStopRecording(true);
            setShowResult(true);
            setShowLyrics(false);
          }}
        />
      )}
      <AutoVoiceRecorder
        startRecording={startRecording}
        stopRecording={stopRecording}
        onStop={(blobUrl, blob) => {
          console.log("Gravação concluída:", blobUrl);

          const formData = new FormData();
          formData.append("audio", blob, "audio.webm");

          axios
            .post(`${import.meta.env.VITE_API_URL}/score/${id}`, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
            .then((res) => {
              const idFromResponse = res.data.requestId;
              setUserAudioId(idFromResponse); // <- Estado atualizado corretamente
              console.log("Request ID:", idFromResponse);
            })
            .catch((err) => {
              console.error("Erro ao enviar o áudio:", err);
            });
        }}
      />




      <div className="stars">
        <img src={`${import.meta.env.BASE_URL}/star.svg`} className="star star1" />
        <img src={`${import.meta.env.BASE_URL}/star.svg`} className="star star2" />
        <img src={`${import.meta.env.BASE_URL}/star.svg`} className="star star3" />
        <img src={`${import.meta.env.BASE_URL}/star.svg`} className="star star4" />
        <img src={`${import.meta.env.BASE_URL}/star.svg`} className="star star5" />
        <img src={`${import.meta.env.BASE_URL}/star.svg`} className="star star6" />
        <img src={`${import.meta.env.BASE_URL}/star.svg`} className="star star7" />
        <img src={`${import.meta.env.BASE_URL}/star.svg`} className="star star8" />
      </div>

      {selectMode && (
        <ModeSelector handleModeSelect={handleModeSelect} />
      )}
      {showResult && (
        <MusicEnded
          albumImageUrl={data?.albumImageUrl || ""}
          musicName={data?.name || ""}
          userAudioId={userAudioId}
        />
      )}
      {!selectMode && (
        <div className="lyrics" style={{ display: showLyrics ? 'flex' : 'none' }}>
          {lyrics.map((line, i) => {
            // Pula as letras que ainda não devem ser mostradas baseado no tempo atual
            if (currentTime < line.time) return null;
            // Pega as próximas 2 linhas da letra para mostrar como prévia

            const nextLines = lyrics.slice(i + 1, i + 3);
            const nextLine = lyrics[i + 1];
            const isCurrent = line.text === currentSubtitle;
            const duration = nextLine ? nextLine.time - line.time : 1;

            return (
              <div key={line.time}>
                <h1
                  className="highlighted"
                  style={
                    isCurrent ? { animationDuration: `${duration}s` } : undefined
                  }
                >
                  {line.text}
                </h1>
                {/* Mostra as próximas 2 linhas */}
                {nextLines.map((nextLine) => (
                  <p key={nextLine.time} className="faded">
                    {nextLine.text}
                  </p>
                ))}
              </div>
            );
            // Inverte o array para mostrar a letra mais recente primeiro
            // Encontra o primeiro elemento não-nulo (letra atual a ser mostrada)
          }).reverse().find(Boolean)}

        </div>
      )}

      <div className="PersonaChar" id="RandomChar">
        <img src={`${import.meta.env.BASE_URL}/imgs/${character}/InMusic/${character}-${randomNumber}.png`} />
      </div>

      <div className="CutIn">
        <img src={`${import.meta.env.BASE_URL}/imgs/CutIn/CutIn-${randomNumber}.png`} id="CutInChar" />
      </div>
    </div>
  );
}

export default SingMusic;