import express from "express";
import multer from "multer";
import { analyzeVoice,getVoiceResult} from "../controllers/voiceScoreController";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/score/:id", upload.single("audio"), async (req, res, next) => {
  try {
	await analyzeVoice(req, res);
  } catch (err) {
	next(err);
  }
});

export default router;

router.get("/score/result/:requestId", async (req, res, next) => {
  try {
    getVoiceResult(req, res); // retorna o resultado se já tiver sido processado
  } catch (err) {
    next(err);
  }
});
