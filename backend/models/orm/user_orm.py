from datetime import datetime, timezone
from typing import Optional, List, Any, Dict
from sqlalchemy import String, Integer, Boolean, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from ...database.base import Base


class UserORM(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    age: Mapped[int] = mapped_column(Integer)
    lang: Mapped[str] = mapped_column(String(5), default="vi", index=True)
    relationship_goal: Mapped[str] = mapped_column(Text)
    deal_breakers: Mapped[List[str]] = mapped_column(JSON, default=list)
    lifestyle: Mapped[str] = mapped_column(Text)
    dimension_weights: Mapped[Dict[str, float]] = mapped_column(JSON, default=dict)
    private_incognito: Mapped[bool] = mapped_column(Boolean, default=False)
    additional_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
