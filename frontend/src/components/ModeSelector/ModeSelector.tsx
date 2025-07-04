import { useEffect } from "react";
import "../ModeSelector/ModeSelector.css"
import { triggerModeSelector } from "./animation";

interface ModeSelectorProps {
  handleModeSelect: (useSingerVoice: boolean) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ handleModeSelect }) => {
    useEffect(() => {
        triggerModeSelector();
    }, [])
    
  return (
    <div className="ModeSelector">
        <div className="ModeSelectorHeader">
            <img src={`${import.meta.env.BASE_URL}/imgs/Aigis/ModeSelector/Aigis0.png`} />
            <div className="ModeSelectorTitle">
                <h2>CHOOSE YOUR MODE</h2>
            </div>
            
        </div>
      <div className="ModeButtons">
        <button className="ModeButton" onClick={() => handleModeSelect(true)}>
          Sing together
        </button>
        <button id="Karaoke" className="ModeButton" onClick={() => handleModeSelect(false)}>
          Karaoke
        </button>
      </div>
    </div>
  );
};

export default ModeSelector;