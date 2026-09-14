from datetime import datetime, timezone
from typing import Optional, List, Any, Dict
from sqlalchemy import String, Integer, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from ...database.base import Base


class AnalysisORM(Base):
    __tablename__ = "analyses"

    analysis_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    candidate_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("candidates.candidate_id"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("users.user_id"), index=True
    )
    overall_compatibility: Mapped[int] = mapped_column(Integer)
    data_completeness: Mapped[int] = mapped_column(Integer)
    confidence_level: Mapped[str] = mapped_column(String(100))
    confidence_detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # JSON fields (serialized Pydantic lists/objects)
    radar_axes: Mapped[List[Any]] = mapped_column(JSON, default=list)
    direct_comparison: Mapped[List[Any]] = mapped_column(JSON, default=list)
    checklist: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    icebreakers: Mapped[List[str]] = mapped_column(JSON, default=list)
    probing_questions: Mapped[List[str]] = mapped_column(JSON, default=list)
    summary_narrative: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
