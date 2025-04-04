import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.docs import get_fz_openapi_schema, customize_swagger_ui

app = FastAPI(
    title=settings.APP_NAME,
    description="نظام أرشيف حالات الصيانة للفنيين داخل Fix Zone",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Set up CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# تخصيص توثيق OpenAPI
app.openapi = lambda: get_fz_openapi_schema(app)
customize_swagger_ui(app)

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event():
    """
    تنفيذ إجراءات بدء التشغيل مثل تهيئة الاتصال بقاعدة البيانات
    وإعداد مدير اتصالات WebSockets
    """
    # يمكن إضافة أي تهيئة ضرورية لنظام الإشعارات هنا
    print("نظام الإشعارات الفوري جاهز للاستخدام")


@app.on_event("shutdown")
async def shutdown_event():
    """
    تنفيذ إجراءات إيقاف التشغيل مثل إغلاق الاتصالات
    وتنظيف الموارد
    """
    # يمكن إضافة أي تنظيف ضروري لنظام الإشعارات هنا
    print("تم إيقاف نظام الإشعارات الفوري")


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
