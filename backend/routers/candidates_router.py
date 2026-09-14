from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.candidate import CandidateProfile
from ..services.data_store import data_store
from ..database.engine import get_db

candidates_router = APIRouter(prefix="/api/candidates", tags=["Candidates"])


@candidates_router.get("", response_model=List[CandidateProfile])
async def list_candidates(db: AsyncSession = Depends(get_db)):
    """Lấy danh sách các ứng viên trong kho hồ sơ"""
    return await data_store.list_candidates(db=db)


@candidates_router.get("/{candidate_id}", response_model=CandidateProfile)
async def get_candidate(candidate_id: str, db: AsyncSession = Depends(get_db)):
    """Lấy chi tiết một hồ sơ ứng viên theo ID"""
    cand = await data_store.get_candidate(candidate_id, db=db)
    if not cand:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy hồ sơ ứng viên: {candidate_id}")
    return cand
