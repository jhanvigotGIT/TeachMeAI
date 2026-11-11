import { KokoroTTS } from "kokoro-js";

let ttsInstance = null;
let loadingPromise = null;

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const VOICE_ID = "af_sky";

export async function loadKokoroTTS() {
  if (ttsInstance) {
    return ttsInstance;
  }

  if (!loadingPromise) {
    loadingPromise = KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: "q8",
      device: "wasm",
    })
      .then((tts) => {
        ttsInstance = tts;
        return tts;
      })
      .catch((error) => {
        loadingPromise = null;
        throw error;
      });
  }

  return loadingPromise;
}

export async function generateSpeech(text, speed = 1) {
  const tts = await loadKokoroTTS();

  return tts.generate(text, {
    voice: VOICE_ID,
    speed,
  });
}