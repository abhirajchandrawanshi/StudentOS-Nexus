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
    is_recurring: Optional[bool] = False
    repeat_type: Optional[str] = "none"
    repeat_interval: Optional[int] = 1
    times_per_day: Optional[int] = 1


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
    is_recurring: Optional[bool] = None
    repeat_type: Optional[str] = None
    repeat_interval: Optional[int] = None
    times_per_day: Optional[int] = None


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
    is_recurring: bool
    repeat_type: str
    repeat_interval: int
    times_per_day: int
    is_deleted: bool
    last_generated_date: Optional[date]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }