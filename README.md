# English Learning App

**English Learning App** là một ứng dụng web hỗ trợ học tiếng Anh với hai chế độ chính: **Pronunciation (Luyện phát âm)** và **Chatbot (Trò chuyện với bot)**. Ứng dụng này giúp người dùng cải thiện kỹ năng phát âm và giao tiếp tiếng Anh thông qua các tính năng tương tác.

---

## 🌟 Tính năng

### 1. Pronunciation Mode (Luyện phát âm)

- **Chọn chủ đề**: Người dùng có thể chọn từ các chủ đề có sẵn như:
  - "Animals" (Động vật)
  - "Flowers" (Hoa)
  - "My Dictionary" (Từ điển của tôi)

- **My Dictionary**:
  - Thêm, chỉnh sửa hoặc xóa các câu tiếng Anh cá nhân.
  - Lưu trữ câu trong danh sách cá nhân của người dùng.

- **Luyện phát âm**:
  - Nghe cách phát âm mẫu (hỗ trợ các giọng: US-Male, US-Female, UK-Male, UK-Female).
  - Ghi âm phát âm của người dùng và nhận phản hồi về độ chính xác (dựa trên AssemblyAI).
  - Xem hình ảnh minh họa và nghĩa tiếng Việt (nếu có).

**Đăng kí, đăng nhập**
<img width="727" height="374" alt="image" src="https://github.com/user-attachments/assets/147a05e6-1182-41a4-b566-dd623c3fdfb9" />
---

**Check phát âm**
<img width="945" height="504" alt="image" src="https://github.com/user-attachments/assets/5f7a5c2a-8d73-4d02-8572-dc7197efbad6" />

---

### 2. Chatbot Mode (Trò chuyện với bot)

- **Ba loại chatbot**:
  - **Chatbot Ngữ pháp**: Phân tích ngữ pháp và ngữ nghĩa của câu tiếng Anh, chỉ ra lỗi và đưa ra câu sửa đúng.
  - **Chatbot Từ vựng**: Cung cấp thông tin về từ vựng như phát âm (IPA), nghĩa tiếng Việt, loại từ và ví dụ.
  - **Chatbot Hội thoại**: Trò chuyện tự nhiên bằng tiếng Anh, hỗ trợ nhận diện giọng nói (AssemblyAI) và phản hồi bằng giọng nói (gTTS).

- **Tương tác**: Nhập văn bản hoặc sử dụng giọng nói (trong Chatbot Hội thoại).

---

**Chatbot**
<img width="1902" height="967" alt="image" src="https://github.com/user-attachments/assets/2655b7e3-dcff-4a45-966d-4872e7940747" />


## ⚙️ Cài đặt

### Yêu cầu hệ thống

- Python 3.9+
- Trình duyệt web (Chrome, Firefox, v.v.)
- Microphone (cho tính năng ghi âm)
- Kết nối internet (để sử dụng API AssemblyAI và Google Generative Language)

---

### Cài đặt thủ công

**Clone repository:**
```bash
git clone https://github.com/yourusername/english-learning-app.git
cd english-learning-app
```

**Cài đặt dependencies:**
```bash
pip install -r requirements.txt
```

**Cấu hình API keys:**
- Thay `aai.settings.api_key` trong `app.py` bằng API key của bạn từ AssemblyAI.
- Cập nhật `apiKey` trong `index.html` bằng API key từ Google Generative Language API.

**Đảm bảo dữ liệu:**
- Các tệp `animals.json` và `flowers.json` phải nằm trong thư mục `data/`.

---

### Sử dụng Docker

**Build Docker image:**
```bash
docker build -t english-learning-app .
```

**Run container:**
```bash
docker run -p 5000:5000 -e ASSEMBLYAI_API_KEY=your_assemblyai_key -e GOOGLE_API_KEY=your_google_api_key english-learning-app
```

> Thay `your_assemblyai_key` và `your_google_api_key` bằng API keys của bạn.

---

## 🚀 Sử dụng

### Khởi động server

- **Thủ công**:
```bash
flask run
```

- **Docker**: Đã chạy qua lệnh `docker run` ở trên.

**Truy cập ứng dụng:**
- Mở trình duyệt và truy cập: [http://localhost:5000](http://localhost:5000)

---

## 📝 Hướng dẫn sử dụng

- **Đăng nhập/Đăng ký**: Sử dụng trang đăng nhập/đăng ký để truy cập ứng dụng.

### Pronunciation Mode:
- Chọn chủ đề từ dropdown.
- Nhấn vào câu để luyện tập, nghe mẫu, ghi âm và nhận phản hồi.

### Chatbot Mode:
- Chọn loại chatbot (Ngữ pháp, Từ vựng, Hội thoại).
- Nhập câu/từ hoặc sử dụng microphone (cho Hội thoại) và nhận phản hồi.

---

## ⚠️ Lưu ý

- Đảm bảo microphone hoạt động để sử dụng tính năng ghi âm.
- Kết nối internet là bắt buộc để gọi API.
- Các tệp dữ liệu (`animals.json`, `flowers.json`) có thể được mở rộng để thêm chủ đề mới.

---

**Ứng dụng được thiết kế để hỗ trợ học tiếng Anh một cách hiệu quả và thú vị. Chúc bạn học tập tốt!**
