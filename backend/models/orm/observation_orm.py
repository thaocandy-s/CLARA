from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from ...database.base import Base


class ObservationORM(Base):
    __tablename__ = "observations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    candidate_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("candidates.candidate_id"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("users.user_id"), index=True
    )
    content: Mapped[str] = mapped_column(Text)
    time_str: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
