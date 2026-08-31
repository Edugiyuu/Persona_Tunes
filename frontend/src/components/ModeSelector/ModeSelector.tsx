import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import "./ModeSelector.css";
import { publicAssetUrl } from "../../bootstrap/startupManifest";
import { PlayAudio } from "../../utils/PlayAudio";
import { triggerModeSelector, useModeAnimations } from "./animation";

const aigisHeaderUrl = publicAssetUrl(
  import.meta.env.BASE_URL,
  "imgs/Aigis/ModeSelector/Aigis0.png",
);
const aigisEyesOpenUrl = publicAssetUrl(
  import.meta.env.BASE_URL,
  "imgs/Aigis/Blink/Aegis0.png",
);
const aigisEyesClosedUrl = publicAssetUrl(
  import.meta.env.BASE_URL,
  "imgs/Aigis/Blink/Aegis1.png",
);
const hoverSoundUrl = publicAssetUrl(
  import.meta.env.BASE_URL,
  "audios/UI/P4Hover.wav",
);
const selectSoundUrl = publicAssetUrl(
  import.meta.env.BASE_URL,
  "audios/UI/P4Select.wav",
);

interface ModeItemDef {
  readonly title: string;
  readonly useSingerVoice: boolean;
}

const MODE_ITEMS: readonly ModeItemDef[] = [
  { title: "Sing together", useSingerVoice: true },
  { title: "Karaoke", useSingerVoice: false },
];

interface ModeSelectorProps {
  handleModeSelect: (useSingerVoice: boolean) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ handleModeSelect }) => {
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    triggerModeSelector();
  }, []);

  useModeAnimations(navRef, activeIndex);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const moveCursor = useCallback((next: number, focus = false) => {
    const total = MODE_ITEMS.length;
    const clamped = ((next % total) + total) % total;
    if (clamped !== activeIndexRef.current) {
      PlayAudio(hoverSoundUrl, 0.5);
    }
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
    if (focus) {
      itemRefs.current[clamped]?.focus();
    }
  }, []);

  const selectMode = (useSingerVoice: boolean) => {
    PlayAudio(selectSoundUrl, 0.5);
    handleModeSelect(useSingerVoice);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const current = activeIndexRef.current;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveCursor(current + 1, true);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveCursor(current - 1, true);
        break;
      case "Home":
        event.preventDefault();
        moveCursor(0, true);
        break;
      case "End":
        event.preventDefault();
        moveCursor(MODE_ITEMS.length - 1, true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="ModeSelector">
      <div className="ModeSelectorHeader">
        <img alt="" src={aigisHeaderUrl} />
        <div className="ModeSelectorTitle">
          <h2>CHOOSE YOUR MODE</h2>
        </div>
      </div>

      {/* Both frames stay mounted and stacked: the closed-eye one is faded in
          for a few frames at a time, so the first blink never waits on a fetch. */}
      <div aria-hidden="true" className="ModeArtwork">
        <img alt="" className="ModeArtworkFrame" src={aigisEyesOpenUrl} />
        <img
          alt=""
          className="ModeArtworkFrame ModeArtworkBlink"
          src={aigisEyesClosedUrl}
        />
      </div>

      <nav
        aria-label="Mode selector"
        className="ModeButtons"
        onKeyDown={handleKeyDown}
        ref={navRef}
      >
        {MODE_ITEMS.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              className="ModeItem"
              data-active={isActive}
              key={item.title}
              onClick={() => selectMode(item.useSingerVoice)}
              onMouseEnter={() => moveCursor(index)}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              <span aria-hidden="true" className="ModeBlade ModeBladeBack" />
              <span aria-hidden="true" className="ModeBlade ModeBladeFront" />
              <span className="ModeLabel">{item.title}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ModeSelector;
