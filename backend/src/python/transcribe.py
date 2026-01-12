import sys
import os
import speech_recognition as sr
from pydub import AudioSegment
from pydub.utils import make_chunks
from difflib import SequenceMatcher
import re

audio_path = sys.argv[1]
expected_lyrics = sys.argv[2]

# Clean up expected_lyrics by removing special characters
expected_lyrics = re.sub(r'[♪!,.]', '', expected_lyrics)

sound = AudioSegment.from_file(audio_path)
sound = sound.set_frame_rate(16000).set_channels(1)

chunks = make_chunks(sound, 5000)

recognizer = sr.Recognizer()
recognizer.energy_threshold = 100
recognizer.dynamic_energy_threshold = True
full_transcription = ""
total_chunks = len(chunks)
failed_chunks = 0

for i, chunk in enumerate(chunks):
    chunk_filename = f"chunk_{i}.wav"
    chunk.export(chunk_filename, format="wav")

    with sr.AudioFile(chunk_filename) as source:
        audio = recognizer.record(source)

    try:
        text = recognizer.recognize_google(audio)
        full_transcription += " " + text
    except sr.UnknownValueError:
        failed_chunks += 1
    except sr.RequestError:
        print("Erro na API no chunk")

    os.remove(chunk_filename)

# Avalia a similaridade com a letra original
similarity = SequenceMatcher(None, full_transcription.lower(), expected_lyrics.lower()).ratio()

# Ajusta a pontuação baseado em quantos chunks falharam
failure_rate = failed_chunks / total_chunks
bonus = failure_rate * 30  
# tive que aumentar o multiplicador para 6 porque no front o audio fica pior quando canta
score = round((similarity * 100) * 6 + bonus, 2)

# Garante que a pontuação não passe de 100
score = min(100, score)

print(score)
print(full_transcription.strip())
