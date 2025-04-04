# Services package

# Import enhanced notification service to replace the standard one
from app.services.enhanced_notification_service import (
    send_notification,
    send_status_change_notification,
    send_technician_assignment_notification,
    send_case_notification,
    send_batch_update_notification,
    send_system_notification,
    broadcast_system_notification,
    get_unread_notification_count,
    mark_notification_as_read,
    mark_all_notifications_as_read
)
