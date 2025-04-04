from typing import Dict, List, Optional
from fastapi import WebSocket
import asyncio
import logging
from uuid import UUID

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    إدارة اتصالات WebSockets للمستخدمين
    يحتفظ بقاموس من اتصالات المستخدمين النشطة ويدير إرسال الإشعارات
    """
    
    def __init__(self):
        # Dictionary to store active connections: user_id -> list of websocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Lock to prevent race conditions when modifying the connections dictionary
        self.lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, user_id: UUID):
        """
        إضافة اتصال WebSocket جديد للمستخدم
        
        Args:
            websocket: كائن WebSocket للاتصال
            user_id: معرف المستخدم
        """
        await websocket.accept()
        user_id_str = str(user_id)
        
        async with self.lock:
            if user_id_str not in self.active_connections:
                self.active_connections[user_id_str] = []
            self.active_connections[user_id_str].append(websocket)
        
        logger.info(f"User {user_id} connected. Total connections: {self.get_connection_count(user_id)}")
    
    async def disconnect(self, websocket: WebSocket, user_id: UUID):
        """
        إزالة اتصال WebSocket للمستخدم
        
        Args:
            websocket: كائن WebSocket للاتصال
            user_id: معرف المستخدم
        """
        user_id_str = str(user_id)
        
        async with self.lock:
            if user_id_str in self.active_connections:
                try:
                    self.active_connections[user_id_str].remove(websocket)
                    # Remove the user from dictionary if they have no active connections
                    if not self.active_connections[user_id_str]:
                        del self.active_connections[user_id_str]
                except ValueError:
                    logger.warning(f"Attempted to remove connection for user {user_id} that was not found")
        
        logger.info(f"User {user_id} disconnected. Remaining connections: {self.get_connection_count(user_id)}")
    
    def get_connection_count(self, user_id: UUID) -> int:
        """
        الحصول على عدد اتصالات مستخدم معين
        
        Args:
            user_id: معرف المستخدم
            
        Returns:
            عدد الاتصالات النشطة للمستخدم
        """
        user_id_str = str(user_id)
        return len(self.active_connections.get(user_id_str, []))
    
    async def send_notification_to_user(self, user_id: UUID, message: dict):
        """
        إرسال إشعار لمستخدم محدد
        
        Args:
            user_id: معرف المستخدم
            message: الرسالة المراد إرسالها (قاموس سيتم تحويله إلى JSON)
        """
        user_id_str = str(user_id)
        
        if user_id_str not in self.active_connections:
            logger.info(f"No active connection for user {user_id}. Notification will be sent when they connect.")
            return
        
        disconnected_websockets = []
        
        # Send message to all connections for this user
        for websocket in self.active_connections[user_id_str]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending notification to user {user_id}: {str(e)}")
                disconnected_websockets.append(websocket)
        
        # Clean up disconnected websockets
        if disconnected_websockets:
            async with self.lock:
                for websocket in disconnected_websockets:
                    try:
                        self.active_connections[user_id_str].remove(websocket)
                    except ValueError:
                        pass
                
                # Remove the user from dictionary if they have no active connections
                if user_id_str in self.active_connections and not self.active_connections[user_id_str]:
                    del self.active_connections[user_id_str]
    
    async def broadcast(self, message: dict, exclude_user: Optional[UUID] = None):
        """
        إرسال إشعار لجميع المستخدمين المتصلين
        
        Args:
            message: الرسالة المراد إرسالها (قاموس سيتم تحويله إلى JSON)
            exclude_user: معرف المستخدم الذي يجب استبعاده من البث (اختياري)
        """
        exclude_user_str = str(exclude_user) if exclude_user else None
        disconnected_users = []
        
        for user_id_str, connections in self.active_connections.items():
            if exclude_user_str and user_id_str == exclude_user_str:
                continue
            
            disconnected_websockets = []
            
            for websocket in connections:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to user {user_id_str}: {str(e)}")
                    disconnected_websockets.append(websocket)
            
            # Mark users with all disconnected websockets for cleanup
            if len(disconnected_websockets) == len(connections):
                disconnected_users.append(user_id_str)
            else:
                # Remove individual disconnected websockets
                async with self.lock:
                    for websocket in disconnected_websockets:
                        try:
                            self.active_connections[user_id_str].remove(websocket)
                        except ValueError:
                            pass
        
        # Clean up users with no valid connections
        if disconnected_users:
            async with self.lock:
                for user_id_str in disconnected_users:
                    if user_id_str in self.active_connections:
                        del self.active_connections[user_id_str]


# Create a global connection manager instance
manager = ConnectionManager()
