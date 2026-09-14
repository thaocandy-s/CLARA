import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Tìm và nạp file .env từ thư mục gốc dự án
ROOT_DIR = Path(__file__).resolve().parent.parent
env_path = ROOT_DIR / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseModel):
    # Anthropic API Key
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    claude_model: str = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")

    # Server configs
    host: str = os.getenv("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "8000"))
    environment: str = os.getenv("ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "info")

    # Static files directory (docs/designs/matching-coach)
    frontend_dir: Path = ROOT_DIR / "docs" / "designs" / "matching-coach"

    # Database
    database_url: str = os.getenv(
        "DATABASE_URL",
        f"sqlite+aiosqlite:///{ROOT_DIR / 'clara.db'}"
    )


settings = Settings()
