import sys
import uvicorn
from backend.config import settings

# Đảm bảo mã hóa UTF-8 trên Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def main():
    print("=" * 70)
    print("CLARA DATING COMPATIBILITY AGENT (MATCHING-COACH)")
    print(f"API Server & Web UI: http://{settings.host}:{settings.port}")
    print(f"Swagger API Docs:    http://{settings.host}:{settings.port}/docs")
    print(f"Claude LLM Model:    {settings.claude_model}")
    print("=" * 70)

    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=True if settings.environment == "development" else False,
        log_level=settings.log_level.lower(),
    )

if __name__ == "__main__":
    main()
