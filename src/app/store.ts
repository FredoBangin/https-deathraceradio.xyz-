import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { juicewrldApi } from '../services/juicewrldApi';
import { uploadsApi } from '../services/uploadsApi';
import playerReducer from '../features/player/playerSlice';
import authReducer from '../features/auth/authSlice';
import libraryReducer from '../features/library/librarySlice';
import uploadReducer from '../features/upload/uploadSlice';

export const store = configureStore({
  reducer: {
    [juicewrldApi.reducerPath]: juicewrldApi.reducer,
    [uploadsApi.reducerPath]: uploadsApi.reducer,
    player: playerReducer,
    auth: authReducer,
    library: libraryReducer,
    upload: uploadReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(juicewrldApi.middleware, uploadsApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
