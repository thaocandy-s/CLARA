"""
Async DataStore — thay thế In-memory Dict bằng SQLite qua SQLAlchemy.
Interface được giữ nguyên để không phá vỡ routers và cli_chat.py.
"""
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from ..models.candidate import CandidateProfile, CandidateQuestionnaire
from ..models.user import UserProfile, DimensionWeights
from ..models.analysis import AnalyzeResponseData
from ..models.orm.candidate_orm import CandidateORM
from ..models.orm.user_orm import UserORM
from ..models.orm.analysis_orm import AnalysisORM
from ..models.orm.observation_orm import ObservationORM


# ─── Helpers: ORM ↔ Pydantic ───────────────────────────────────────────────

def _orm_to_candidate(row: CandidateORM) -> CandidateProfile:
    q = row.questionnaire or {}
    return CandidateProfile(
        candidate_id=row.candidate_id,
        name=row.name,
        age=row.age,
        job=row.job,
        location=row.location,
        distance_km=row.distance_km,
        avatar_gradient=row.avatar_gradient,
        bio=row.bio,
        tags=row.tags or [],
        quick_ai_summary=row.quick_ai_summary,
        questionnaire=CandidateQuestionnaire(**q),
        extra_attributes=row.extra_attributes or {},
    )


def _orm_to_user(row: UserORM) -> UserProfile:
    dw = row.dimension_weights or {}
    return UserProfile(
        user_id=row.user_id,
        name=row.name,
        age=row.age,
        relationship_goal=row.relationship_goal,
        deal_breakers=row.deal_breakers or [],
        lifestyle=row.lifestyle,
        dimension_weights=DimensionWeights(**dw),
        private_incognito=row.private_incognito,
        additional_notes=row.additional_notes,
    )


def _analysis_to_orm(analysis: AnalyzeResponseData, user_id: str) -> AnalysisORM:
    return AnalysisORM(
        analysis_id=analysis.analysis_id,
        candidate_id=analysis.candidate_id,
        user_id=user_id,
        overall_compatibility=analysis.overall_compatibility,
        data_completeness=analysis.data_completeness,
        confidence_level=analysis.confidence_level,
        confidence_detail=analysis.confidence_detail,
        radar_axes=[a.model_dump() for a in analysis.radar_axes],
        direct_comparison=[d.model_dump() for d in analysis.direct_comparison],
        checklist=analysis.checklist.model_dump(),
        icebreakers=analysis.icebreakers,
        probing_questions=analysis.probing_questions,
        summary_narrative=analysis.summary_narrative,
    )


def _orm_to_analysis(row: AnalysisORM) -> AnalyzeResponseData:
    from ..models.analysis import (
        RadarAxis, DirectComparisonItem, ChecklistGroup, ChecklistItem
    )

    def _items(lst):
        return [ChecklistItem(**i) for i in (lst or [])]

    checklist_raw = row.checklist or {}
    checklist = ChecklistGroup(
        matched=_items(checklist_raw.get("matched", [])),
        needs_check=_items(checklist_raw.get("needs_check", [])),
        potential_friction=_items(checklist_raw.get("potential_friction", [])),
    )
    return AnalyzeResponseData(
        analysis_id=row.analysis_id,
        candidate_id=row.candidate_id,
        overall_compatibility=row.overall_compatibility,
        data_completeness=row.data_completeness,
        confidence_level=row.confidence_level,
        confidence_detail=row.confidence_detail,
        radar_axes=[RadarAxis(**a) for a in (row.radar_axes or [])],
        direct_comparison=[DirectComparisonItem(**d) for d in (row.direct_comparison or [])],
        checklist=checklist,
        icebreakers=row.icebreakers or [],
        probing_questions=row.probing_questions or [],
        summary_narrative=row.summary_narrative,
    )


# ─── DataStore (async) ─────────────────────────────────────────────────────

class DataStore:
    """
    Async DataStore — mọi method đều là coroutine, nhận `db: AsyncSession`.
    Singleton `data_store` vẫn được export để tương thích import cũ,
    nhưng không còn lưu state — tất cả state nằm trong SQLite.
    """

    # Lang preference cho session (stateless-ish, dùng trong CLI)
    _active_lang: str = "vi"

    # ─── Candidates ────────────────────────────────────────────────────────

    async def get_candidate(
        self, candidate_id: str, db: AsyncSession
    ) -> Optional[CandidateProfile]:
        result = await db.get(CandidateORM, candidate_id)
        return _orm_to_candidate(result) if result else None

    async def list_candidates(
        self, db: AsyncSession, lang: str = "vi"
    ) -> List[CandidateProfile]:
        """Trả về toàn bộ candidates (VI + JA) — giống behavior cũ."""
        result = await db.execute(select(CandidateORM))
        rows = result.scalars().all()
        return [_orm_to_candidate(r) for r in rows]

    async def add_candidate(
        self, candidate: CandidateProfile, lang: str, db: AsyncSession
    ) -> CandidateProfile:
        orm = CandidateORM(
            candidate_id=candidate.candidate_id,
            lang=lang,
            name=candidate.name,
            age=candidate.age,
            job=candidate.job,
            location=candidate.location,
            distance_km=candidate.distance_km,
            avatar_gradient=candidate.avatar_gradient,
            bio=candidate.bio,
            tags=candidate.tags,
            quick_ai_summary=candidate.quick_ai_summary,
            questionnaire=candidate.questionnaire.model_dump(),
            extra_attributes=candidate.extra_attributes,
        )
        db.add(orm)
        await db.commit()
        return candidate

    # ─── Users ─────────────────────────────────────────────────────────────

    async def get_user(self, db: AsyncSession, lang: str = "vi") -> UserProfile:
        user_id = "usr_002" if lang == "ja" else "usr_001"
        result = await db.get(UserORM, user_id)
        if result is None:
            raise RuntimeError(f"User '{user_id}' không tìm thấy trong DB. Hãy chạy seed.")
        return _orm_to_user(result)

    async def update_user(
        self, user: UserProfile, db: AsyncSession
    ) -> UserProfile:
        result = await db.get(UserORM, user.user_id)
        if result is None:
            raise RuntimeError(f"User '{user.user_id}' không tìm thấy.")
        result.name = user.name
        result.age = user.age
        result.relationship_goal = user.relationship_goal
        result.deal_breakers = user.deal_breakers
        result.lifestyle = user.lifestyle
        result.dimension_weights = user.dimension_weights.model_dump()
        result.private_incognito = user.private_incognito
        result.additional_notes = user.additional_notes
        await db.commit()
        await db.refresh(result)
        return _orm_to_user(result)

    # ─── Analyses ──────────────────────────────────────────────────────────

    async def save_analysis(
        self,
        analysis: AnalyzeResponseData,
        db: AsyncSession,
        lang: str = "vi",
    ) -> None:
        user = await self.get_user(db, lang)
        if user.private_incognito:
            return  # Chế độ ẩn danh: không lưu

        orm = _analysis_to_orm(analysis, user.user_id)
        # Upsert: xoá cũ nếu có, insert mới
        await db.execute(
            delete(AnalysisORM).where(AnalysisORM.analysis_id == analysis.analysis_id)
        )
        db.add(orm)
        await db.commit()

    async def get_analysis(
        self, key: str, db: AsyncSession
    ) -> Optional[AnalyzeResponseData]:
        # Thử theo analysis_id trước
        row = await db.get(AnalysisORM, key)
        if row is None:
            # Thử theo candidate_id (lấy analysis mới nhất)
            result = await db.execute(
                select(AnalysisORM)
                .where(AnalysisORM.candidate_id == key)
                .order_by(AnalysisORM.created_at.desc())
                .limit(1)
            )
            row = result.scalar_one_or_none()
        return _orm_to_analysis(row) if row else None

    async def list_analyses(
        self, db: AsyncSession, user_id: Optional[str] = None
    ) -> List[AnalyzeResponseData]:
        stmt = select(AnalysisORM).order_by(AnalysisORM.created_at.desc())
        if user_id:
            stmt = stmt.where(AnalysisORM.user_id == user_id)
        result = await db.execute(stmt)
        return [_orm_to_analysis(r) for r in result.scalars().all()]

    # ─── Observations ──────────────────────────────────────────────────────

    async def add_observation(
        self,
        candidate_id: str,
        content: str,
        time_str: str,
        db: AsyncSession,
        lang: str = "vi",
    ) -> None:
        user = await self.get_user(db, lang)
        obs = ObservationORM(
            candidate_id=candidate_id,
            user_id=user.user_id,
            content=content,
            time_str=time_str,
        )
        db.add(obs)
        await db.commit()

    async def get_observations(
        self, candidate_id: str, db: AsyncSession
    ) -> List[Dict]:
        result = await db.execute(
            select(ObservationORM)
            .where(ObservationORM.candidate_id == candidate_id)
            .order_by(ObservationORM.created_at.desc())
        )
        rows = result.scalars().all()
        return [{"time": r.time_str, "content": r.content} for r in rows]

    # ─── Lang helpers (tương thích CLI) ────────────────────────────────────

    def set_active_lang(self, lang: str) -> None:
        self._active_lang = lang

    def get_active_lang(self) -> str:
        return self._active_lang


# Singleton — stateless, chỉ là namespace cho các methods
data_store = DataStore()
