from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import UserProfile
from ..services.data_store import data_store
from ..database.engine import get_db
from ..models.orm.analysis_orm import AnalysisORM
from ..models.orm.observation_orm import ObservationORM
from sqlalchemy import delete

user_router = APIRouter(prefix="/api/user", tags=["User Profile & Preferences"])


@user_router.get("/profile", response_model=UserProfile)
async def get_user_profile(db: AsyncSession = Depends(get_db)):
    """Lấy hồ sơ tiêu chí và trọng số hiện tại của User"""
    return await data_store.get_user(db=db)


@user_router.post("/profile", response_model=UserProfile)
async def update_user_profile(profile: UserProfile, db: AsyncSession = Depends(get_db)):
    """Cập nhật hồ sơ tiêu chí, deal-breakers và trọng số 7 trục của User"""
    return await data_store.update_user(profile, db=db)


@user_router.post("/reset")
async def reset_user_data(db: AsyncSession = Depends(get_db)):
    """Xóa lịch sử phân tích và ghi chú theo yêu cầu bảo mật (Privacy Reset)"""
    await db.execute(delete(AnalysisORM))
    await db.execute(delete(ObservationORM))
    await db.commit()
    return {"status": "success", "message": "Đã xóa toàn bộ lịch sử phân tích và ghi chú theo yêu cầu bảo mật."}
