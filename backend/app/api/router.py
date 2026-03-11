from fastapi import APIRouter

from app.api.routes import availability, blocks, dashboard, health, planner, preferences, progress, sessions, subjects

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(preferences.router)
api_router.include_router(subjects.router)
api_router.include_router(availability.router)
api_router.include_router(planner.router)
api_router.include_router(blocks.router)
api_router.include_router(sessions.router)
api_router.include_router(dashboard.router)
api_router.include_router(progress.router)