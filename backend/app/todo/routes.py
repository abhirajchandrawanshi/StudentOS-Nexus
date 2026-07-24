from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.todo.repository import TodoRepository
from app.todo.schemas import (
    TodoCreate,
    TodoUpdate,
    TodoResponse,
)
from app.todo.service import TodoService

router = APIRouter()


def get_service(db: AsyncSession = Depends(get_db)):
    repository = TodoRepository(db)
    return TodoService(repository)


@router.get("/", response_model=list[TodoResponse])
async def get_tasks(
    service: TodoService = Depends(get_service),
):
    return await service.get_all_tasks()


@router.get("/{task_id}", response_model=TodoResponse)
async def get_task(
    task_id: str,
    service: TodoService = Depends(get_service),
):
    task = await service.get_task(task_id)

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return task


@router.post("/", response_model=TodoResponse)
async def create_task(
    todo: TodoCreate,
    service: TodoService = Depends(get_service),
):
    return await service.create_task(todo)


@router.put("/{task_id}", response_model=TodoResponse)
async def update_task(
    task_id: str,
    todo: TodoUpdate,
    service: TodoService = Depends(get_service),
):
    task = await service.update_task(task_id, todo)

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return task


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    service: TodoService = Depends(get_service),
):
    success = await service.delete_task(task_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return {
        "message": "Task deleted successfully"
    }