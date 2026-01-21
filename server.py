import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

HF_ENDPOINT = os.getenv("HF_ENDPOINT", "")  # 예: https://api-inference.huggingface.co/models/ORG/MODEL
HF_TOKEN = os.getenv("HF_TOKEN", "")        # 예: hf_xxx

app = FastAPI()

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

@app.post("/generate")
async def generate(req: Req):
    if not HF_ENDPOINT or not HF_TOKEN:
        raise HTTPException(status_code=400, detail="HF_ENDPOINT/HF_TOKEN 환경변수를 설정하세요.")

    payload = {
        "inputs": req.prompt,
        "parameters": {
            "temperature": req.temperature,
            "max_new_tokens": req.max_new_tokens,
            "return_full_text": False,
        },
    }

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(HF_ENDPOINT, json=payload, headers=headers)

    if r.status_code >= 400:
        raise HTTPException(status_code=r.status_code, detail=r.text[:500])

    data = r.json()

    # 여러 응답 형태 대응
    if isinstance(data, list) and len(data) > 0 and "generated_text" in data[0]:
        return {"text": str(data[0]["generated_text"]).strip()}
    if isinstance(data, dict) and "generated_text" in data:
        return {"text": str(data["generated_text"]).strip()}
    if isinstance(data, dict) and "text" in data:
        return {"text": str(data["text"]).strip()}

    return {"text": str(data).strip()}
