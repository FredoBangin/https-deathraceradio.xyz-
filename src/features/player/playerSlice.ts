import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Song, Upload } from '../../types';

export interface PlayerTrack {
  song: Song;
  upload?: Upload; // If playing a community upload version, otherwise preview mode
}

interface PlayerState {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  queue: PlayerTrack[];
  currentIndex: number;
  isShuffle: boolean;
  isRepeat: 'none' | 'one' | 'all';
  recentlyPlayedIds: number[];
}

const getSavedRecentlyPlayedIds = () => {
  try {
    const saved = localStorage.getItem('recently_played_song_ids');
    return saved ? JSON.parse(saved) as number[] : [];
  } catch {
    return [];
  }
};

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  volume: parseFloat(localStorage.getItem('player_volume') || '0.8'),
  isMuted: false,
  progress: 0,
  duration: 0,
  queue: [],
  currentIndex: -1,
  isShuffle: false,
  isRepeat: 'none',
  recentlyPlayedIds: getSavedRecentlyPlayedIds(),
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    playTrack: (state, action: PayloadAction<{ track: PlayerTrack; queue?: PlayerTrack[] }>) => {
      state.currentTrack = action.payload.track;
      state.isPlaying = true;
      state.progress = 0;
      state.recentlyPlayedIds = [
        action.payload.track.song.id,
        ...state.recentlyPlayedIds.filter(id => id !== action.payload.track.song.id),
      ].slice(0, 12);
      localStorage.setItem('recently_played_song_ids', JSON.stringify(state.recentlyPlayedIds));
      
      if (action.payload.queue) {
        state.queue = action.payload.queue;
        state.currentIndex = action.payload.queue.findIndex(
          t => t.song.id === action.payload.track.song.id && 
               t.upload?.id === action.payload.track.upload?.id
        );
      } else {
        // If no queue is provided, make a single track queue if not already there
        const indexInQueue = state.queue.findIndex(
          t => t.song.id === action.payload.track.song.id && 
               t.upload?.id === action.payload.track.upload?.id
        );
        if (indexInQueue !== -1) {
          state.currentIndex = indexInQueue;
        } else {
          state.queue = [action.payload.track];
          state.currentIndex = 0;
        }
      }
    },
    pauseTrack: (state) => {
      state.isPlaying = false;
    },
    resumeTrack: (state) => {
      if (state.currentTrack) {
        state.isPlaying = true;
      }
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
      state.isMuted = action.payload === 0;
      localStorage.setItem('player_volume', action.payload.toString());
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    toggleShuffle: (state) => {
      state.isShuffle = !state.isShuffle;
    },
    toggleRepeat: (state) => {
      const modes: ('none' | 'one' | 'all')[] = ['none', 'all', 'one'];
      const currentIndex = modes.indexOf(state.isRepeat);
      state.isRepeat = modes[(currentIndex + 1) % modes.length];
    },
    nextTrack: (state) => {
      if (state.queue.length === 0) return;

      if (state.isRepeat === 'one') {
        state.progress = 0;
        return;
      }

      let nextIndex = state.currentIndex + 1;

      if (state.isShuffle) {
        nextIndex = Math.floor(Math.random() * state.queue.length);
      } else if (nextIndex >= state.queue.length) {
        if (state.isRepeat === 'all') {
          nextIndex = 0;
        } else {
          state.isPlaying = false;
          state.progress = 0;
          return;
        }
      }

      state.currentIndex = nextIndex;
      state.currentTrack = state.queue[nextIndex];
      state.progress = 0;
      state.isPlaying = true;
    },
    prevTrack: (state) => {
      if (state.queue.length === 0) return;

      let prevIndex = state.currentIndex - 1;

      if (state.isShuffle) {
        prevIndex = Math.floor(Math.random() * state.queue.length);
      } else if (prevIndex < 0) {
        if (state.isRepeat === 'all') {
          prevIndex = state.queue.length - 1;
        } else {
          state.progress = 0;
          return;
        }
      }

      state.currentIndex = prevIndex;
      state.currentTrack = state.queue[prevIndex];
      state.progress = 0;
      state.isPlaying = true;
    },
    addToQueue: (state, action: PayloadAction<PlayerTrack>) => {
      // Check if already in queue
      const exists = state.queue.some(
        t => t.song.id === action.payload.song.id && 
             t.upload?.id === action.payload.upload?.id
      );
      if (!exists) {
        state.queue.push(action.payload);
        if (state.currentIndex === -1) {
          state.currentIndex = 0;
          state.currentTrack = action.payload;
        }
      }
    },
    clearQueue: (state) => {
      state.queue = [];
      state.currentIndex = -1;
      state.currentTrack = null;
      state.isPlaying = false;
      state.progress = 0;
    }
  },
});

export const {
  playTrack,
  pauseTrack,
  resumeTrack,
  setVolume,
  toggleMute,
  setProgress,
  setDuration,
  toggleShuffle,
  toggleRepeat,
  nextTrack,
  prevTrack,
  addToQueue,
  clearQueue
} = playerSlice.actions;

export default playerSlice.reducer;
