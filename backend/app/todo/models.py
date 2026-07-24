import uuid
from datetime import datetime, date

from sqlalchemy import (
    String,
    Boolean,
    Date,
    DateTime,
    Text,
)

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.database import Base


class Todo(Base):
    __tablename__ = "todos"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    category: Mapped[str] = mapped_column(
        String(100),
        default="General",
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        default="Medium",
    )

    completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="Pending",
    )

    due_time: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
    )

    progress: Mapped[int] = mapped_column(
        default=0,
    )

    estimated_minutes: Mapped[int] = mapped_column(
        default=0,
    )

    actual_minutes: Mapped[int] = mapped_column(
        default=0,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    ai_generated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    reminder_minutes_before: Mapped[int] = mapped_column(
        default=60,
    )