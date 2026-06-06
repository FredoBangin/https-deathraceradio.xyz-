import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../../app/store';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface LibraryState {
  likedSongIds: number[];
  loading: boolean;
}

const getLocalLikes = (): number[] => {
  if (isSupabaseConfigured) return [];
  const saved = localStorage.getItem('liked_song_ids');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

const initialState: LibraryState = {
  likedSongIds: getLocalLikes(),
  loading: false,
};

export const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    setLikes: (state, action: PayloadAction<number[]>) => {
      state.likedSongIds = action.payload;
      state.loading = false;
      if (!isSupabaseConfigured) {
        localStorage.setItem('liked_song_ids', JSON.stringify(action.payload));
      }
    },
    addLike: (state, action: PayloadAction<number>) => {
      if (!state.likedSongIds.includes(action.payload)) {
        state.likedSongIds.push(action.payload);
        if (!isSupabaseConfigured) {
          localStorage.setItem('liked_song_ids', JSON.stringify(state.likedSongIds));
        }
      }
    },
    removeLike: (state, action: PayloadAction<number>) => {
      state.likedSongIds = state.likedSongIds.filter(id => id !== action.payload);
      if (!isSupabaseConfigured) {
        localStorage.setItem('liked_song_ids', JSON.stringify(state.likedSongIds));
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    }
  },
});

export const { setLikes, addLike, removeLike, setLoading } = librarySlice.actions;

// Async Thunks
export const fetchLikes = (userId: string | undefined) => async (dispatch: AppDispatch) => {
  if (!userId) {
    dispatch(setLikes([]));
    return;
  }

  dispatch(setLoading(true));

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('song_api_id')
        .eq('user_id', userId);

      if (error) throw error;

      const ids = (data as Array<{ song_api_id: number }>).map(item => item.song_api_id);
      dispatch(setLikes(ids));
    } catch (err) {
      console.error('Error fetching likes:', err);
      dispatch(setLoading(false));
    }
  } else {
    // Already set in initial state, but let's confirm
    dispatch(setLikes(getLocalLikes()));
  }
};

export const toggleLike = (songId: number, userId: string | undefined) => async (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  if (!userId) {
    // If not logged in, trigger auth modal or warning.
    return;
  }

  const state = getState();
  const likedSongIds = state.library.likedSongIds;
  const isLiked = likedSongIds.includes(songId);

  if (isLiked) {
    dispatch(removeLike(songId));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('song_api_id', songId);
      } catch (err) {
        console.error('Error deleting like:', err);
      }
    }
  } else {
    dispatch(addLike(songId));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('likes')
          .insert({ user_id: userId, song_api_id: songId });
      } catch (err) {
        console.error('Error saving like:', err);
      }
    }
  }
};

export default librarySlice.reducer;
