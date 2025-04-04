from typing import Dict, Any, List
from fastapi.openapi.models import (
    Reference, Response, Schema, SecurityScheme, Tag
)
from fastapi.openapi.utils import get_openapi
from pydantic import Field
from fastapi import FastAPI

from app.core.config import settings

def get_fz_openapi_schema(app: FastAPI):
    """
    تخصيص مخطط OpenAPI لتوثيق الـ API الخاص بنظام أرشيف حالات الصيانة
    
    يتضمن:
    - إضافة وصف مفصل
    - إضافة وسوم (tags) لتنظيم نقاط النهاية
    - تحسين وصف الاستجابات الشائعة
    """
    
    if app.openapi_schema:
        # إذا كان المخطط موجود بالفعل، إرجاعه
        return app.openapi_schema
    
    # استخراج المخطط الافتراضي من FastAPI
    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version="1.0.0",
        description="""
        # نظام أرشيف حالات الصيانة Fix Zone
        
        ## نظرة عامة
        
        نظام أرشيف حالات الصيانة هو منصة متكاملة لإدارة حالات الصيانة في مراكز إصلاح الأجهزة الإلكترونية.
        يتيح النظام:
        
        * إدارة حالات الصيانة بكفاءة عالية
        * متابعة حالة العمل ومراقبة التقدم
        * تسجيل الملاحظات والمرفقات
        * إدارة تقارير وإحصائيات الصيانة
        * نظام إشعارات متقدم في الوقت الحقيقي
        
        ## المميزات
        
        * **واجهة API مرنة**: يمكن استخدامها من تطبيقات مختلفة (ويب، موبايل، سطح المكتب)
        * **مصادقة JWT**: نظام أمان متقدم للمستخدمين
        * **نظام إشعارات في الوقت الحقيقي**: باستخدام WebSockets
        * **دعم كامل للغة العربية**: واجهة مستخدم متعددة اللغات
        
        ## كيفية الاستخدام
        
        1. قم بالتسجيل/تسجيل الدخول للحصول على رمز المصادقة JWT
        2. استخدم هذا الرمز في طلبات API للوصول إلى الموارد المطلوبة
        3. جميع البيانات يتم إرجاعها بتنسيق JSON
        
        ## الإشعارات في الوقت الحقيقي
        
        للاتصال بنظام الإشعارات في الوقت الحقيقي:
        
        ```
        ws://example.com/api/v1/notifications/ws/{token}
        ```
        
        حيث `{token}` هو رمز JWT الخاص بك.
        """,
        routes=app.routes,
    )
    
    # تحديد علامات (Tags) الـ API
    # هذه تساعد في تنظيم نقاط النهاية حسب الوظيفة
    openapi_schema["tags"] = [
        {
            "name": "auth",
            "description": "عمليات المصادقة وإدارة المستخدمين"
        },
        {
            "name": "cases",
            "description": "إدارة حالات الصيانة"
        },
        {
            "name": "notes",
            "description": "إدارة الملاحظات المرتبطة بالحالات"
        },
        {
            "name": "attachments",
            "description": "إدارة المرفقات والملفات المتعلقة بالحالات"
        },
        {
            "name": "activities",
            "description": "سجل الأنشطة والإجراءات على الحالات"
        },
        {
            "name": "work_logs",
            "description": "سجلات وقت العمل والجهد المبذول على الحالات"
        },
        {
            "name": "notifications",
            "description": "إدارة الإشعارات وإعدادات التنبيهات"
        },
        {
            "name": "reports",
            "description": "تقارير وإحصائيات حول الحالات والإنتاجية"
        }
    ]
    
    # تعريف الاستجابات الشائعة
    common_responses = {
        "401": {
            "description": "خطأ في المصادقة - المستخدم غير مصرح له",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "detail": {"type": "string", "example": "Could not validate credentials"}
                        }
                    }
                }
            }
        },
        "403": {
            "description": "ممنوع - ليس لديك صلاحيات كافية",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "detail": {"type": "string", "example": "Not enough permissions"}
                        }
                    }
                }
            }
        },
        "404": {
            "description": "غير موجود - العنصر المطلوب غير موجود",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "detail": {"type": "string", "example": "Item not found"}
                        }
                    }
                }
            }
        },
        "422": {
            "description": "خطأ في التحقق من صحة البيانات",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "detail": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "loc": {"type": "array", "example": ["body", "attribute"]},
                                        "msg": {"type": "string", "example": "field required"},
                                        "type": {"type": "string", "example": "value_error.missing"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    # أضف الاستجابات الشائعة إلى جميع المسارات
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            if method.lower() != "options":  # تجاهل طرق OPTIONS
                # أضف الاستجابات الشائعة لكل نقطة نهاية
                if "responses" not in openapi_schema["paths"][path][method]:
                    openapi_schema["paths"][path][method]["responses"] = {}
                
                for status, response in common_responses.items():
                    if status not in openapi_schema["paths"][path][method]["responses"]:
                        openapi_schema["paths"][path][method]["responses"][status] = response
    
    # تعيين المخطط المحدث
    app.openapi_schema = openapi_schema
    return app.openapi_schema

def customize_swagger_ui(app: FastAPI):
    """
    تخصيص واجهة Swagger UI
    """
    # تعديل إعدادات واجهة Swagger لدعم اللغة العربية بشكل أفضل
    app.swagger_ui_parameters = {
        "displayRequestDuration": True,
        "docExpansion": "none",
        "filter": True,
        "tryItOutEnabled": True,
        "persistAuthorization": True,
        "syntaxHighlight.theme": "agate",
        # إعدادات إضافية لدعم RTL
        "customCss": """
            .swagger-ui .renderedMarkdown p, .swagger-ui .renderedMarkdown li {
                text-align: right !important;
                direction: rtl !important;
            }
            .swagger-ui .opblock-summary-description, .swagger-ui .opblock-description-wrapper p {
                text-align: right !important;
                direction: rtl !important;
            }
            .swagger-ui h1, .swagger-ui h2, .swagger-ui h3, .swagger-ui h4, .swagger-ui h5 {
                text-align: right !important;
                direction: rtl !important;
            }
        """
    }
