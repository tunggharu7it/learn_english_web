let currentMode = 'pronunciation';
let currentChatbot = 'grammar';
let voiceOption = 'US-Male';
let recognition = null;
const apiKey = 'AIzaSyBdr05ImGPH2w_DLtVv2WXEbWf7mAarjtE';
let recordedBlob = null;
let currentSentenceElement = null;
let currentSentence = "";

function switchMode(mode) {
    currentMode = mode;
    document.getElementById('pronunciationBtn').classList.toggle('active', mode === 'pronunciation');
    document.getElementById('chatbotBtn').classList.toggle('active', mode === 'chatbot');
    document.getElementById('pronunciationContent').classList.toggle('active', mode === 'pronunciation');
    document.getElementById('chatbotContent').classList.toggle('active', mode === 'chatbot');
    if (mode === 'chatbot') {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            document.getElementById('speechInputBtn').disabled = currentChatbot !== 'conversation';
        }
        selectChatbot(currentChatbot);
    } else {
        document.getElementById('speechInputBtn').disabled = true;
        handleTopicChange();
    }
}

function selectChatbot(botType) {
    currentChatbot = botType;
    document.getElementById('grammarBtn').classList.toggle('active', botType === 'grammar');
    document.getElementById('vocabBtn').classList.toggle('active', botType === 'vocabulary');
    document.getElementById('conversationBtn').classList.toggle('active', botType === 'conversation');
    document.getElementById('speechInputBtn').disabled = botType !== 'conversation';
    document.getElementById('chatInput').placeholder = botType === 'grammar' ? 'Nhập câu tiếng Anh...' : botType === 'vocabulary' ? 'Nhập từ tiếng Anh...' : 'Nhập câu hoặc dùng giọng nói...';
    document.getElementById('chatBox').innerHTML = ''; // Clear chat box when switching
}

function addMessage(message, isUser = false) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
    messageDiv.innerHTML = message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (!isUser && currentChatbot === 'conversation') {
        speakText(message);
    }
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, '')); // Remove HTML tags
        utterance.lang = 'en-US';
        utterance.volume = 1;
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("Text-to-speech is not supported in this browser.");
    }
}

async function sendMessage() {
    if (currentMode !== 'chatbot') return;
    const input = document.getElementById('chatInput');
    let text = input.value.trim();
    if (!text && (currentChatbot !== 'conversation' || !recordedBlob)) return;

    if (currentChatbot === 'conversation' && recordedBlob) {
        const formData = new FormData();
        formData.append('audio', recordedBlob, 'recording.webm');
        try {
            const response = await fetch('/recognize_speech', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.error) {
                addMessage(`<b>Chatbot Hội thoại:</b> <span class="error">${result.error}</span>`);
                return;
            }
            text = result.recognized_text || "No speech detected.";
            recordedBlob = null;
        } catch (error) {
            addMessage(`<b>Chatbot Hội thoại:</b> <span class="error">Có lỗi xảy ra: ${error.message}</span>`);
            return;
        }
    }

    addMessage(`<br>Bạn: ${text}`, true);
    input.value = '';

    let prompt = '';
    if (currentChatbot === 'grammar') {
        prompt = `Analyze the grammar and semantics of this English sentence: "${text}". Provide the output in this exact format:
         For grammatical errors, highlight only the specific incorrect words or phrases in red using <span class="highlight-red">error</span>.
         For semantic errors (e.g., incorrect word choice or meaning), highlight the entire sentence in red if the meaning is fundamentally wrong, otherwise highlight only the incorrect word/phrase.
         Explain all errors in Vietnamese, distinguishing between grammatical and semantic issues.
         Provide the corrected sentence with both grammatical and semantic corrections.
         If there are no errors, state that the sentence is correct.
        Example output:
         <span class="highlight-red">I goes</span> to school <span class="highlight-red">everyday</span>.
         Giải thích lỗi sai:
         - Lỗi ngữ pháp: "goes" sai vì chủ ngữ "I" yêu cầu động từ "go" ở nguyên thể.
         - Lỗi ngữ pháp: "everyday" sai vì đây là tính từ, cần dùng "every day" là trạng từ.
         Câu đúng: I go to school every day.
        Example with semantic error:
         <span class="highlight-red">I am interesting in books.</span>
         Giải thích lỗi sai:
         - Lỗi ngữ nghĩa: "interesting" sai vì ý định là diễn tả sự quan tâm, cần dùng "interested".
         Câu đúng: I am interested in books.`;
    } else if (currentChatbot === 'vocabulary') {
        prompt = `Provide the following for the English word "${text}" in this exact format:
         Pronunciation (IPA) of the word.
         All meanings in Vietnamese and their word types.
         A good example English sentence that is easy to remember.
        Example output:
         Love (v) /lʌv/: yêu
         Các loại từ khác của love:
         Love (n) /lʌv/: tình yêu
         Lovely (adj) /ˈlʌvli/: đáng yêu
         Example: I love you (anh yêu em).`;
    } else {
        prompt = `Continue a casual English conversation based on the user's input: "${text}". Respond naturally as a friendly chatbot, keeping the conversation engaging and appropriate.`;
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (!data.candidates || !data.candidates[0]) {
            addMessage(`<b>Chatbot ${currentChatbot === 'grammar' ? 'ngữ pháp' : currentChatbot === 'vocabulary' ? 'từ vựng' : 'hội thoại'}:</b> <span class="error">Lỗi khi nhận phản hồi từ API.</span>`);
            return;
        }

        let result = data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>');

        if (currentChatbot === 'grammar') {
            result = result.replace(/Giải thích lỗi sai:/g, '<div class="grammar-error">Giải thích lỗi sai:</div>');
            result = result.replace(/Câu đúng:/g, '<div class="grammar-error">Câu đúng:</div>');
        } else if (currentChatbot === 'vocabulary') {
            result = result.replace(/Các loại từ khác của/g, '<div class="vocab-section">Các loại từ khác của</div>');
            result = result.replace(/Example:/g, '<div class="vocab-section">Example:</div>');
        }

        addMessage(`<b>Chatbot ${currentChatbot === 'grammar' ? 'ngữ pháp' : currentChatbot === 'vocabulary' ? 'từ vựng' : 'hội thoại'}:</b><br>${result}`);
    } catch (error) {
        addMessage(`<b>Chatbot ${currentChatbot === 'grammar' ? 'ngữ pháp' : currentChatbot === 'vocabulary' ? 'từ vựng' : 'hội thoại'}:</b> <span class="error">Có lỗi xảy ra: ${error.message}</span>`);
    }
}

document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && currentMode === 'chatbot') {
        sendMessage();
    }
});

function startSpeechRecognition() {
    if (currentChatbot !== 'conversation') return;
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Speech recognition is not supported in this browser.");
        return;
    }

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        document.getElementById('chatInput').value = speechResult;
        recordedBlob = null;
        sendMessage();
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        alert("Speech recognition failed: " + event.error);
        document.getElementById('speechInputBtn').disabled = false;
    };

    recognition.onend = () => {
        document.getElementById('speechInputBtn').disabled = false;
    };

    document.getElementById('speechInputBtn').disabled = true;
    recognition.start();
}

// Pronunciation Logic
let recorder, audioBlob, stream;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let startTime;
const MIN_RECORDING_DURATION = 2000;
let isAudioDetected = false;
let bufferCount = 0;
let totalAmplitude = 0;
let bufferCountForAvg = 0;

async function loadSentences() {
    const topic = document.getElementById('topic').value;
    const sentenceList = document.getElementById('sentence-list');

    if (!topic) {
        sentenceList.innerHTML = '';
        return;
    }

    const uid = localStorage.getItem('loggedInUserId');
    const response = await fetch(`/get_sentences/${topic}${topic === 'my-dictionary' ? `?uid=${uid}` : ''}`);
    const sentences = await response.json();

    let html = '<h3>Choose a Sentence to Practice:</h3><ul>';
    sentences.forEach((item, index) => {
        html += `
            <li onclick="selectSentence('${item.english.replace(/'/g, "\\'")}', '${item.vietnamese ? item.vietnamese.replace(/'/g, "\\'") : ''}', '${item.image ? item.image.replace(/'/g, "\\'") : ''}', ${index}, this)">
                ${item.english}
                <div class="sentence-content" id="sentence-content-${index}">
                    <div class="pronunciation-result">
                        <h2>Your pronunciation:</h2>
                        <p id="recognized-text-${index}"></p>
                    </div>
                </div>
            </li>`;
    });
    html += '</ul>';
    sentenceList.innerHTML = html;
}

function updateVoiceOption() {
    voiceOption = document.getElementById('voice').value;
    console.log("Voice option updated to:", voiceOption);
}

async function selectSentence(sentence, vietnamese, image, index, element) {
    currentSentence = sentence;
    currentSentenceElement = element;

    const contentDiv = document.getElementById(`sentence-content-${index}`);
    const isActive = contentDiv.classList.contains('active');

    document.querySelectorAll('.sentence-content').forEach(content => content.classList.remove('active'));
    if (!isActive) {
        let additionalContent = '';
        if (vietnamese && image) {
            additionalContent = `
                <div class="image-container">
                    <img id="sentence-image-${index}" src="${image}" alt="Sentence Image">
                    <div id="vietnamese-meaning-${index}" class="vietnamese-meaning">${vietnamese}</div>
                </div>`;
        }

        contentDiv.innerHTML = `
            <div class="pronunciation-result">
                <h2>Your pronunciation:</h2>
                <p id="recognized-text-${index}"></p>
            </div>
            <div class="controls">
                <button id="record-btn-${index}" onclick="startRecording(${index}); event.stopPropagation();">🎙️ Start Recording</button>
                <button id="listen-btn-${index}" onclick="playModelSentence(${index}); event.stopPropagation();">▶️ Listen example</button>
                <button id="listen-again-btn-${index}" onclick="playRecordedAudio(${index}); event.stopPropagation();" disabled>🔄 My pronunciation</button>
            </div>
            ${additionalContent}
        `;
        contentDiv.classList.add('active');
    }

    const lis = document.querySelectorAll('#sentence-list li');
    lis.forEach(li => li.classList.remove('highlighted'));
    element.classList.add('highlighted');

    if (!isActive) {
        document.getElementById(`listen-btn-${index}`).disabled = false;
        document.getElementById(`listen-again-btn-${index}`).disabled = true;
        document.getElementById(`recognized-text-${index}`).innerText = '';
    }
}

async function startRecording(index) {
    if (!currentSentence || currentMode !== 'pronunciation') {
        alert("Please select a sentence to practice!");
        return;
    }

    try {
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log("AudioContext resumed");
        }
        console.log("AudioContext state:", audioContext.state);

        stream = await navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true } }).catch(err => {
            alert("Failed to access microphone: " + err.message);
            throw err;
        });

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            throw new Error("No audio tracks found in the stream. Please check your microphone.");
        }
        console.log("Audio tracks:", audioTracks);

        const input = audioContext.createMediaStreamSource(stream);
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 300.0;
        input.connect(gainNode);

        const scriptNode = audioContext.createScriptProcessor(4096, 1, 1);
        scriptNode.onaudioprocess = (event) => {
            const inputBuffer = event.inputBuffer.getChannelData(0);
            const maxAmplitude = Math.max(...inputBuffer);
            const sum = inputBuffer.reduce((acc, val) => acc + Math.abs(val), 0);
            const avgAmplitude = sum / inputBuffer.length;
            totalAmplitude += avgAmplitude;
            bufferCountForAvg++;
            console.log(`Audio input (buffer ${bufferCount++}) - Max amplitude: ${maxAmplitude}, Avg amplitude: ${avgAmplitude}, Sample data: [${inputBuffer.slice(0, 5).join(', ')}...]`);
            if (maxAmplitude > 0.005) {
                isAudioDetected = true;
            }
        };
        gainNode.connect(scriptNode);
        scriptNode.connect(audioContext.destination);

        recorder = new MediaRecorder(stream, { audioBitsPerSecond: 128000, mimeType: 'audio/webm;codecs=opus' });
        const chunks = [];

        recorder.ondataavailable = (event) => {
            chunks.push(event.data);
        };

        recorder.onstop = () => {
            const duration = (Date.now() - startTime) / 1000;
            audioBlob = new Blob(chunks, { type: 'audio/webm' });
            recordedBlob = audioBlob;
            document.getElementById(`listen-again-btn-${index}`).disabled = false;
            const avgAmplitudeOverall = totalAmplitude / bufferCountForAvg;
            console.log(`Recording complete, duration: ${duration} seconds, blob size: ${audioBlob.size}, isAudioDetected: ${isAudioDetected}, Average amplitude overall: ${avgAmplitudeOverall}`);
            if (audioBlob.size <= 0) {
                alert("Recording failed: Audio blob is empty. Please ensure your microphone is working and try again.");
                return;
            }
            if (!isAudioDetected) {
                alert("No audio detected during recording. Please speak louder or check your microphone.");
                return;
            }
            recognizeSpeech(audioBlob, index);
        };

        recorder.onerror = (err) => {
            console.error("Recording error:", err);
            alert("Recording error: " + err);
            stopRecording(index);
        };

        recorder.start();
        startTime = Date.now();
        isAudioDetected = false;
        bufferCount = 0;
        totalAmplitude = 0;
        bufferCountForAvg = 0;
        console.log("Recording started...");
        document.getElementById(`record-btn-${index}`).innerText = "⏹️ Stop Recording";
        document.getElementById(`record-btn-${index}`).onclick = (event) => {
            event.stopPropagation();
            stopRecording(index);
        };
    } catch (err) {
        console.error("Error starting recording:", err);
        alert("Error starting recording: " + err.message);
        document.getElementById(`record-btn-${index}`).innerText = "🎙️ Start Recording";
        document.getElementById(`record-btn-${index}`).onclick = (event) => {
            event.stopPropagation();
            startRecording(index);
        };
    }
}

function stopRecording(index) {
    if (recorder && recorder.state !== 'inactive') {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < MIN_RECORDING_DURATION) {
            alert(`Please record for at least ${MIN_RECORDING_DURATION / 1000} seconds.`);
            return;
        }
        console.log("Stopping recording...");
        recorder.stop();
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    } else {
        alert("No active recording to stop.");
    }
    document.getElementById(`record-btn-${index}`).innerText = "🎙️ Start Recording";
    document.getElementById(`record-btn-${index}`).onclick = (event) => {
        event.stopPropagation();
        startRecording(index);
    };
}

async function playModelSentence(index) {
    if (!currentSentence || currentMode !== 'pronunciation') {
        alert("Please select a sentence to practice!");
        return;
    }
    console.log(`Playing model sentence for: ${currentSentence} with voice: ${voiceOption}`);
    try {
        const response = await fetch(`/get_model_audio/${encodeURIComponent(currentSentence)}?voice=${voiceOption}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.statusText}`);
        }
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    } catch (err) {
        console.error("Error playing model sentence:", err);
        alert("Error playing model sentence: " + err.message);
    }
}

function playRecordedAudio(index) {
    if (!recordedBlob || currentMode !== 'pronunciation') {
        alert("No recording available to play!");
        return;
    }
    const audioUrl = URL.createObjectURL(recordedBlob);
    const audio = new Audio(audioUrl);
    audio.play();
}

async function recognizeSpeech(blob, index) {
    if (currentMode !== 'pronunciation') return;
    console.log("Sending audio to server for recognition...");
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    formData.append('sentence', currentSentence);

    try {
        const response = await fetch('/recognize', {
            method: 'POST',
            body: formData
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        if (!response.ok) {
            const text = await response.text();
            console.error("Response not OK. Status:", response.status, "Response text:", text);
            throw new Error(`Server returned status ${response.status}: ${text}`);
        }

        const result = await response.json();
        console.log("Server response:", result);
        console.log("Current sentence:", currentSentence);
        console.log("Recognized text:", result.recognized_text);
        console.log("Word accuracies:", result.word_accuracies);
        console.log("Overall accuracy:", result.overall_accuracy);

        if (result.error) {
            alert("Server error: " + result.error);
            return;
        }

        const recognizedText = result.recognized_text || "";
        const wordAccuracies = result.word_accuracies || [];
        const overallAccuracy = result.overall_accuracy || 0;

        let html = `<p>Recognized: ${recognizedText}</p>`;
        html += `<p>Overall Accuracy: ${overallAccuracy.toFixed(2)}%</p>`;
        html += `<div class="word-accuracies">`;
        const originalWords = currentSentence.split(' ');
        originalWords.forEach((word, idx) => {
            const accuracy = wordAccuracies[idx] || 0;
            const color = accuracy >= 90 ? 'green' : accuracy >= 70 ? 'orange' : 'red';
            html += `<span style="background-color: ${color}; padding: 5px; margin: 2px; border-radius: 5px;">${word}: ${accuracy.toFixed(2)}%</span>`;
        });
        html += `</div>`;

        document.getElementById(`recognized-text-${index}`).innerHTML = html;
    } catch (err) {
        console.error("Error recognizing speech:", err);
        alert("Error recognizing speech: " + err.message);
    }
}

const uid = localStorage.getItem('loggedInUserId');

function handleAddWord() {
    const input = document.getElementById('newWordInput');
    const word = input.value.trim();
    if (!word) return alert("Vui lòng nhập câu.");
    if (!uid) return alert("Bạn chưa đăng nhập.");

    addEnglishWord(uid, word);
    input.value = "";
}

function handleTopicChange() {
    const topic = document.getElementById('topic').value;
    const myPanel = document.getElementById('my-dictionary-panel');
    const sentenceList = document.getElementById('sentence-list');

    if (topic === 'my-dictionary') {
        myPanel.style.display = 'block';
        sentenceList.innerHTML = '<h3>Danh sách câu của bạn:</h3><ul id="dictionary-word-list"></ul>';

        if (!uid) return alert("Không tìm thấy UID người dùng");

        listenToUserWords(uid, (words) => {
            const list = document.getElementById("dictionary-word-list");
            if (!list) return console.error("Không tìm thấy UL");

            list.innerHTML = '';
            if (words.length === 0) {
                list.innerHTML = '<li><i>Chưa có câu nào</i></li>';
                return;
            }

            words.forEach((w, index) => {
                const li = document.createElement("li");
                li.setAttribute('onclick', `selectSentence('${w.english.replace(/'/g, "\\'")}', '', '', ${index}, this)`);
                li.innerHTML = `
                    ${w.english}
                    <div class="word-actions">
                        <input id="edit-input-${w.id}" value="${w.english}" style="display: none; padding: 5px; border-radius: 5px;" />
                        <button class="edit-btn" onclick="enableEdit('${w.id}'); event.stopPropagation();" id="edit-btn-${w.id}">✏️</button>
                        <button onclick="saveEdit('${w.id}'); event.stopPropagation();" id="save-btn-${w.id}" style="display: none;">✅</button>
                        <button onclick="cancelEdit('${w.id}', '${w.english}'); event.stopPropagation();" id="cancel-btn-${w.id}" style="display: none;">❌</button>
                        <button class="delete-btn" onclick="deleteWord('${w.id}'); event.stopPropagation();">🗑️</button>
                    </div>
                    <div class="sentence-content" id="sentence-content-${index}">
                        <div class="pronunciation-result">
                            <h2>Your pronunciation:</h2>
                            <p id="recognized-text-${index}"></p>
                        </div>
                    </div>
                `;
                list.appendChild(li);
            });
        });
    } else {
        myPanel.style.display = 'none';
        loadSentences();
    }
}