# English Learning App

**English Learning App** is a web application that supports English learning with two main modes: **Pronunciation** and **Chatbot**. This app helps users improve their pronunciation and communication skills through interactive features.

---

## 🌟 Features

### 1. Pronunciation Mode

- **Choose topic**: Users can select from available topics such as:
  - "Animals"
  - "Flowers"
  - "My Dictionary"

- **My Dictionary**:
  - Add, edit, or delete personal English sentences.
  - Save sentences in the user’s personal list.

- **Pronunciation practice**:
  - Listen to sample pronunciations (supports US-Male, US-Female, UK-Male, UK-Female).
  - Record user pronunciation and receive feedback on accuracy (powered by AssemblyAI).
  - View illustration images and Vietnamese meaning (if available).

**Register / Login** <br>
<img width="727" height="374" alt="image" src="https://github.com/user-attachments/assets/147a05e6-1182-41a4-b566-dd623c3fdfb9" />


**Check pronunciation**  
<img width="945" height="504" alt="image" src="https://github.com/user-attachments/assets/5f7a5c2a-8d73-4d02-8572-dc7197efbad6" />

---

### 2. Chatbot Mode

- **Three types of chatbots**:
  - **Grammar Chatbot**: Analyzes the grammar and semantics of English sentences, identifies errors, and suggests corrected versions.
  - **Vocabulary Chatbot**: Provides information about vocabulary such as pronunciation (IPA), Vietnamese meaning, word type, and examples.
  - **Conversation Chatbot**: Engages in natural English conversations, supports speech recognition (AssemblyAI), and responds with synthesized voice (gTTS).

- **Interaction**: Input text or use voice (in Conversation Chatbot).

---

**Chatbot**
<img width="1902" height="967" alt="image" src="https://github.com/user-attachments/assets/2655b7e3-dcff-4a45-966d-4872e7940747" />

# 🧠 Machine Learning and NLP in the Application

The app uses **Machine Learning (ML)** and **Natural Language Processing (NLP)** technologies to provide intelligent features:

### 1. Machine Learning (ML)
- **Speech recognition**: Uses **AssemblyAI** to convert audio into text (speech-to-text) and evaluate pronunciation accuracy. AssemblyAI’s ML models are trained on large voice datasets, enabling accurate recognition of English words and sentences.
- **Audio processing**: The app applies ML techniques to filter noise, enhance audio (using FFmpeg), and analyze amplitude for better recording quality.
- **Pronunciation evaluation**: ML is used to compare user pronunciation with standard pronunciation, providing accuracy scores for each word and the full sentence.

### 2. Natural Language Processing (NLP)
- **Grammar and semantic analysis**: The **Grammar Chatbot** uses **Google Generative Language API** (Gemini 1.5 Flash) to analyze English sentences, detect grammar errors (e.g., incorrect verb tense) and semantic issues (e.g., wrong word choice), and provide correction suggestions.
- **Vocabulary processing**: The **Vocabulary Chatbot** provides detailed word information (IPA, meaning, part of speech) by leveraging NLP models to extract and format linguistic data.
- **Natural conversation**: The **Conversation Chatbot** uses NLP to understand and respond to user input naturally, simulating real-life dialogue. **gTTS** (Google Text-to-Speech) is integrated to generate spoken responses.
- **Text normalization**: The app applies basic NLP techniques (such as regex) to normalize text, for example: capitalizing the first letter of a sentence and the pronoun "I".

These ML and NLP technologies not only deliver accurate feedback but also create a personalized and interactive learning experience.

---

## ⚙️ Installation

### System requirements

- Python 3.9+
- Web browser (Chrome, Firefox, etc.)
- Microphone (for recording feature)
- Internet connection (for AssemblyAI and Google Generative Language APIs)

---

### Manual setup

**Clone repository:**
```bash
git clone https://github.com/yourusername/english-learning-app.git
cd english-learning-app
```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

Configure API keys:

Replace aai.settings.api_key in app.py with your AssemblyAI API key.

Update apiKey in index.html with your Google Generative Language API key.

Ensure data files:

animals.json and flowers.json must be placed inside the data/ directory.

---

### Using Docker

**Build Docker image:**
```bash
docker build -t english-learning-app .
```

**Run container:**
```bash
docker run -p 5000:5000 -e ASSEMBLYAI_API_KEY=your_assemblyai_key -e GOOGLE_API_KEY=your_google_api_key english-learning-app
```

> Replace your_assemblyai_key and your_google_api_key with your own API keys.

---

## 🚀 Usage

### Start the server

- **Manual:**:
```bash
flask run
```

- **Docker**: Already running via the `docker run` command above.

**Access the app:**
- Open your browser and go to: [http://localhost:5000](http://localhost:5000)

---

## 📝 User Guide

- **Login/Register**: Use the login/register page to access the application.

### Pronunciation Mode:
- Select a topic from the dropdown.
- Click on a sentence to practice, listen to a sample, record, and receive feedback.

### Chatbot Mode:
- Choose a chatbot type (Grammar, Vocabulary, Conversation).
- Enter a word/sentence or use the microphone (for Conversation chatbot) and get responses.

---

## ⚠️ Notes

- Ensure your microphone is working for recording features.
- Internet connection is required to call APIs.
- Data files (`animals.json`, `flowers.json`) can be extended to add new topics.

---

