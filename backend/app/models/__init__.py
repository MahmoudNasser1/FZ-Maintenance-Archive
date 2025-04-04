from app.models.base import BaseModel
from app.models.user import User, UserRole
from app.models.case import Case, CaseStatus
from app.models.attachment import Attachment, AttachmentType
from app.models.note import Note
from app.models.activity import Activity
from app.models.work_log import WorkLog
from app.models.notification import Notification

# For Alembic migrations
from app.core.database import Base
