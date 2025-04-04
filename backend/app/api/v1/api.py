from fastapi import APIRouter

from app.api.v1.endpoints import cases, attachments, notes, activities, work_logs, notifications, users, auth

api_router = APIRouter()

# Add all routers from endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])
api_router.include_router(attachments.router, prefix="/attachments", tags=["attachments"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(work_logs.router, prefix="/work-logs", tags=["work_logs"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
