import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

const READ_NOTIFICATIONS_KEY = 'dr_read_notification_ids';

interface NotificationsState {
  readIds: string[];
}

const loadReadIds = () => {
  try {
    const saved = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    return saved ? JSON.parse(saved) as string[] : [];
  } catch {
    return [];
  }
};

const saveReadIds = (readIds: string[]) => {
  localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readIds));
};

const initialState: NotificationsState = {
  readIds: loadReadIds(),
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    markNotificationRead: (state, action: PayloadAction<string>) => {
      if (state.readIds.includes(action.payload)) return;
      state.readIds.push(action.payload);
      saveReadIds(state.readIds);
    },
    markAllNotificationsRead: (state, action: PayloadAction<string[]>) => {
      state.readIds = Array.from(new Set([...state.readIds, ...action.payload]));
      saveReadIds(state.readIds);
    },
  },
});

export const {
  markAllNotificationsRead,
  markNotificationRead,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
