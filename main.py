from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles # 정적 파일 처리를 위한 클래스

app = FastAPI()

# 'static' 폴더를 '/static' 경로로 마운트 (이 설정이 없으면 이미지를 못 불러옵니다)
app.mount("/static", StaticFiles(directory="static"), name="static")
