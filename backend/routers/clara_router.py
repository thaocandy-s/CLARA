import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.analysis import (
    AnalyzeRequest,
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
    ReanalyzeRequest,
    ReanalyzeResponse,
)
from ..services.data_store import data_store
from ..engines.compatibility_engine import compatibility_engine
from ..engines.copilot_engine import copilot_engine
from ..engines.observation_engine import observation_engine
from ..database.engine import get_db

clara_router = APIRouter(prefix="/api/clara", tags=["CLARA Core Agent"])


class AddObservationRequest(BaseModel):
    candidate_id: str
    content: str = Field(..., min_length=1)
    lang: str = Field("vi")


@clara_router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_compatibility(req: AnalyzeRequest, db: AsyncSession = Depends(get_db)):
    """Engine 1: Phân tích độ tương thích 7 trục & suy luận Checklist 3 màu"""
    # 1. Xác định UserProfile
    lang = req.lang or "vi"
    user = req.user_profile or await data_store.get_user(db=db, lang=lang)

    # 2. Xác định CandidateProfile
    cand = req.candidate_profile
    if not cand and req.candidate_id:
        cand = await data_store.get_candidate(req.candidate_id, db=db)
    if not cand:
        cand = await data_store.get_candidate("cand_01", db=db)
    if not cand:
        raise HTTPException(status_code=400, detail="Không tìm thấy hồ sơ đối tượng để phân tích.")

    # 3. Phân tích qua CompatibilityEngine
    analysis_data = await compatibility_engine.analyze(user=user, candidate=cand, lang=lang)
    await data_store.save_analysis(analysis_data, db=db, lang=lang)

    return AnalyzeResponse(status="success", data=analysis_data)


@clara_router.post("/chat", response_model=ChatResponse)
async def chat_with_clara(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Engine 2: Trò chuyện tư vấn với Clara Coach"""
    lang = req.lang or "vi"
    user = await data_store.get_user(db=db, lang=lang)
    cand = await data_store.get_candidate(req.candidate_id, db=db) if req.candidate_id else None
    anly = await data_store.get_analysis(req.analysis_id or req.candidate_id or "", db=db)

    response_data = await copilot_engine.chat(
        query=req.query,
        user=user,
        candidate=cand,
        analysis=anly,
        history=req.conversation_history,
        lang=lang
    )

    return ChatResponse(status="success", data=response_data)


@clara_router.post("/chat/stream")
async def stream_chat_with_clara(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Engine 2: Stream hội thoại với Clara qua Server-Sent Events (SSE)"""
    lang = req.lang or "vi"
    user = await data_store.get_user(db=db, lang=lang)
    cand = await data_store.get_candidate(req.candidate_id, db=db) if req.candidate_id else None
    anly = await data_store.get_analysis(req.analysis_id or req.candidate_id or "", db=db)

    async def event_generator():
        async for chunk in copilot_engine.stream_chat(
            query=req.query,
            user=user,
            candidate=cand,
            analysis=anly,
            history=req.conversation_history,
            lang=lang
        ):
            data = json.dumps({"delta": chunk}, ensure_ascii=False)
            yield f"data: {data}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@clara_router.post("/reanalyze", response_model=ReanalyzeResponse)
async def reanalyze_from_observation(req: ReanalyzeRequest, db: AsyncSession = Depends(get_db)):
    """Engine 3: Đọc ghi chú thực tế sau buổi hẹn và cập nhật lại bản đồ tương thích"""
    lang = req.lang or "vi"
    user = await data_store.get_user(db=db, lang=lang)
    cand = await data_store.get_candidate(req.candidate_id, db=db)
    if not cand:
        cand = await data_store.get_candidate("cand_01", db=db)

    prev_analysis = await data_store.get_analysis(
        req.previous_analysis_id or req.candidate_id, db=db
    )

    # Lưu ghi chú vào lịch sử
    now = datetime.now()
    if lang == "ja":
        time_str = f"{now.hour:02d}:{now.minute:02d} 今日 · あなたが記録"
    else:
        time_str = f"{now.hour:02d}:{now.minute:02d} Hôm nay · Ghi nhận bởi bạn"
    await data_store.add_observation(req.candidate_id, req.new_observation_note, time_str, db=db, lang=lang)

    # Chạy Engine 3
    reanalysis_data = await observation_engine.reanalyze(
        candidate=cand,
        user=user,
        note=req.new_observation_note,
        prev_analysis=prev_analysis,
        lang=lang
    )

    return ReanalyzeResponse(status="success", data=reanalysis_data)


@clara_router.post("/observations")
async def add_observation(req: AddObservationRequest, db: AsyncSession = Depends(get_db)):
    """Lưu nhật ký quan sát của User sau buổi hẹn"""
    now = datetime.now()
    lang = req.lang or "vi"
    if lang == "ja":
        time_str = f"{now.hour:02d}:{now.minute:02d} 今日 · あなたが記録"
    else:
        time_str = f"{now.hour:02d}:{now.minute:02d} Hôm nay · Ghi nhận bởi bạn"
    await data_store.add_observation(req.candidate_id, req.content, time_str, db=db, lang=lang)
    return {
        "status": "success",
        "time": time_str,
        "content": req.content,
        "message": "Đã lưu ghi chú quan sát thành công."
    }


@clara_router.get("/observations/{candidate_id}")
async def list_observations(candidate_id: str, db: AsyncSession = Depends(get_db)):
    """Lấy danh sách các ghi chú của User về một đối tượng"""
    return {
        "status": "success",
        "candidate_id": candidate_id,
        "observations": await data_store.get_observations(candidate_id, db=db)
    }
