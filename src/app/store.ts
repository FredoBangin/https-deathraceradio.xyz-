import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { juicewrldApi } from '../services/juicewrldApi';
import { commentsApi } from '../services/commentsApi';
import playerReducer from '../features/player/playerSlice';
import authReducer from '../features/auth/authSlice';
import libraryReducer from '../features/library/librarySlice';
import notificationsReducer from '../features/notifications/notificationsSlice';

export const store = configureStore({
  reducer: {
    [juicewrldApi.reducerPath]: juicewrldApi.reducer,
    [commentsApi.reducerPath]: commentsApi.reducer,
    player: playerReducer,
    auth: authReducer,
    library: libraryReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(juicewrldApi.middleware, commentsApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
