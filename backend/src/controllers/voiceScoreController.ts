import { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import Music from "../models/music";
import { log } from "console";

// Armazenamento temporário em memória
type ResultData = {
  score: number;
  transcription: string;
};
//Map é uma class
const resultStore = new Map<string, ResultData>();

// POST /score/:id
export const analyzeVoice = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const musicId = req.params.id;

    if (!file) return res.status(400).json({ error: "Nenhum áudio enviado" });
    if (!musicId) return res.status(400).json({ error: "ID da música ausente" });

    const music = await Music.findById(musicId);
    if (!music) return res.status(404).json({ error: "Música não encontrada" });

    const expectedLyrics = music.lyrics.map(line => line.text).join(" ");
    const audioPath = path.resolve(file.path);
    const requestId = uuidv4();

    setImmediate(() => {
      const pythonProcess = spawn("python", [
        "src/python/transcribe.py", //sys.argv[0]
        audioPath, //sys.argv[1]
        expectedLyrics, //sys.argv[2]
      ]);

      let output = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
        log(`Python Output: ${data}`);
      });

      pythonProcess.stderr.on("data", (data) => {
        console.error(`Python Error ${data}`);
      });

      pythonProcess.on("close", () => {
        fs.unlink(audioPath, (err) => {
          if (err) console.error("Erro ao remover arquivo:", err);
        });
        // trim tira os espaços em branco do começo e do final da string
        const [scoreStr, ...transcriptionLines] = output.trim().split("\n");
        const score = parseFloat(scoreStr) || 0;
        const transcription = transcriptionLines.join("\n").trim();


        resultStore.set(requestId, { score, transcription});
        console.log(`Transcrição completa ID: ${requestId}`);
        

        setTimeout(() => {
          resultStore.delete(requestId);
        }, 1000 * 60 * 5);
      });
    });

    res.status(202).json({
      status: "processing",
      requestId,
    });

  } catch (error) {
    console.error("Erro no analyzeVoice:", error);
    res.status(500).json({ error: "Erro ao processar o áudio" });
  }
};

// GET /score/result/:requestId
export const getVoiceResult = (req: Request, res: Response) => {
  const requestId = req.params.requestId;
  const result = resultStore.get(requestId);

  if (!result) {
    return res.status(202).json({ status: "processing" });
  }

  res.status(200).json({
    status: "done",
    ...result,
  });
};
