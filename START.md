# 🚀 빠른 시작 가이드

## 1️⃣ 환경 설정 (최초 1회만)

### .env 파일 생성
```bash
cp ENV_EXAMPLE.txt .env
```

### .env 파일 편집
파일을 열어서 Hugging Face 토큰을 입력하세요:

```env
HF_ENDPOINT=https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf
HF_TOKEN=여기에_실제_토큰_입력
HF_MODEL=meta-llama/Llama-2-7b-chat-hf
HOST=0.0.0.0
PORT=8000
```

**Hugging Face 토큰 발급:**
1. https://huggingface.co 회원가입
2. Settings → Access Tokens
3. "New token" → Read 권한으로 생성
4. 복사해서 `.env` 파일에 붙여넣기

---

## 2️⃣ 의존성 설치 (최초 1회만)

```bash
pip install -r requirements.txt
```

---

## 3️⃣ 서버 실행

```bash
python run_server.py
```

실행되면 다음과 같이 표시됩니다:
```
============================================================
🚀 작은 성취 헬스케어 서비스 시작
============================================================
📍 로컬 접속: http://localhost:8000
🌐 외부 접속: http://<당신의_IP_주소>:8000
...
============================================================
```

---

## 4️⃣ 접속하기

### 본인 컴퓨터에서
```
http://localhost:8000
```

### 같은 WiFi에 있는 다른 사람 (스마트폰 등)

1. **내 IP 확인:**
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```
   
2. **접속 주소 공유:**
   ```
   http://192.168.x.x:8000
   ```

---

## ✅ 사용자 경험

접속한 사람은 **별도 설정 없이 바로 사용 가능**합니다!

- 작은 성취 기록 → 격려 받기
- 스트레스 해소 팁
- 시나리오 퀴즈

---

## 💡 참고사항

### 첫 요청이 느려요 (20-30초)
- Hugging Face 무료 API의 "Cold Start" 현상
- 정상이며, 이후 요청은 더 빨라집니다

### 1-5명 사용 예상
- 무료 API로 충분합니다
- 추가 비용 없음

### 서버 중지
- `Ctrl + C` 누르기

---

## 🌍 인터넷 공개 (선택사항)

인터넷 어디서든 접속하려면 ngrok 사용:

```bash
# 터미널 1
python run_server.py

# 터미널 2
ngrok http 8000
```

생성된 URL(예: `https://xxx.ngrok.io`) 공유!

---

## 📞 도움말

문제 발생 시:
1. `.env` 파일에 토큰이 올바르게 입력되었는지 확인
2. `python run_server.py` 실행 시 에러 메시지 확인
3. 방화벽 설정 확인

더 자세한 내용: `DEPLOY_README.md` 참고
