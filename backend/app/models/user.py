from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    username: Mapped[str | None] = mapped_column(String(60), unique=True, nullable=True)
    bio: Mapped[str | None] = mapped_column(String(160), nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    theme: Mapped[str] = mapped_column(String(16), nullable=False, server_default="dark")

    avatar_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    integrations: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    jobs = relationship("Job", back_populates="user", cascade="all, delete-orphan")
    webhooks = relationship("Webhook", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")