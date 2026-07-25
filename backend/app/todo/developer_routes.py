from fastapi import APIRouter

router = APIRouter(
    prefix="/todo/dev",
    tags=["Todo Dev"]
)

@router.post("/generate-demo-data")
async def generate_demo_data():
    return {
        "success": True,
        "message": "Demo data endpoint is working!"
    }