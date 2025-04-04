# التوثيق التقني لنظام الإشعارات - FZ Maintenance Archive

## نظرة عامة على البنية

نظام الإشعارات في تطبيق FZ Maintenance Archive مصمم ليوفر إشعارات في الوقت الحقيقي مع الحفاظ على سجل دائم للإشعارات. يستخدم النظام مزيجًا من تقنيات REST API التقليدية لعمليات CRUD على الإشعارات، وتقنية WebSockets للإشعارات الفورية في الوقت الحقيقي.

![هيكل نظام الإشعارات](../docs/images/notification_architecture.png)

## المكونات الرئيسية

### 1. نموذج البيانات (Data Model)

```python
# app/models/notification.py
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    related_case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # العلاقات
    recipient = relationship("User", back_populates="notifications")
    related_case = relationship("Case", back_populates="notifications")
```

- **id**: معرف فريد للإشعار (UUID)
- **recipient_id**: معرف المستخدم المستلم للإشعار
- **message**: نص الإشعار
- **is_read**: علامة تشير إلى ما إذا كان الإشعار قد تمت قراءته
- **related_case_id**: معرف الحالة المرتبطة بالإشعار (إذا كان متعلقًا بحالة)
- **created_at**: التاريخ والوقت الذي تم فيه إنشاء الإشعار

### 2. مخططات البيانات (Schemas)

```python
# app/schemas/notification.py
class NotificationBase(BaseModel):
    message: str
    is_read: bool = False
    related_case_id: Optional[UUID] = None


class NotificationCreate(NotificationBase):
    recipient_id: UUID


class NotificationUpdate(BaseModel):
    message: Optional[str] = None
    is_read: Optional[bool] = None
    related_case_id: Optional[UUID] = None


class Notification(NotificationBase):
    id: UUID
    recipient_id: UUID
    created_at: datetime

    class Config:
        orm_mode = True
```

توفر هذه المخططات تحققًا من صحة البيانات وتحويلًا بين نموذج SQLAlchemy ووثائق JSON.

### 3. عمليات CRUD

```python
# app/crud/notification.py
class CRUDNotification:
    def create(self, db: Session, *, obj_in: NotificationCreate) -> Notification:
        # إنشاء إشعار جديد
        ...
        
    def get(self, db: Session, notification_id: UUID) -> Optional[Notification]:
        # الحصول على إشعار محدد بواسطة ID
        ...
        
    def get_multi(self, db: Session, *, recipient_id: UUID, skip: int = 0, 
                  limit: int = 100, is_read: Optional[bool] = None) -> List[Notification]:
        # الحصول على قائمة من الإشعارات لمستخدم معين
        ...
        
    def update(self, db: Session, *, db_obj: Notification, 
               obj_in: Union[NotificationUpdate, Dict[str, Any]]) -> Notification:
        # تحديث إشعار موجود
        ...
        
    def delete(self, db: Session, *, notification_id: UUID) -> None:
        # حذف إشعار
        ...
        
    def mark_as_read(self, db: Session, *, notification_id: UUID) -> Notification:
        # تحديد إشعار كمقروء
        ...
        
    def mark_all_as_read(self, db: Session, *, recipient_id: UUID) -> int:
        # تحديد جميع إشعارات مستخدم كمقروءة
        ...
        
    def count_unread(self, db: Session, *, recipient_id: UUID) -> int:
        # عد الإشعارات غير المقروءة لمستخدم معين
        ...
```

توفر فئة `CRUDNotification` جميع العمليات الأساسية اللازمة للتعامل مع الإشعارات في قاعدة البيانات.

### 4. خدمة الإشعارات (Notification Service)

```python
# app/services/notification_service.py
async def send_notification(
    user_id: UUID, 
    message: str, 
    related_case_id: Optional[UUID] = None, 
    background_tasks: Optional[BackgroundTasks] = None,
    db: Optional[Session] = None
) -> Optional[Notification]:
    """
    إرسال إشعار لمستخدم وتخزينه في قاعدة البيانات
    
    إذا كان المستخدم متصلاً عبر WebSocket، سيتلقى الإشعار فوراً
    """
    ...

async def send_case_notification(
    case_id: UUID,
    message: str,
    db: Session,
    background_tasks: BackgroundTasks,
    exclude_user_id: Optional[UUID] = None
) -> None:
    """
    إرسال إشعار لجميع المستخدمين المرتبطين بحالة معينة
    """
    ...

async def send_system_notification(
    user_id: UUID,
    message: str,
    background_tasks: BackgroundTasks,
    db: Session
) -> None:
    """
    إرسال إشعار نظام لمستخدم محدد
    """
    ...

async def broadcast_system_notification(
    message: str,
    roles: List[str],
    background_tasks: BackgroundTasks,
    db: Session
) -> None:
    """
    بث إشعار نظام لجميع المستخدمين من أدوار محددة
    """
    ...

def get_unread_notification_count(db: Session, user_id: UUID) -> int:
    """
    الحصول على عدد الإشعارات غير المقروءة لمستخدم
    """
    ...

def mark_notification_as_read(db: Session, notification_id: UUID, user_id: UUID) -> Optional[Notification]:
    """
    تحديد إشعار محدد كمقروء
    """
    ...

def mark_all_notifications_as_read(db: Session, user_id: UUID) -> int:
    """
    تحديد جميع إشعارات المستخدم كمقروءة
    """
    ...
```

خدمة الإشعارات تقدم واجهة عالية المستوى للتعامل مع الإشعارات، بما في ذلك الإرسال الفوري عبر WebSockets.

### 5. مدير اتصالات WebSocket

```python
# app/websockets/connection_manager.py
class ConnectionManager:
    def __init__(self):
        # تخزين اتصالات المستخدمين النشطة
        self.active_connections: Dict[UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: UUID) -> None:
        """
        إنشاء اتصال WebSocket جديد لمستخدم
        """
        # قبول الاتصال
        await websocket.accept()
        
        # إضافة الاتصال إلى القائمة النشطة
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        
        # يمكن إرسال رسالة ترحيب أو حالة الاتصال
        await websocket.send_json({"type": "connection_status", "status": "connected"})

    async def disconnect(self, websocket: WebSocket, user_id: UUID) -> None:
        """
        إزالة اتصال WebSocket من القائمة النشطة
        """
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            
            # إذا لم يعد هناك اتصالات نشطة لهذا المستخدم، قم بإزالة المفتاح
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_notification(self, user_id: UUID, message: Dict[str, Any]) -> bool:
        """
        إرسال إشعار لمستخدم محدد عبر WebSocket
        يعيد True إذا تم الإرسال بنجاح، False إذا لم يكن المستخدم متصلاً
        """
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    # في حالة فشل الإرسال، قم بإزالة الاتصال
                    await self.disconnect(connection, user_id)
                    continue
            return True
        return False

    async def broadcast(self, message: Dict[str, Any], exclude_user_id: Optional[UUID] = None) -> None:
        """
        بث رسالة لجميع المستخدمين المتصلين
        """
        for user_id, connections in list(self.active_connections.items()):
            if exclude_user_id is not None and user_id == exclude_user_id:
                continue
                
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    await self.disconnect(connection, user_id)


# إنشاء نسخة واحدة من مدير الاتصالات ليتم استخدامها في جميع أنحاء التطبيق
manager = ConnectionManager()
```

فئة `ConnectionManager` تدير اتصالات WebSocket النشطة وتوفر وظائف لإرسال الإشعارات للمستخدمين المتصلين.

### 6. نقاط نهاية API

```python
# app/api/v1/endpoints/notifications/router.py
@router.get("/", response_model=List[NotificationSchema], tags=["notifications"])
async def read_notifications(
    is_read: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """استرجاع إشعارات المستخدم الحالي"""
    ...

@router.get("/count", response_model=int, tags=["notifications"])
async def read_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """الحصول على عدد الإشعارات غير المقروءة للمستخدم الحالي"""
    ...

@router.post("/", response_model=NotificationSchema, status_code=status.HTTP_201_CREATED, tags=["notifications"])
async def create_notification(...):
    """إنشاء إشعار جديد"""
    ...

@router.put("/{notification_id}/read", response_model=NotificationSchema, tags=["notifications"])
async def mark_notification_as_read(...):
    """تحديد إشعار كمقروء"""
    ...

@router.put("/read-all", response_model=dict, tags=["notifications"])
async def mark_all_notifications_as_read(...):
    """تحديد جميع إشعارات المستخدم الحالي كمقروءة"""
    ...

@router.delete("/{notification_id}", response_model=dict, tags=["notifications"])
async def delete_notification(...):
    """حذف إشعار"""
    ...

@router.delete("/read", response_model=dict, tags=["notifications"])
async def delete_all_read_notifications(...):
    """حذف جميع الإشعارات المقروءة للمستخدم الحالي"""
    ...

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """نقطة نهاية WebSocket للإشعارات في الوقت الحقيقي"""
    ...
```

نقاط نهاية API توفر واجهة RESTful للتعامل مع الإشعارات، بالإضافة إلى نقطة نهاية WebSocket للإشعارات في الوقت الحقيقي.

## تدفق البيانات في نظام الإشعارات

### 1. إنشاء الإشعارات

عندما يحدث حدث يستدعي إشعارًا (مثل تحديث حالة صيانة):

1. يتم استدعاء `send_notification` من الخدمة المناسبة (مثل `case_service`).
2. يتم إنشاء كائن `NotificationCreate`.
3. يتم حفظ الإشعار في قاعدة البيانات.
4. يتم التحقق مما إذا كان المستخدم المستهدف متصلاً عبر WebSocket.
5. إذا كان المستخدم متصلاً، يتم إرسال الإشعار فورًا.
6. إذا لم يكن المستخدم متصلاً، سيرى الإشعار في المرة القادمة التي يتصل فيها بالنظام.

### 2. استلام الإشعارات في الوقت الحقيقي

1. عند تسجيل الدخول، يقوم العميل بفتح اتصال WebSocket باستخدام رمز JWT.
2. الخادم يتحقق من الرمز ويربط الاتصال بالمستخدم.
3. يتم تسجيل الاتصال في `ConnectionManager`.
4. عند حدوث حدث يستدعي إشعارًا، يتم إرسال الإشعار فورًا عبر WebSocket.
5. يعرض العميل الإشعار في واجهة المستخدم.

### 3. إدارة الإشعارات

1. يمكن للمستخدمين عرض إشعاراتهم من خلال نقطة نهاية `/notifications`.
2. يمكن تحديد الإشعارات كمقروءة من خلال نقطة نهاية `/notifications/{notification_id}/read`.
3. يمكن للمستخدمين حذف الإشعارات من خلال نقطة نهاية `/notifications/{notification_id}`.
4. يمكن للمستخدمين معرفة عدد الإشعارات غير المقروءة من خلال نقطة نهاية `/notifications/count`.

## تعامل الخادم مع اتصالات WebSocket

### إدارة الاتصال

1. **بدء الاتصال**: عند استدعاء `websocket_endpoint`، يتم التحقق من رمز JWT ثم استدعاء `manager.connect()`.
2. **قطع الاتصال**: عند انقطاع الاتصال، يتم استدعاء `manager.disconnect()`.
3. **التعامل مع الأخطاء**: في حالة فشل إرسال رسالة، يتم إزالة الاتصال تلقائيًا.

### تخزين الاتصالات

يتم تخزين اتصالات WebSocket النشطة في هيكل بيانات `Dict[UUID, List[WebSocket]]`، حيث:

- المفتاح هو معرف المستخدم (UUID)
- القيمة هي قائمة من اتصالات WebSocket النشطة للمستخدم

هذا يسمح للمستخدم بفتح اتصالات متعددة (مثل علامات تبويب متعددة للمتصفح) مع الحفاظ على استلام الإشعارات على جميع الأجهزة.

## تأمين نظام الإشعارات

### مصادقة WebSocket

تستخدم اتصالات WebSocket نفس آلية مصادقة JWT المستخدمة في REST API:

1. يتم تمرير رمز JWT في مسار نقطة النهاية: `/api/v1/notifications/ws/{token}`.
2. يتم التحقق من رمز JWT باستخدام `get_current_user_from_token`.
3. يتم ربط الاتصال بمعرف المستخدم المستخرج من الرمز.

### تحكم بالوصول

1. يمكن للمستخدمين الوصول إلى إشعاراتهم الخاصة فقط.
2. فقط المستخدمون ذوو الأدوار المناسبة (admin, manager) يمكنهم إنشاء إشعارات للمستخدمين الآخرين.
3. يمكن للمستخدمين تحديد إشعاراتهم الخاصة كمقروءة وحذفها فقط.

## اختبار نظام الإشعارات

### اختبارات الوحدة (Unit Tests)

تتضمن اختبارات الوحدة لنظام الإشعارات اختبار وظائف CRUD الفردية:

```python
# tests/unit/test_crud_notification.py
def test_create_notification(...):
    """اختبار إنشاء إشعار جديد"""
    ...

def test_get_notification(...):
    """اختبار استرجاع إشعار موجود"""
    ...

def test_update_notification(...):
    """اختبار تحديث إشعار"""
    ...

def test_mark_as_read(...):
    """اختبار تحديد إشعار كمقروء"""
    ...
```

### اختبارات التكامل (Integration Tests)

تختبر نقاط نهاية API للإشعارات:

```python
# tests/integration/test_notifications_api.py
def test_read_notifications(...):
    """اختبار استرجاع إشعارات المستخدم"""
    ...

def test_mark_notification_as_read(...):
    """اختبار تحديد إشعار كمقروء عبر API"""
    ...

def test_delete_notification(...):
    """اختبار حذف إشعار عبر API"""
    ...
```

### اختبار WebSocket

اختبارات WebSocket تتطلب إعدادًا خاصًا:

```python
# tests/integration/test_websocket_notifications.py
async def test_websocket_connection(...):
    """اختبار إنشاء اتصال WebSocket باستخدام رمز صالح"""
    ...

async def test_websocket_receive_notification(...):
    """اختبار استلام إشعار عبر WebSocket"""
    ...

async def test_websocket_invalid_token(...):
    """اختبار رفض اتصال WebSocket باستخدام رمز غير صالح"""
    ...
```

## تحسين الأداء والتدرج

### التخزين المؤقت (Caching)

يمكن تحسين أداء نظام الإشعارات باستخدام التخزين المؤقت:

```python
def get_unread_notification_count(db: Session, user_id: UUID) -> int:
    """
    الحصول على عدد الإشعارات غير المقروءة لمستخدم مع التخزين المؤقت
    """
    # التحقق من التخزين المؤقت أولاً
    cache_key = f"unread_notifications:{user_id}"
    cached_count = redis_client.get(cache_key)
    
    if cached_count is not None:
        return int(cached_count)
    
    # إذا لم يكن موجودًا في التخزين المؤقت، استعلم من قاعدة البيانات
    count = notification_crud.count_unread(db, recipient_id=user_id)
    
    # تخزين النتيجة في التخزين المؤقت (لمدة 5 دقائق)
    redis_client.set(cache_key, str(count), ex=300)
    
    return count
```

### تقسيم الإشعارات إلى أجزاء (Pagination)

لتجنب استرجاع كميات كبيرة من البيانات، يدعم API تقسيم الإشعارات إلى أجزاء:

```python
@router.get("/", response_model=List[NotificationSchema])
async def read_notifications(
    is_read: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    ...
):
    """
    استرجاع إشعارات المستخدم الحالي مع دعم التقسيم إلى أجزاء
    """
    return notification_crud.get_multi(
        db=db, 
        skip=skip, 
        limit=limit, 
        recipient_id=current_user.id,
        is_read=is_read
    )
```

### تنظيف الإشعارات (Cleanup)

لمنع تراكم الإشعارات القديمة، يمكن إعداد مهمة دورية لحذف الإشعارات القديمة:

```python
async def cleanup_old_notifications():
    """
    حذف الإشعارات المقروءة القديمة أكثر من 30 يومًا
    """
    async with async_session() as db:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        await db.execute(
            delete(Notification)
            .where(
                and_(
                    Notification.is_read == True,
                    Notification.created_at < thirty_days_ago
                )
            )
        )
        await db.commit()
```

## خاتمة

نظام الإشعارات في تطبيق FZ Maintenance Archive يوفر تجربة غنية في الوقت الحقيقي مع الحفاظ على بنية نظيفة وقابلة للتوسع. من خلال الجمع بين REST API التقليدي وWebSockets، يمكن للنظام توفير كل من الإشعارات الفورية والوصول إلى سجل الإشعارات.

باستخدام هذا التوثيق، يمكن للمطورين فهم تصميم النظام وتنفيذه وتوسيعه حسب الحاجة.
