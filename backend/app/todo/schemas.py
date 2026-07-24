from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "General"
    priority: Optional[str] = "Medium"
    due_date: Optional[date] = None
    due_time: Optional[str] = None
    estimated_minutes: Optional[int] = 0
    reminder_minutes_before: Optional[int] = 60
    ai_generated: Optional[bool] = False


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    due_time: Optional[str] = None
    completed: Optional[bool] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    reminder_minutes_before: Optional[int] = None


class TodoResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    priority: str
    completed: bool
    status: str
    progress: int
    due_date: Optional[date]
    due_time: Optional[str]
    estimated_minutes: int
    actual_minutes: int
    reminder_minutes_before: int
    ai_generated: bool
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }