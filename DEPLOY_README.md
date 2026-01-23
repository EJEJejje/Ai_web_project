# 🌐 웹페이지 배포 가이드

## 📋 빠른 시작

### 1️⃣ 환경 설정

```bash
# .env 파일 생성
cp ENV_EXAMPLE.txt .env
```

`.env` 파일을 열어서 Hugging Face 토큰 입력:
```
HF_TOKEN=your_actual_token_here
```

### 2️⃣ 의존성 설치

```bash
pip install -r requirements.txt
```

### 3️⃣ 서버 실행

```bash
python run_server.py
```

### 4️⃣ 접속 확인

브라우저에서 `http://localhost:8000` 열기

---

## 🏠 같은 WiFi에서 접속하기

다른 사람들이 같은 WiFi에서 접속할 수 있게 하려면:

### 내 IP 주소 확인

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```cmd
ipconfig
```

예시 출력: `192.168.0.100`

### 주소 공유

같은 WiFi에 연결된 사람들에게:
```
http://192.168.0.100:8000
```

---

## 🌍 인터넷에서 접속하기 (ngrok)

인터넷 어디서든 접속 가능하게 만들기:

### 1. ngrok 설치

[https://ngrok.com/download](https://ngrok.com/download)

또는 Mac:
```bash
brew install ngrok
```

### 2. 서버 실행 (터미널 1)

```bash
python run_server.py
```

### 3. ngrok 실행 (터미널 2)

```bash
ngrok http 8000
```

### 4. 공개 URL 공유

ngrok이 생성한 URL (예: `https://abcd1234.ngrok.io`)을 공유하면 완료!

---

## 🔧 문제 해결

### 포트 사용 중 오류

**Mac/Linux:**
```bash
lsof -ti:8000 | xargs kill -9
```

**Windows:**
```cmd
netstat -ano | findstr :8000
taskkill /PID <PID번호> /F
```

### 방화벽 차단

**Mac:** 시스템 환경설정 > 보안 > 방화벽 > Python 허용

**Windows:** Windows Defender 방화벽 > 포트 8000 허용

---

## 💡 사용 팁

### 서버 백그라운드 실행 (Mac/Linux)

```bash
nohup python run_server.py > server.log 2>&1 &
```

### 서버 중지

```bash
# 프로세스 찾기
ps aux | grep python

# 중지
kill <PID>
```

---

## 📱 모바일에서 접속

1. 모바일을 같은 WiFi에 연결
2. 브라우저에서 `http://192.168.0.xxx:8000` 열기
3. 정상 작동!

---

## 🎯 요약

**로컬 테스트:**
```bash
python run_server.py
# → http://localhost:8000
```

**같은 WiFi 공유:**
```bash
python run_server.py
# → http://<내_IP>:8000
```

**인터넷 공유:**
```bash
# 터미널 1
python run_server.py

# 터미널 2
ngrok http 8000
# → https://xxx.ngrok.io
```
