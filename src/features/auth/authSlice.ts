import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserSession } from '../../types';
import type { AppDispatch } from '../../app/store';
import { isSupabaseConfigured, supabase, toUserSession } from '../../lib/supabase';

interface AuthState {
  user: UserSession | null;
  loading: boolean;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  initialized: false,
};

let authStateSubscription: { unsubscribe: () => void } | null = null;

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserSession | null>) => {
      state.user = action.payload;
      state.loading = false;
      state.initialized = true;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
  },
});

export const { setUser, setLoading, setInitialized } = authSlice.actions;

// Async Thunks
export const initializeAuth = () => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true));
  if (!isSupabaseConfigured || !supabase) {
    dispatch(setUser(null));
    return;
  }

  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (session?.user) {
      dispatch(setUser(await toUserSession(session.user)));
    } else {
      dispatch(setUser(null));
    }
  } catch {
    dispatch(setUser(null));
  }

  // Listen for changes once. React StrictMode can run initialization twice in dev.
  if (!authStateSubscription) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void toUserSession(session.user).then(user => dispatch(setUser(user)));
      } else {
        dispatch(setUser(null));
      }
    });
    authStateSubscription = data.subscription;
  }
};

export const logoutUser = () => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true));
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  dispatch(setUser(null));
};

export default authSlice.reducer;
