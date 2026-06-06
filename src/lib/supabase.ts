import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { UserSession } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const AUTH_STORAGE_MODE_KEY = 'dr_auth_storage_mode';
const DEMO_USER_KEY = 'demo_user';

type AuthStorageMode = 'local' | 'session';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const getAuthStorageMode = (): AuthStorageMode =>
  localStorage.getItem(AUTH_STORAGE_MODE_KEY) === 'session' ? 'session' : 'local';

const getAuthStorage = () => (getAuthStorageMode() === 'session' ? sessionStorage : localStorage);

const authStorage = {
  getItem: (key: string) => getAuthStorage().getItem(key),
  setItem: (key: string, value: string) => {
    const target = getAuthStorage();
    const other = target === localStorage ? sessionStorage : localStorage;
    other.removeItem(key);
    target.setItem(key, value);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

// Log configuration status
if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. ' +
    'The application will run in local demo mode, utilizing browser storage for auth, likes, and comments.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: authStorage,
      },
    })
  : null;

export const setAuthRememberMe = (rememberMe: boolean) => {
  localStorage.setItem(AUTH_STORAGE_MODE_KEY, rememberMe ? 'local' : 'session');
};

export const getDemoUser = (): UserSession | null => {
  const savedUser = getAuthStorage().getItem(DEMO_USER_KEY);
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser) as UserSession;
  } catch {
    return null;
  }
};

export const saveDemoUser = (user: UserSession | null) => {
  localStorage.removeItem(DEMO_USER_KEY);
  sessionStorage.removeItem(DEMO_USER_KEY);
  if (!user) return;
  getAuthStorage().setItem(DEMO_USER_KEY, JSON.stringify(user));
};

const normalizeUsername = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);

export const getDisplayNameFromUser = (user: UserSession | null) =>
  user?.user_metadata?.display_name ||
  user?.user_metadata?.username ||
  user?.email.split('@')[0] ||
  'User';

export const upsertProfile = async (user: User, displayName?: string) => {
  if (!supabase) return null;

  const safeDisplayName = (displayName || user.user_metadata?.display_name || user.user_metadata?.username || user.email?.split('@')[0] || 'User').trim();
  const username = normalizeUsername(safeDisplayName || user.email?.split('@')[0] || user.id.slice(0, 8));

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      display_name: safeDisplayName,
      username,
      updated_at: new Date().toISOString(),
    })
    .select('display_name, username')
    .single();

  if (error) {
    console.warn('[auth] profile upsert failed:', error.message);
    return null;
  }

  return data;
};

export const getProfile = async (userId: string) => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[auth] profile load failed:', error.message);
    return null;
  }

  return data;
};

export const toUserSession = async (user: User): Promise<UserSession> => {
  const profile = await getProfile(user.id);
  const userMetadata = user.user_metadata || {};

  return {
    id: user.id,
    email: user.email || '',
    user_metadata: {
      ...userMetadata,
      display_name: profile?.display_name || userMetadata.display_name || userMetadata.username,
      username: profile?.username || userMetadata.username,
    },
  };
};
