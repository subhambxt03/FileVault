import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class NotificationType(str, enum.Enum):
    FILE_COMPLETED = "FILE_COMPLETED"
    FILE_FAILED = "FILE_FAILED"
    FILE_RETRY = "FILE_RETRY"
    WEBHOOK_SUCCESS = "WEBHOOK_SUCCESS"
    WEBHOOK_FAILED = "WEBHOOK_FAILED"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    job_id: Mapped[int | None] = mapped_column(ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    type: Mapped[str] = mapped_column(String(32))
    message: Mapped[str] = mapped_column(String(512))
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="notifications")