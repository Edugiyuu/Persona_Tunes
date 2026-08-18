import { useEffect, useState } from "react";
import PatchNoteItem from "../PatchNoteItem/PatchNoteItem"
import "../PatchNotes/PatchNotes.css"
import CustomLink from "../../utils/CustomLink";

function PatchNotes() {
    const [characterChosed, setCharacterChosed] = useState("");

    const characters = ["Yuki","Mitsuru","Fuuka","Junpei","Aigis","Yukari","Akihiko","Koromaru"];
    useEffect(() => {
        const character = characters[Math.floor(Math.random() * characters.length)];
        setCharacterChosed(character);

    }, [])


    return (
        <div className="PatchNotes">
            <div className="PatchNotesItens">
                <PatchNoteItem
                    title="Yukiko Arrives in the Mode Selector"
                    version="1.0.7"
                    date="August 17, 2026"
                    changes={[
                        "Added Yukiko's 3D character model to the Mode Selector",
                        "Added a looping character animation",
                        "Preloaded the model and kept the scene hidden until its assets are ready",
                        "Centered the model and added a white drop-shadow treatment",
                        "Added ambient and blue directional lighting to the 3D scene",
                        "Enabled camera rotation, zoom, and panning with interactive controls",
                        "Sized and positioned Yukiko for the Mode Selector layout",
                    ]}
                />
                <PatchNoteItem title="Animated background" version="1.0.6" date="January 11, 2026" changes={["Added 3 new background videos when singing","fix some small bugs","Added score system in the end of the song (not working yet)"]} />
                <PatchNoteItem title="Mode Selector" version="1.0.1" date="July 3, 2025" changes={["Added a new Mode Selector","Fixed scroll animation (hopefully)","Fixed most of the screen (responsiveness) issues","Rip chie voice.."]} />
                <PatchNoteItem title="RELEASE" version="1.0.0" date="July 1, 2025" changes={["PROJECT RELEASE!","More updates coming soon!"]} />
            </div>

            <CustomLink to="/" title="Go back" className="Link PatchNotesGoBack"/>
            <img src={`${import.meta.env.BASE_URL}/imgs/${characterChosed}/PatchNotes/${characterChosed}0.png`} />
        </div>
    )
}

export default PatchNotes