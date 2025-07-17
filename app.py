from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, send_from_directory
import json
import os
import io
from gtts import gTTS
import soundfile as sf
import numpy as np
import ffmpeg
import assemblyai as aai
import re
import time

app = Flask(__name__)
print(__file__)
# Configure AssemblyAI API key
aai.settings.api_key = "202aad4a15ed4353a214fc2e3deffa02"

def load_data():
    """Load data from JSON files."""
    with open('data/animals.json', 'r', encoding='utf-8') as f:
        animals = json.load(f)
    with open('data/flowers.json', 'r', encoding='utf-8') as f:
        flowers = json.load(f)
    return {"animals": animals, "flowers": flowers}

def capitalize_english_text(text):
    """
    Apply English capitalization rules to the text:
    - Capitalize the pronoun 'I'
    - Capitalize the first letter of each sentence
    """
    if not text:
        return text

    # Capitalize standalone 'i' when it's the pronoun 'I'
    text = re.sub(r'\bi\b', 'I', text)

    # Split into sentences and capitalize the first letter of each
    sentences = re.split(r'([.!?]\s+)', text)
    capitalized_sentences = []
    for i in range(len(sentences)):
        sentence = sentences[i]
        if i % 2 == 0 and sentence.strip():
            sentence = sentence[0].upper() + sentence[1:] if len(sentence) > 1 else sentence.upper()
        capitalized_sentences.append(sentence)

    capitalized_text = ''.join(capitalized_sentences)
    if not capitalized_sentences and capitalized_text:
        capitalized_text = capitalized_text[0].upper() + capitalized_text[1:] if len(capitalized_text) > 1 else capitalized_text.upper()

    return capitalized_text

def calculate_word_accuracies(original, recognized):
    original_words = original.lower().split()
    recognized_words = recognized.lower().split()
    accuracies = []
    for orig, rec in zip(original_words, recognized_words):
        if orig == rec:
            accuracies.append(100.0)
        else:
            # Simple similarity based on character overlap
            common = sum(1 for a, b in zip(orig, rec) if a == b)
            max_len = max(len(orig), len(rec))
            accuracy = (common / max_len) * 100 if max_len > 0 else 0
            accuracies.append(accuracy)
    # Handle mismatched word counts
    if len(original_words) > len(recognized_words):
        accuracies.extend([0.0] * (len(original_words) - len(recognized_words)))
    elif len(recognized_words) > len(original_words):
        accuracies = accuracies[:len(original_words)]
    return accuracies

recorded_audio_path = "temp_recording.webm"
converted_audio_path = "temp_recording_converted.wav"

if not os.path.exists('static'):
    os.makedirs('static')

@app.errorhandler(Exception)
def handle_exception(e):
    print(f"Unhandled exception: {str(e)}")
    import traceback
    print(traceback.format_exc())
    return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/login')
def login():
    return send_from_directory('assets', 'login.html')

@app.route('/signup')
def signup():
    return send_from_directory('assets', 'signup.html')

@app.route('/index')
def index():
    topics = list(load_data().keys())  # Load data dynamically
    return render_template('index.html', topics=topics)

@app.route('/get_sentences/<topic>')
def get_sentences(topic):
    data = load_data()  # Load data dynamically
    sentences = data.get(topic, [])
    return jsonify(sentences)

@app.route('/recognize', methods=['POST'])
def recognize():
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        audio_file = request.files['audio']
        current_sentence = request.form.get('sentence', '').strip().lower()
        if not current_sentence:
            return jsonify({"error": "No sentence provided"}), 400

        audio_data = audio_file.read()
        print(f"Received audio data of size: {len(audio_data)} bytes")
        if len(audio_data) == 0:
            return jsonify({"error": "Received empty audio data. Please try recording again."}), 400

        with open(recorded_audio_path, 'wb') as f:
            f.write(audio_data)
        print(f"Audio saved to {recorded_audio_path}")
        file_size = os.path.getsize(recorded_audio_path)
        print(f"File size of {recorded_audio_path}: {file_size} bytes")
        if file_size == 0:
            return jsonify({"error": "Saved audio file is empty. Please try recording again."}), 400

        probe = ffmpeg.probe(recorded_audio_path)
        audio_streams = [stream for stream in probe['streams'] if stream['codec_type'] == 'audio']
        if not audio_streams:
            return jsonify({"error": "No audio stream found in the recorded WebM file. Please ensure your microphone is working."}), 400
        print(f"WebM file audio stream details: {audio_streams}")

        stream = ffmpeg.input(recorded_audio_path)
        stream = ffmpeg.output(
            stream,
            converted_audio_path,
            acodec='pcm_s16le',
            ar=16000,
            ac=1,
            af='volume=60dB,highpass=f=100,lowpass=f=4000',
            format='wav'
        )
        ffmpeg.run(stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)
        print(f"Audio converted from WebM to WAV and saved to {converted_audio_path}")

        data, samplerate = sf.read(converted_audio_path)
        print(f"Converted audio - Sample rate: {samplerate}, Channels: {data.shape[1] if len(data.shape) > 1 else 1}, Data type: {data.dtype}, Number of samples: {data.size}")
        if data.size == 0:
            return jsonify({"error": "Converted audio file contains no samples. Please try recording again."}), 400
        max_amplitude = np.max(np.abs(data))
        print(f"Max amplitude of converted audio: {max_amplitude}")
        print(f"First 10 audio samples: {data[:10]}")
        if max_amplitude < 0.005:
            return jsonify({"error": "Converted audio is too quiet or silent. Please speak louder and try again."}), 400

        config = aai.TranscriptionConfig(
            speech_model=aai.SpeechModel.best,
            language_code="en"
        )
        transcriber = aai.Transcriber(config=config)
        transcript = transcriber.transcribe(converted_audio_path)
        
        if transcript.status == "error":
            print(f"AssemblyAI transcription failed: {transcript.error}")
            return jsonify({"error": f"Transcription failed: {transcript.error}"}), 500

        recognized_text = transcript.text.strip() if transcript.text else ""
        print(f"AssemblyAI result - Recognized text (before capitalization): {recognized_text}")
        if not recognized_text:
            print("No text recognized by AssemblyAI.")
            return jsonify({"error": "No speech recognized. Please speak clearly and try again."}), 400

        capitalized_text = capitalize_english_text(recognized_text)
        print(f"Recognized text (after capitalization): {capitalized_text}")

        word_accuracies = calculate_word_accuracies(current_sentence, recognized_text)
        overall_accuracy = sum(word_accuracies) / len(word_accuracies) if word_accuracies else 0

        return jsonify({
            "recognized_text": capitalized_text,
            "word_accuracies": word_accuracies,
            "overall_accuracy": overall_accuracy
        })

    except Exception as e:
        print(f"Unexpected error in /recognize: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/recognize_speech', methods=['POST'])
def recognize_speech():
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        audio_file = request.files['audio']
        audio_data = audio_file.read()
        print(f"Received audio data of size: {len(audio_data)} bytes")
        if len(audio_data) == 0:
            return jsonify({"error": "Received empty audio data. Please try recording again."}), 400

        with open(recorded_audio_path, 'wb') as f:
            f.write(audio_data)
        print(f"Audio saved to {recorded_audio_path}")
        file_size = os.path.getsize(recorded_audio_path)
        print(f"File size of {recorded_audio_path}: {file_size} bytes")
        if file_size == 0:
            return jsonify({"error": "Saved audio file is empty. Please try recording again."}), 400

        probe = ffmpeg.probe(recorded_audio_path)
        audio_streams = [stream for stream in probe['streams'] if stream['codec_type'] == 'audio']
        if not audio_streams:
            return jsonify({"error": "No audio stream found in the recorded WebM file. Please ensure your microphone is working."}), 400
        print(f"WebM file audio stream details: {audio_streams}")

        stream = ffmpeg.input(recorded_audio_path)
        stream = ffmpeg.output(
            stream,
            converted_audio_path,
            acodec='pcm_s16le',
            ar=16000,
            ac=1,
            af='volume=60dB,highpass=f=100,lowpass=f=4000',
            format='wav'
        )
        ffmpeg.run(stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)
        print(f"Audio converted from WebM to WAV and saved to {converted_audio_path}")

        data, samplerate = sf.read(converted_audio_path)
        print(f"Converted audio - Sample rate: {samplerate}, Channels: {data.shape[1] if len(data.shape) > 1 else 1}, Data type: {data.dtype}, Number of samples: {data.size}")
        if data.size == 0:
            return jsonify({"error": "Converted audio file contains no samples. Please try recording again."}), 400
        max_amplitude = np.max(np.abs(data))
        print(f"Max amplitude of converted audio: {max_amplitude}")
        print(f"First 10 audio samples: {data[:10]}")
        if max_amplitude < 0.005:
            return jsonify({"error": "Converted audio is too quiet or silent. Please speak louder and try again."}), 400

        config = aai.TranscriptionConfig(
            speech_model=aai.SpeechModel.best,
            language_code="en"
        )
        transcriber = aai.Transcriber(config=config)
        transcript = transcriber.transcribe(converted_audio_path)
        
        if transcript.status == "error":
            print(f"AssemblyAI transcription failed: {transcript.error}")
            return jsonify({"error": f"Transcription failed: {transcript.error}"}), 500

        recognized_text = transcript.text.strip() if transcript.text else ""
        print(f"AssemblyAI result - Recognized text (before capitalization): {recognized_text}")
        if not recognized_text:
            print("No text recognized by AssemblyAI.")
            return jsonify({"error": "No speech recognized. Please speak clearly and try again."}), 400

        capitalized_text = capitalize_english_text(recognized_text)
        print(f"Recognized text (after capitalization): {capitalized_text}")

        return jsonify({
            "recognized_text": capitalized_text
        })

    except Exception as e:
        print(f"Unexpected error in /recognize_speech: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/get_model_audio/<sentence>')
def get_model_audio(sentence):
    try:
        voice = request.args.get('voice', 'US-Male')
        tts = gTTS(text=sentence, lang='en')
        audio_file = io.BytesIO()
        tts.write_to_fp(audio_file)
        audio_file.seek(0)
        return send_file(audio_file, mimetype="audio/mpeg", as_attachment=True, download_name="model_sentence.mp3")
    except Exception as e:
        print(f"Error in /get_model_audio: {str(e)}")
        return jsonify({"error": f"Failed to generate model audio: {str(e)}"}), 500

# Serve static files from assets directory
@app.route('/assets/<path:filename>')
def serve_static(filename):
    return send_from_directory('assets', filename)

if __name__ == '__main__':
    app.run(debug=True)