from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from ..config import settings

# Async SQLite engine
engine = create_async_engine(
    settings.database_url,
    echo=False,  # Tắt SQL log để tránh lỗi Unicode trên Windows console
    future=True,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """FastAPI dependency: inject async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def create_all_tables():
    """Tạo toàn bộ bảng (dùng khi startup)."""
    from .base import Base
    # Import để đảm bảo ORM models được đăng ký vào Base.metadata
    from ..models.orm import candidate_orm, user_orm, analysis_orm, observation_orm  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
