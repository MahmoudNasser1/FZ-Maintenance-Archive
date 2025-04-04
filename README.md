# نظام أرشيف الصيانة لـ Fix Zone

نظام متكامل لإدارة حالات الصيانة للفنيين داخل Fix Zone، يتيح تتبع حالات الصيانة وإدارة المرفقات والملاحظات والتقارير وتحليل البيانات.

## المميزات الرئيسية

- **لوحة تحكم متكاملة**: عرض إحصائيات الحالات والأنشطة الحديثة
- **إدارة الحالات**: إمكانية إضافة وتعديل وتتبع حالات الصيانة
- **إدارة المرفقات**: رفع وتحميل الصور والمستندات المرتبطة بالحالات
- **الملاحظات والأنشطة**: تسجيل الملاحظات وسجل الأنشطة لكل حالة
- **التقارير والتحليلات**: رسومات بيانية وتحليلات لأداء النظام
- **واجهة سهلة الاستخدام**: تصميم استجابي باللغة العربية

## متطلبات النظام

- Python 3.8 أو أعلى
- PostgreSQL 13 أو أعلى
- Node.js 16 أو أعلى
- npm 8 أو أعلى

## إعداد بيئة التطوير

### إعداد الباكيند (Backend)

1. إنشاء بيئة افتراضية:
   ```bash
   cd backend
   python -m venv venv
   ```

2. تنشيط البيئة الافتراضية:
   - Windows:
     ```
     .\venv\Scripts\activate
     ```
   - Linux/MacOS:
     ```
     source venv/bin/activate
     ```

3. ملاحظة: قد تحتاج إلى تعديل سياسة تنفيذ PowerShell في Windows لتمكين تنفيذ البرامج النصية:
   ```
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. تثبيت التبعيات:
   ```
   pip install -r requirements.txt
   ```

5. تهيئة قاعدة البيانات:
   - تأكد من تثبيت PostgreSQL
   - أنشئ قاعدة بيانات جديدة:
     ```
     createdb fz_maintenance_archive
     ```
   - قم بتعديل ملف `.env` وضبط متغيرات البيئة المناسبة
   - تنفيذ الهجرات:
     ```
     alembic upgrade head
     ```

### إعداد الفرونت اند (Frontend)

1. تثبيت التبعيات:
   ```bash
   cd frontend
   npm install
   ```

2. تشغيل خادم التطوير:
   ```bash
   npm start
   ```

## كيفية التشغيل

### تشغيل الباكيند

```bash
cd backend
uvicorn app.main:app --reload
```

### تشغيل الفرونت اند

```bash
cd frontend
npm start
```

## الصفحات الرئيسية

- **لوحة التحكم**: `/` - عرض إحصائيات الحالات والأنشطة الحديثة
- **قائمة الحالات**: `/cases` - قائمة قابلة للفرز والتصفية لحالات الصيانة
- **تفاصيل الحالة**: `/cases/:id` - تفاصيل كاملة لحالة صيانة محددة
- **التقارير**: `/reports` - تقارير وتحليلات حول أداء النظام

## توثيق المشروع

توثيق المشروع متاح في مجلد `docs/`. يرجى مراجعة الوثائق التالية:

- [دليل إعداد قاعدة البيانات](docs/database_setup.md)
- [مخططات تدفق المستخدم](docs/wireframes/user_flows.md)
- [دليل المكونات الرئيسية](docs/components.md)
- [دليل المستخدم](docs/user_manual.md)
- [هندسة النظام](docs/system_architecture.md)

## الإسهام في المشروع

1. قم بعمل fork للمشروع
2. أنشئ فرع لميزتك: `git checkout -b feature/amazing-feature`
3. قم بتجهيز التغييرات: `git commit -m 'Add some amazing feature'`
4. ادفع إلى الفرع: `git push origin feature/amazing-feature`
5. افتح طلب سحب (Pull Request)
