from datetime import datetime, timezone
from typing import Optional, List, Any, Dict
from sqlalchemy import String, Integer, Float, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from ...database.base import Base


class CandidateORM(Base):
    __tablename__ = "candidates"

    candidate_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    lang: Mapped[str] = mapped_column(String(5), default="vi", index=True)
    name: Mapped[str] = mapped_column(String(200))
    age: Mapped[int] = mapped_column(Integer)
    job: Mapped[str] = mapped_column(String(200))
    location: Mapped[str] = mapped_column(String(200), default="TP.HCM")
    distance_km: Mapped[float] = mapped_column(Float, default=3.5)
    avatar_gradient: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bio: Mapped[str] = mapped_column(Text)
    # JSON fields
    tags: Mapped[List[Any]] = mapped_column(JSON, default=list)
    quick_ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    questionnaire: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    extra_attributes: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
