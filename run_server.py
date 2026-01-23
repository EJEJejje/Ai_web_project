"""
서버 실행 스크립트
외부 접속을 위해 0.0.0.0으로 바인딩
"""
import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    print("=" * 60)
    print("🚀 작은 성취 헬스케어 서비스 시작")
    print("=" * 60)
    print(f"📍 로컬 접속: http://localhost:{port}")
    print(f"🌐 외부 접속: http://<당신의_IP_주소>:{port}")
    print("")
    print("💡 외부에서 접속하려면:")
    print("   1. 같은 WiFi: http://<내부_IP>:8000")
    print("   2. 인터넷: ngrok 또는 포트포워딩 필요")
    print("=" * 60)
    
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
