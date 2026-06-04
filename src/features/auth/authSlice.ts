import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserSession } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface AuthState {
  user: UserSession | null;
  loading: boolean;
  initialized: boolean;
}

const getInitialUser = (): UserSession | null => {
  if (isSupabaseConfigured) return null;
  
  // Local demo mode: check localStorage
  const savedUser = localStorage.getItem('demo_user');
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  }
  return null;
};

const initialState: AuthState = {
  user: getInitialUser(),
  loading: false,
  initialized: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserSession | null>) => {
      state.user = action.payload;
      state.loading = false;
      state.initialized = true;
      if (!isSupabaseConfigured && action.payload) {
        localStorage.setItem('demo_user', JSON.stringify(action.payload));
      } else if (!isSupabaseConfigured && !action.payload) {
        localStorage.removeItem('demo_user');
      }
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
export const initializeAuth = () => async (dispatch: any) => {
  dispatch(setLoading(true));
  if (isSupabaseConfigured && supabase) {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      dispatch(setUser({
        id: session.user.id,
        email: session.user.email || '',
        user_metadata: session.user.user_metadata,
      }));
    } else {
      dispatch(setUser(null));
    }

    // Listen for changes
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        dispatch(setUser({
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        }));
      } else {
        dispatch(setUser(null));
      }
    });
  } else {
    // Demo mode is already loaded from localStorage via initial state
    dispatch(setInitialized(true));
    dispatch(setLoading(false));
  }
};

export const logoutUser = () => async (dispatch: any) => {
  dispatch(setLoading(true));
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  dispatch(setUser(null));
};

export default authSlice.reducer;
