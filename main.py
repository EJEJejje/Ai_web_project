import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from google import genai

# .env 파일에서 환경 변수 로드
load_dotenv()

# Gemini API 키 로드
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

# Gemini 클라이언트 초기화
client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(title="작은 성취 헬스케어 서비스")

# 개발용 CORS (배포 시 도메인 제한하세요)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Req(BaseModel):
    prompt: str
    temperature: float = 0.7
    max_new_tokens: int = 160

# 정적 파일 마운트 (CSS, JS, 이미지)
app.mount("/static", StaticFiles(directory="static"), name="static")

# 루트 경로 - HTML 페이지 반환
@app.get("/")
async def read_root():
    return FileResponse("EJ_1.html")

@app.post("/generate")
async def generate(req: Req):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY 환경변수를 설정하세요.")

    try:
        # Gemini API 호출
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=req.prompt,
            config={
                "temperature": req.temperature,
                "max_output_tokens": req.max_new_tokens,
            }
        )
        
        # 응답 텍스트 추출
        generated_text = response.text
        
        print(f"✅ SUCCESS - Generated text length: {len(generated_text)}")
        
        return {"text": generated_text.strip()}
        
    except Exception as e:
        error_message = str(e)
        print(f"❌ ERROR - Gemini API Error: {error_message}")
        raise HTTPException(status_code=500, detail=f"Gemini API 오류: {error_message}")
