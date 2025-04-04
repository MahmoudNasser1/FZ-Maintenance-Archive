// notificationSlice.ts - u0634u0631u064au062du0629 Redux u0644u0625u062fu0627u0631u0629 u0627u0644u0625u0634u0639u0627u0631u0627u062a
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../services/notificationService';

// u0646u0648u0639 u062du0627u0644u0629 u0627u0644u0625u0634u0639u0627u0631u0627u062a
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

// u0627u0644u062du0627u0644u0629 u0627u0644u0645u0628u062fu0626u064au0629
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0
};

// u0625u0646u0634u0627u0621 u0634u0631u064au062du0629 u0627u0644u0625u0634u0639u0627u0631u0627u062a
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // u0625u0636u0627u0641u0629 u0625u0634u0639u0627u0631 u062cu062fu064au062f
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    
    // u0625u0632u0627u0644u0629 u0625u0634u0639u0627u0631 u0628u0648u0627u0633u0637u0629 u0627u0644u0645u0639u0631u0641
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    // u062au0639u0644u064au0645 u0625u0634u0639u0627u0631 u0643u0645u0642u0631u0648u0621
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    // u062au0639u0644u064au0645 u062cu0645u064au0639 u0627u0644u0625u0634u0639u0627u0631u0627u062a u0643u0645u0642u0631u0648u0621u0629
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    
    // u062au0635u0641u064au0629 u062cu0645u064au0639 u0627u0644u0625u0634u0639u0627u0631u0627u062a
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    
    // u0625u0636u0627u0641u0629 u0645u062cu0645u0648u0639u0629 u0645u0646 u0627u0644u0625u0634u0639u0627u0631u0627u062a (u0645u0641u064au062f u0644u0644u0627u0633u062au0639u0627u062fu0629 u0645u0646 u0627u0644u062au062eu0632u064au0646 u0627u0644u0645u062du0644u064a)
    addBulkNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = [...state.notifications, ...action.payload];
      const unreadCount = action.payload.filter(n => !n.read).length;
      state.unreadCount += unreadCount;
    }
  }
});

// u062au0635u062fu064au0631 u0627u0644u0625u062cu0631u0627u0621u0627u062a
export const { 
  addNotification, 
  removeNotification, 
  markAsRead, 
  markAllAsRead, 
  clearAllNotifications,
  addBulkNotifications
} = notificationSlice.actions;

// u062au0635u062fu064au0631 reducer
export default notificationSlice.reducer;
