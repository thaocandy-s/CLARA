import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .config import settings
from .routers import clara_router, candidates_router, user_router
from .services.claude_client import claude_client
from .database.engine import create_all_tables, AsyncSessionLocal
from .database.seed import seed_initial_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: tạo bảng DB và seed dữ liệu mẫu nếu chưa có."""
    await create_all_tables()
    async with AsyncSessionLocal() as db:
        await seed_initial_data(db)
    print(f"[DB] Database ready: {settings.database_url}")
    yield
    # Shutdown (nếu cần cleanup sau này)


app = FastAPI(
    title="CLARA · Dating Compatibility Agent (Matching-Coach)",
    description="Backend Core Agent & API sử dụng Claude LLM để phân tích tương thích hẹn hò, đối chiếu giá trị và hỗ trợ quyết định.",
    version="1.0.0",
    lifespan=lifespan,
)

# Cấu hình CORS để mọi Frontend (localhost, file explorer, Vite...) đều gọi được API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các API Routers
app.include_router(clara_router)
app.include_router(candidates_router)
app.include_router(user_router)


@app.get("/api/health", tags=["System"])
async def health_check():
    """Kiểm tra tình trạng hoạt động của hệ thống và Claude API"""
    return {
        "status": "online",
        "service": "CLARA Dating Compatibility Core Agent",
        "version": "1.0.0",
        "claude_api_configured": claude_client.is_available,
        "claude_model": settings.claude_model if claude_client.is_available else "fallback-intelligent-engine",
        "environment": settings.environment
    }


# Mount thư mục Frontend HTML Mockups (docs/designs/matching-coach)
frontend_path = settings.frontend_dir
if frontend_path.exists() and frontend_path.is_dir():
    # Phục vụ trang chủ index.html
    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse(frontend_path / "index.html")

    # Phục vụ file tĩnh
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="static_frontend")
