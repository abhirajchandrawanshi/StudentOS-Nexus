from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.todo.models import Todo
from app.todo.schemas import TodoCreate, TodoUpdate


class TodoRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_tasks(self):
        result = await self.db.execute(
            select(Todo).order_by(Todo.created_at.desc())
        )
        return result.scalars().all()

    async def get_task(self, task_id: str):
        result = await self.db.execute(
            select(Todo).where(Todo.id == task_id)
        )
        return result.scalar_one_or_none()

    async def create_task(self, task: TodoCreate):

        new_task = Todo(
            title=task.title,
            description=task.description,
            category=task.category,
            priority=task.priority,
            due_date=task.due_date,
            due_time=task.due_time,
            estimated_minutes=task.estimated_minutes,
            reminder_minutes_before=task.reminder_minutes_before,
            ai_generated=task.ai_generated,
        )

        self.db.add(new_task)

        await self.db.commit()

        await self.db.refresh(new_task)

        return new_task

    async def update_task(
        self,
        task_id: str,
        task: TodoUpdate,
    ):

        todo = await self.get_task(task_id)

        if not todo:
            return None

        update_data = task.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(todo, key, value)

        if todo.completed:
            todo.completed_at = datetime.utcnow()
            todo.progress = 100

        await self.db.commit()

        await self.db.refresh(todo)

        return todo

    async def delete_task(self, task_id: str):

        todo = await self.get_task(task_id)

        if not todo:
            return False

        await self.db.delete(todo)

        await self.db.commit()

        return True