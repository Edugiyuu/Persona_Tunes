import { gsap } from "gsap";
import { PlayAudio } from "../../utils/PlayAudio";

export const triggerAlbumImg = () => {
  gsap.fromTo('.MusicEnded img', {
    opacity: 0,
    ease: "power1.inOut",
  },
    {
      x: 0,
      y: 0,
      duration: 0.5,
      opacity: 1,

      ease: "power1.inOut",
    },
  );
};
export const triggerResult = () => {
  gsap.fromTo('.Result', {
    x: "80%",
   
    ease: "power1.inOut",
  },
    {
      x: 0,
      y: 0,
      duration: 0.5,
      opacity: 1,

      ease: "power1.inOut",
    },
  );
};

export const triggerScoreBar = (score: number, rank?:string) => {
  gsap.fromTo('.ScoreBar', {
    width: "0%",
  },
    {
      width: `${score}%`,
      duration: 2,
      opacity: 1,
      onComplete: () => {
        PlayAudio(`${import.meta.env.BASE_URL}/audios/UI/ScoreLetter.wav`,1);
      },
      ease: "power1.inOut",
    },
  );
  gsap.fromTo(`.Label${rank}`, {
    opacity: 0,
    scale: 0.5,
    y: 20
  },
    {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 1,
      delay: 1,
      ease: "back.out(1.7)",
    },
  );
};