# نظام أرشيف حالات الصيانة Fix Zone - Backend

## نظرة عامة

نظام أرشيف حالات الصيانة هو منصة متكاملة لإدارة حالات الصيانة في مراكز إصلاح الأجهزة الإلكترونية. يتيح النظام إدارة الحالات ومتابعتها، وتسجيل الملاحظات والمرفقات، وتوفير إحصائيات ومؤشرات أداء، مع نظام إشعارات متقدم في الوقت الحقيقي.

## البنية التقنية

- **إطار العمل**: FastAPI (Python)
- **قاعدة البيانات**: PostgreSQL
- **معمارية API**: RESTful + WebSockets للإشعارات الفورية
- **المصادقة**: JWT (JSON Web Tokens)
- **التوثيق**: Swagger/OpenAPI

## هيكل المشروع

```
backend/
├── app/                      # المجلد الرئيسي للتطبيق
│   ├── api/                  # وحدات API
│   │   └── v1/
│   │       ├── api.py        # تجميع جميع نقاط النهاية
│   │       └── endpoints/    # نقاط النهاية لكل وحدة
│   │           ├── auth/     # المصادقة
│   │           ├── cases/    # حالات الصيانة
│   │           ├── notes/    # الملاحظات
│   │           ├── attachments/ # المرفقات
│   │           ├── activities/ # الأنشطة
│   │           ├── work_logs/ # سجلات العمل
│   │           └── notifications/ # الإشعارات
│   ├── core/                 # وحدات أساسية
│   │   ├── auth.py          # وظائف المصادقة
│   │   ├── config.py        # الإعدادات
│   │   ├── database.py      # اتصال قاعدة البيانات
│   │   └── docs.py          # تخصيص توثيق API
│   ├── crud/                 # عمليات CRUD
│   │   ├── __init__.py      # تصدير جميع وحدات CRUD
│   │   ├── user.py          # CRUD للمستخدمين
│   │   ├── case.py          # CRUD للحالات
│   │   ├── note.py          # CRUD للملاحظات
│   │   ├── attachment.py    # CRUD للمرفقات
│   │   ├── activity.py      # CRUD للأنشطة
│   │   ├── work_log.py      # CRUD لسجلات العمل
│   │   └── notification.py  # CRUD للإشعارات
│   ├── models/               # نماذج البيانات (SQLAlchemy)
│   │   ├── base.py          # النموذج الأساسي
│   │   ├── user.py          # نموذج المستخدم
│   │   ├── case.py          # نموذج الحالة
│   │   ├── note.py          # نموذج الملاحظة
│   │   ├── attachment.py    # نموذج المرفق
│   │   ├── activity.py      # نموذج النشاط
│   │   ├── work_log.py      # نموذج سجل العمل
│   │   └── notification.py  # نموذج الإشعار
│   ├── schemas/              # مخططات البيانات (Pydantic)
│   │   ├── auth.py          # مخططات المصادقة
│   │   ├── user.py          # مخططات المستخدم
│   │   ├── case.py          # مخططات الحالة
│   │   ├── note.py          # مخططات الملاحظة
│   │   ├── attachment.py    # مخططات المرفق
│   │   ├── activity.py      # مخططات النشاط
│   │   ├── work_log.py      # مخططات سجل العمل
│   │   └── notification.py  # مخططات الإشعار
│   ├── services/             # خدمات إضافية
│   │   ├── email_service.py  # خدمة البريد الإلكتروني
│   │   ├── file_service.py   # خدمة الملفات
│   │   ├── activity_service.py # خدمة الأنشطة
│   │   └── notification_service.py # خدمة الإشعارات
│   ├── websockets/           # دعم WebSockets
│   │   ├── __init__.py       # تهيئة الوحدة
│   │   └── connection_manager.py # إدارة اتصالات WebSockets
│   └── main.py              # نقطة دخول التطبيق
├── tests/                   # اختبارات
│   ├── conftest.py          # إعداد الاختبارات
│   ├── unit/                # اختبارات الوحدة
│   │   └── test_crud_*.py   # اختبارات وحدات CRUD
│   └── integration/         # اختبارات التكامل
│       └── test_*_api.py    # اختبارات API
├── .env                     # متغيرات البيئة
├── alembic/                 # هجرات قاعدة البيانات
├── requirements.txt         # التبعيات
└── README.md                # هذا الملف
```

## الميزات الرئيسية

### 1. إدارة الحالات

- إنشاء حالات صيانة جديدة مع معلومات مفصلة
- تحديث حالة الحالات (مفتوحة، قيد العمل، مكتملة، إلخ)
- تعيين الحالات للفنيين
- تتبع تاريخ وتطور كل حالة
- تصنيف الحالات حسب الأولوية (منخفضة، متوسطة، عالية، عاجلة)
- تسجيل تكلفة الإصلاح ودرجة رضا العملاء

### 2. الملاحظات والمرفقات

- إضافة ملاحظات متعددة لكل حالة
- تحميل مرفقات متعددة (صور، مستندات، إلخ)
- ربط المرفقات بالحالات للتوثيق

### 3. سجل الأنشطة

- تتبع جميع الإجراءات المتخذة على الحالات
- سجل تاريخي لجميع التغييرات والتحديثات
- تحديد المستخدم الذي قام بالتغيير والوقت

### 4. سجلات العمل

- تسجيل وقت العمل على كل حالة
- حساب إجمالي الوقت المستغرق في الصيانة
- تحليل إنتاجية الفنيين

### 5. نظام الإشعارات في الوقت الحقيقي

- إشعارات فورية للتغييرات على الحالات
- إرسال تنبيهات عند تعيين حالات جديدة
- تنبيهات للمهام المتأخرة أو الوشيكة
- واجهة WebSocket لتجربة مستخدم فورية

### 6. المصادقة والأمان

- نظام تسجيل دخول آمن باستخدام JWT
- تحكم بالصلاحيات حسب دور المستخدم (مسؤول، مدير، فني)
- تشفير وحماية البيانات الحساسة

### 7. التوثيق

- واجهة Swagger/OpenAPI تفاعلية لاختبار API
- توثيق شامل لكل نقاط النهاية
- دعم العربية في واجهة التوثيق

### 8. العمليات الدفعية

- تحديث حالة مجموعة من الحالات دفعة واحدة
- تعيين فني لمجموعة من الحالات
- حذف مجموعة من الحالات
- معالجة العمليات المتكررة بكفاءة عالية

### 9. الإحصائيات المتقدمة

- إحصائيات توزيع الحالات (حسب الحالة، نوع الجهاز، الأولوية)
- تحليل بيانات السلاسل الزمنية لمراقبة الاتجاهات
- قياس أداء الفنيين ومقارنته
- إحصائيات وقت الحل (متوسط، أدنى، أقصى، توزيع)
- تحليلات الإيرادات (إجمالي، متوسط، توزيع حسب الحالة ونوع الجهاز)
- تحليل رضا العملاء ومؤشرات الأداء

## بدء الاستخدام

### المتطلبات السابقة

- Python 3.8+
- PostgreSQL
- Virtualenv (موصى به)

### إعداد البيئة المحلية

1. استنساخ المستودع:
   ```bash
   git clone https://github.com/yourusername/fz-maintenance-archive.git
   cd fz-maintenance-archive/backend
   ```

2. إنشاء بيئة افتراضية وتفعيلها:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. تثبيت التبعيات:
   ```bash
   pip install -r requirements.txt
   ```

4. إنشاء ملف `.env` وتكوينه:
   ```
   DATABASE_URL=postgresql://user:password@localhost/fz_maintenance
   SECRET_KEY=your_secret_key
   API_V1_STR=/api/v1
   # المزيد من الإعدادات...
   ```

5. تهيئة قاعدة البيانات:
   ```bash
   alembic upgrade head
   ```

6. تشغيل الخادم المحلي:
   ```bash
   uvicorn app.main:app --reload
   ```

7. الوصول إلى واجهة التوثيق:
   ```
   http://localhost:8000/api/v1/docs
   ```

## واجهات API الرئيسية

### المصادقة

- `POST /api/v1/auth/login` - تسجيل الدخول واستلام رمز JWT
- `POST /api/v1/auth/signup` - تسجيل مستخدم جديد (متاح للمسؤولين فقط)

### الحالات

- `GET /api/v1/cases` - استرجاع الحالات مع تصفية ودعم الصفحات
- `POST /api/v1/cases` - إنشاء حالة جديدة
- `GET /api/v1/cases/{case_id}` - استرجاع حالة محددة
- `PUT /api/v1/cases/{case_id}` - تحديث حالة
- `DELETE /api/v1/cases/{case_id}` - حذف حالة

### العمليات الدفعية

- `PUT /api/v1/cases/batch/status` - تحديث حالة مجموعة من الحالات دفعة واحدة
- `PUT /api/v1/cases/batch/assign` - تعيين فني لمجموعة من الحالات دفعة واحدة
- `DELETE /api/v1/cases/batch` - حذف مجموعة من الحالات دفعة واحدة

### الإحصائيات المتقدمة

- `GET /api/v1/cases/stats/status-distribution` - توزيع الحالات حسب الحالة
- `GET /api/v1/cases/stats/time-series` - بيانات سلسلة زمنية للحالات
- `GET /api/v1/cases/stats/technician-performance` - إحصائيات أداء الفنيين
- `GET /api/v1/cases/stats/device-distribution` - توزيع أنواع الأجهزة
- `GET /api/v1/cases/stats/resolution-time` - إحصائيات وقت حل الحالات (متوسط، أدنى، أقصى)
- `GET /api/v1/cases/stats/revenue` - إحصائيات الإيرادات (إجمالي، متوسط، توزيع حسب الحالة)
- `GET /api/v1/cases/stats/customer-satisfaction` - تحليل رضا العملاء (متوسط، توزيع)
- `GET /api/v1/cases/stats/cases-by-priority` - توزيع الحالات حسب الأولوية

### الملاحظات

- `GET /api/v1/notes` - استرجاع الملاحظات
- `POST /api/v1/notes` - إنشاء ملاحظة جديدة
- `GET /api/v1/notes/{note_id}` - استرجاع ملاحظة محددة
- `PUT /api/v1/notes/{note_id}` - تحديث ملاحظة
- `DELETE /api/v1/notes/{note_id}` - حذف ملاحظة

### المرفقات

- `GET /api/v1/attachments` - استرجاع المرفقات
- `POST /api/v1/attachments` - رفع مرفق جديد
- `GET /api/v1/attachments/{attachment_id}` - استرجاع مرفق محدد
- `DELETE /api/v1/attachments/{attachment_id}` - حذف مرفق

### سجلات العمل

- `GET /api/v1/work_logs` - استرجاع سجلات العمل
- `POST /api/v1/work_logs` - إنشاء سجل عمل جديد
- `GET /api/v1/work_logs/{work_log_id}` - استرجاع سجل عمل محدد
- `PUT /api/v1/work_logs/{work_log_id}` - تحديث سجل عمل
- `DELETE /api/v1/work_logs/{work_log_id}` - حذف سجل عمل

### الإشعارات

- `GET /api/v1/notifications` - استرجاع الإشعارات
- `GET /api/v1/notifications/count` - عدد الإشعارات غير المقروءة
- `POST /api/v1/notifications` - إنشاء إشعار جديد
- `PUT /api/v1/notifications/{notification_id}/read` - تحديد إشعار كمقروء
- `PUT /api/v1/notifications/read-all` - تحديد جميع الإشعارات كمقروءة
- `DELETE /api/v1/notifications/{notification_id}` - حذف إشعار
- `DELETE /api/v1/notifications/read` - حذف جميع الإشعارات المقروءة
- `WebSocket /api/v1/notifications/ws/{token}` - اتصال WebSocket للإشعارات في الوقت الحقيقي

## تشغيل الاختبارات

```bash
# اختبارات الوحدة
pytest tests/unit/

# اختبارات التكامل
pytest tests/integration/

# جميع الاختبارات
pytest
```

## المساهمة

1. قم بعمل Fork للمستودع
2. أنشئ فرعًا جديدًا للميزة: `git checkout -b feature/amazing-feature`
3. ارتكب تغييراتك: `git commit -m 'Add amazing feature'`
4. ادفع إلى الفرع: `git push origin feature/amazing-feature`
5. افتح طلب سحب (Pull Request)

## الترخيص

Copyright 2025 Fix Zone. جميع الحقوق محفوظة.