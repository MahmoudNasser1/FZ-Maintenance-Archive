# دليل إعداد قاعدة بيانات PostgreSQL

## الخطوة 1: تثبيت PostgreSQL

### تثبيت PostgreSQL على نظام Windows

1. قم بتنزيل آخر إصدار من PostgreSQL من الموقع الرسمي: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. قم بتشغيل ملف التثبيت واتبع الخطوات التالية:
   - اختر مجلد التثبيت (الإعداد الافتراضي مناسب)
   - اختر المكونات التي ترغب في تثبيتها (على الأقل PostgreSQL Server وpgAdmin 4)
   - حدد مجلد البيانات (الإعداد الافتراضي مناسب)
   - أدخل كلمة مرور لمستخدم قاعدة البيانات `postgres` (تذكرها جيدًا)
   - حدد منفذ الاتصال (الإعداد الافتراضي 5432 مناسب)
   - اختر المنطقة الزمنية المناسبة
   - انقر على "تثبيت" لبدء عملية التثبيت

3. بعد اكتمال التثبيت، يمكنك التحقق من نجاح العملية من خلال فتح pgAdmin 4.

## الخطوة 2: إنشاء قاعدة البيانات

### إنشاء قاعدة البيانات باستخدام pgAdmin 4

1. قم بتشغيل pgAdmin 4 من قائمة البرامج.
2. أدخل كلمة المرور التي قمت بتعيينها أثناء التثبيت.
3. في شجرة الخوادم، توسيع "Servers" ثم توسيع "PostgreSQL" وأدخل كلمة المرور إذا طُلب منك.
4. انقر بزر الماوس الأيمن على "Databases" واختر "Create" ثم "Database..."
5. أدخل المعلومات التالية:
   - Database: `fz_maintenance_archive`
   - Owner: `postgres` (أو أي مستخدم آخر قمت بإنشائه)
6. انقر على "Save" لإنشاء قاعدة البيانات.

### إنشاء قاعدة البيانات باستخدام سطر الأوامر

1. افتح موجه الأوامر (Command Prompt) أو PowerShell.
2. تنفيذ الأمر التالي للاتصال بالخادم PostgreSQL:
   ```
   psql -U postgres
   ```
3. أدخل كلمة المرور عندما يُطلب منك.
4. قم بإنشاء قاعدة البيانات باستخدام الأمر التالي:
   ```sql
   CREATE DATABASE fz_maintenance_archive;
   ```
5. يمكنك التحقق من إنشاء قاعدة البيانات باستخدام الأمر:
   ```sql
   \l
   ```
6. اخرج من psql باستخدام الأمر:
   ```sql
   \q
   ```

## الخطوة 3: تحديث ملف .env

1. افتح ملف `.env` في المجلد `backend`.
2. تأكد من تحديث معلومات الاتصال بقاعدة البيانات لتناسب إعداداتك:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/fz_maintenance_archive
   TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/fz_maintenance_archive_test
   ```
   *ملاحظة: قم بتغيير كلمة المرور "password" إلى كلمة المرور التي قمت بتعيينها أثناء التثبيت.*

## الخطوة 4: تنفيذ الهجرات بواسطة Alembic

1. بعد تثبيت التبعيات (`pip install -r requirements.txt`) وتنشيط البيئة الافتراضية، قم بتنفيذ الأمر التالي في مجلد `backend`:
   ```
   alembic revision --autogenerate -m "Initial migration"
   ```
   هذا سينشئ ملف هجرة جديد في المجلد `migrations/versions` بناءً على النماذج المحددة.

2. قم بتنفيذ الهجرات على قاعدة البيانات:
   ```
   alembic upgrade head
   ```

## الخطوة 5: إنشاء بيانات أولية (اختياري)

لاختبار النظام، يمكنك إنشاء بيانات أولية في قاعدة البيانات.
سيتم توفير نصوص SQL في مجلد `backend/seed` لإضافة بيانات اختبار أساسية.

## استكشاف الأخطاء وإصلاحها

### الخطأ: "pg_config executable not found"

إذا واجهت خطأ "pg_config executable not found" عند تثبيت psycopg2-binary، جرب الحلول التالية:

1. تأكد من تثبيت PostgreSQL بشكل صحيح.
2. قم بإضافة مجلد `bin` من تثبيت PostgreSQL إلى متغير البيئة PATH.
   - مسار المجلد النموذجي: `C:\Program Files\PostgreSQL\14\bin`

3. بدلاً من ذلك، يمكنك تجربة تثبيت حزمة binary مباشرة:
   ```
   pip install psycopg2-binary
   ```

### الخطأ: "Unable to connect to the server"

إذا لم تتمكن من الاتصال بخادم PostgreSQL، تحقق من:

1. أن خدمة PostgreSQL قيد التشغيل (يمكنك التحقق من "Services" في Windows).
2. إعدادات الاتصال في ملف `.env` صحيحة.
3. جدار الحماية لا يمنع الاتصال على المنفذ 5432.

### الخطأ في تنفيذ أوامر Alembic

إذا واجهت مشاكل في تنفيذ Alembic:

1. تأكد من تثبيت Alembic بشكل صحيح: `pip install alembic`
2. تحقق من صحة ملف `alembic.ini` ومن إعداد URL قاعدة البيانات فيه.
3. تأكد من أن وحدات النماذج مستوردة بشكل صحيح في `env.py`.
