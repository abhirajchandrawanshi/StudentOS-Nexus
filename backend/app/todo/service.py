from app.todo.repository import TodoRepository
from app.todo.schemas import TodoCreate, TodoUpdate


class TodoService:

    def __init__(self, repository: TodoRepository):
        self.repository = repository

    async def get_all_tasks(self):
        return await self.repository.get_all_tasks()

    async def get_task(self, task_id: str):
        return await self.repository.get_task(task_id)

    async def create_task(self, task: TodoCreate):
        return await self.repository.create_task(task)

    async def update_task(
        self,
        task_id: str,
        task: TodoUpdate,
    ):
        return await self.repository.update_task(task_id, task)

    async def delete_task(self, task_id: str):
        return await self.repository.delete_task(task_id)