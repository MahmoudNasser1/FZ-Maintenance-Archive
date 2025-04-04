# توثيق نظام أرشيف الصيانة لـ Fix Zone

## نظرة عامة

نظام أرشيف الصيانة لـ Fix Zone هو نظام متكامل لإدارة حالات الصيانة للفنيين. يتيح النظام إدخال بيانات الأجهزة وتتبع حالات الصيانة وإدارة المرفقات والملاحظات، مع إمكانية العمل بدون اتصال بالإنترنت.

تاريخ التوثيق: 04/04/2025

## التقنيات المستخدمة

- **Backend**: Python (FastAPI) + PostgreSQL
- **Frontend**: React.js + TailwindCSS
- **Authentication**: JWT Authentication
- **Offline Support**: IndexedDB
- **Notifications**: WebSockets

## هيكل المشروع

### هيكل الباكيند

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── api.py
│   │       └── endpoints/
│   │           ├── auth/
│   │           ├── cases/
│   │           ├── attachments/
│   │           ├── notes/
│   │           ├── activities/
│   │           ├── work_logs/
│   │           ├── notifications/
│   │           └── users/
│   ├── core/
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── case.py
│   │   ├── attachment.py
│   │   ├── note.py
│   │   ├── activity.py
│   │   ├── work_log.py
│   │   └── notification.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── case.py
│   │   ├── attachment.py
│   │   ├── note.py
│   │   ├── activity.py
│   │   ├── work_log.py
│   │   ├── notification.py
│   │   └── auth.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── activity_service.py
│   ├── utils/
│   └── main.py
├── migrations/
│   ├── env.py
│   └── versions/
├── tests/
├── alembic.ini
├── requirements.txt
└── .env
```

### هيكل الفرونت اند

```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── auth/
│   │   ├── cases/
│   │   ├── attachments/
│   │   ├── layout/
│   │   ├── notes/
│   │   ├── notifications/
│   │   └── ui/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   │   ├── auth/
│   │   ├── cases/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── reports/
│   │   └── settings/
│   ├── services/
│   └── utils/
```

## نماذج قاعدة البيانات

### 1. نموذج المستخدم (User)

- `id`: UUID - المعرف الفريد للمستخدم
- `username`: String - اسم المستخدم
- `email`: String - البريد الإلكتروني للمستخدم
- `full_name`: String - الاسم الكامل للمستخدم
- `hashed_password`: String - كلمة المرور المشفرة
- `role`: Enum - دور المستخدم (مدير، فني، مشرف)
- `points`: Integer - نقاط المستخدم
- `is_active`: Boolean - حالة المستخدم (نشط أو غير نشط)
- `profile_image`: String - مسار صورة الملف الشخصي
- `created_at`: DateTime - تاريخ إنشاء الحساب
- `updated_at`: DateTime - تاريخ آخر تحديث للحساب

### 2. نموذج حالة الصيانة (Case)

- `id`: UUID - المعرف الفريد لحالة الصيانة
- `case_number`: String - رقم الحالة
- `device_model`: String - موديل الجهاز
- `device_type`: String - نوع الجهاز
- `serial_number`: String - الرقم التسلسلي للجهاز
- `client_name`: String - اسم العميل
- `client_phone`: String - رقم هاتف العميل
- `client_email`: String - البريد الإلكتروني للعميل
- `issue_description`: Text - وصف المشكلة
- `diagnosis`: Text - التشخيص
- `solution`: Text - الحل
- `status`: Enum - حالة الصيانة (جديدة، قيد الإصلاح، تم الإصلاح، بانتظار القطعة، إلخ)
- `priority`: Enum - أولوية الحالة (منخفضة، متوسطة، عالية، عاجلة)
- `cost`: Float - تكلفة الإصلاح
- `customer_satisfaction`: Integer - تقييم رضا العميل (1-5)
- `technician_id`: UUID - معرف الفني المسؤول
- `created_at`: DateTime - تاريخ الإنشاء
- `updated_at`: DateTime - تاريخ آخر تحديث

### 3. نموذج المرفقات (Attachment)

- `id`: UUID - المعرف الفريد للمرفق
- `case_id`: UUID - معرف حالة الصيانة
- `file_url`: String - مسار الملف
- `file_name`: String - اسم الملف
- `file_type`: Enum - نوع الملف (صورة، مخطط، فيديو، إلخ)
- `file_size`: String - حجم الملف
- `uploaded_by`: UUID - معرف المستخدم الذي قام برفع الملف
- `created_at`: DateTime - تاريخ الرفع
- `updated_at`: DateTime - تاريخ آخر تحديث

### 4. نموذج الملاحظات (Note)

- `id`: UUID - المعرف الفريد للملاحظة
- `case_id`: UUID - معرف حالة الصيانة
- `note_text`: Text - نص الملاحظة
- `voice_note_url`: String - مسار الملاحظة الصوتية
- `created_by`: UUID - معرف المستخدم الذي أنشأ الملاحظة
- `created_at`: DateTime - تاريخ الإنشاء
- `updated_at`: DateTime - تاريخ آخر تحديث

### 5. نموذج الأنشطة (Activity)

- `id`: UUID - المعرف الفريد للنشاط
- `case_id`: UUID - معرف حالة الصيانة
- `action`: Text - وصف النشاط
- `performed_by`: UUID - معرف المستخدم الذي قام بالنشاط
- `created_at`: DateTime - تاريخ النشاط
- `updated_at`: DateTime - تاريخ آخر تحديث

### 6. نموذج سجلات العمل (WorkLog)

- `id`: UUID - المعرف الفريد لسجل العمل
- `technician_id`: UUID - معرف الفني
- `case_id`: UUID - معرف حالة الصيانة
- `start_time`: DateTime - وقت بداية العمل
- `end_time`: DateTime - وقت نهاية العمل
- `total_duration`: Integer - إجمالي المدة بالثواني
- `created_at`: DateTime - تاريخ الإنشاء
- `updated_at`: DateTime - تاريخ آخر تحديث

### 7. نموذج الإشعارات (Notification)

- `id`: UUID - المعرف الفريد للإشعار
- `recipient_id`: UUID - معرف المستلم
- `message`: Text - نص الإشعار
- `is_read`: Boolean - حالة قراءة الإشعار
- `related_case_id`: UUID - معرف حالة الصيانة المرتبطة
- `created_at`: DateTime - تاريخ الإنشاء
- `updated_at`: DateTime - تاريخ آخر تحديث

## نقاط النهاية API

تم تطوير نقاط النهاية التالية:

### المصادقة (Authentication)

- `POST /api/v1/auth/login` - تسجيل الدخول
- `POST /api/v1/auth/refresh-token` - تجديد توكن الوصول

### المستخدمين (Users)

- `GET /api/v1/users/` - استرجاع قائمة المستخدمين
- `POST /api/v1/users/` - إنشاء مستخدم جديد
- `GET /api/v1/users/me` - استرجاع بيانات المستخدم الحالي
- `PUT /api/v1/users/me` - تحديث بيانات المستخدم الحالي
- `GET /api/v1/users/{user_id}` - استرجاع بيانات مستخدم محدد
- `PUT /api/v1/users/{user_id}` - تحديث بيانات مستخدم محدد

### حالات الصيانة (Cases)

- `GET /api/v1/cases/` - استرجاع قائمة حالات الصيانة
- `POST /api/v1/cases/` - إنشاء حالة صيانة جديدة
- `GET /api/v1/cases/{case_id}` - استرجاع بيانات حالة صيانة محددة
- `PUT /api/v1/cases/{case_id}` - تحديث بيانات حالة صيانة محددة
- `DELETE /api/v1/cases/{case_id}` - حذف حالة صيانة محددة
- `GET /api/v1/cases/by-serial/{serial_number}` - استرجاع حالة صيانة عن طريق الرقم التسلسلي
- `GET /api/v1/cases/by-client/{client_name}` - استرجاع حالات الصيانة عن طريق اسم العميل

### العمليات الدفعية للحالات (Batch Operations)

- `PUT /api/v1/cases/batch/status` - تحديث حالة مجموعة من الحالات دفعة واحدة
- `PUT /api/v1/cases/batch/assign` - تعيين فني لمجموعة من الحالات دفعة واحدة
- `DELETE /api/v1/cases/batch` - حذف مجموعة من الحالات دفعة واحدة

### إحصائيات الحالات (Cases Statistics)

- `GET /api/v1/cases/stats/status-distribution` - توزيع الحالات حسب الحالة
- `GET /api/v1/cases/stats/time-series` - بيانات سلسلة زمنية للحالات
- `GET /api/v1/cases/stats/technician-performance` - إحصائيات أداء الفنيين
- `GET /api/v1/cases/stats/device-distribution` - توزيع أنواع الأجهزة
- `GET /api/v1/cases/stats/resolution-time` - إحصائيات وقت حل الحالات (متوسط، أدنى، أقصى)
- `GET /api/v1/cases/stats/revenue` - إحصائيات الإيرادات (إجمالي، متوسط، توزيع حسب الحالة)
- `GET /api/v1/cases/stats/customer-satisfaction` - تحليل رضا العملاء (متوسط، توزيع)
- `GET /api/v1/cases/stats/cases-by-priority` - توزيع الحالات حسب الأولوية

## خدمات النظام

تم تطوير الخدمات التالية:

### خدمة النشاط (Activity Service)

- `create_activity` - إنشاء سجل نشاط لحالة صيانة
- `get_case_activities` - استرجاع أنشطة حالة صيانة محددة

### خدمة الإشعارات المعززة (Enhanced Notification Service)

- `send_notification` - إرسال إشعار لمستخدم
- `send_case_notification` - إرسال إشعار متعلق بحالة
- `send_status_change_notification` - إرسال إشعار عند تغيير حالة
- `send_technician_assigned_notification` - إرسال إشعار عند تعيين فني
- `send_batch_notifications` - إرسال إشعارات متعددة دفعة واحدة

## نظام المصادقة

تم تطوير نظام مصادقة باستخدام JWT مع الميزات التالية:

- تشفير كلمات المرور
- إنشاء وتجديد توكنات JWT
- التحقق من الصلاحيات
- تحديد أدوار المستخدمين (مدير، فني، مشرف)

## نظام الهجرات

تم إعداد نظام هجرات قاعدة البيانات باستخدام Alembic لتتبع تغييرات قاعدة البيانات وتطبيقها.

## الخطوات التالية

1. ✅ استكمال تطوير نقاط النهاية API الرئيسية:
   - ✅ حالات الصيانة
   - ✅ النماذج والمخططات
   - ✅ العمليات الدفعية
   - ✅ الإحصائيات المتقدمة
   - ✅ نظام الإشعارات

2. تطوير واجهة المستخدم:
   - إعداد مكونات لعرض الإحصائيات والرسوم البيانية
   - دمج نظام الإشعارات في واجهة المستخدم
   - تحديث نماذج إنشاء وتحرير الحالات لتشمل الحقول الجديدة

3. تحديث قاعدة البيانات:
   - إنشاء وتنفيذ مخطط ترحيل (migration) لتعكس التغييرات في نموذج البيانات

4. اختبار شامل للنظام:
   - اختبار نقاط نهاية الإحصائيات الجديدة
   - اختبار نظام الإشعارات المحسن
   - اختبار العمليات الدفعية

5. ميزات مستقبلية:
   - تصدير البيانات والتقارير (PDF، Excel)
   - لوحة تحكم مخصصة للمديرين
   - تحسين أمان API
   - المزيد من تحليلات البيانات والتنبؤات
