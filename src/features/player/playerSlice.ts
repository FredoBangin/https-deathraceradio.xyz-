import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Song, Upload } from '../../types';

export interface PlayerTrack {
  song: Song;
  upload?: Upload; // If playing a community upload version, otherwise preview mode
}

interface PlayerSeekRequest {
  id: number;
  songId?: number;
  time: number;
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
  playedIndexHistory: number[];
  playedSongIds: number[];
  isShuffle: boolean;
  isRepeat: 'none' | 'one' | 'all';
  recentlyPlayedIds: number[];
  seekRequest: PlayerSeekRequest | null;
}

const getSavedRecentlyPlayedIds = () => {
  try {
    const saved = localStorage.getItem('recently_played_song_ids');
    return saved ? JSON.parse(saved) as number[] : [];
  } catch {
    return [];
  }
};

const rememberPlayedTrack = (state: PlayerState, track: PlayerTrack) => {
  if (!state.playedSongIds.includes(track.song.id)) {
    state.playedSongIds.push(track.song.id);
  }

  state.recentlyPlayedIds = [
    track.song.id,
    ...state.recentlyPlayedIds.filter(id => id !== track.song.id),
  ].slice(0, 12);
  localStorage.setItem('recently_played_song_ids', JSON.stringify(state.recentlyPlayedIds));
};

const isSameTrack = (a: PlayerTrack, b: PlayerTrack) =>
  a.song.id === b.song.id && a.upload?.id === b.upload?.id;

const getUnplayedQueueIndices = (state: PlayerState) =>
  state.queue
    .map((track, index) => ({ track, index }))
    .filter(({ track, index }) => index !== state.currentIndex && !state.playedSongIds.includes(track.song.id))
    .map(({ index }) => index);

const getNextUnplayedIndex = (state: PlayerState) => {
  if (!state.queue.length) return -1;

  const unplayedIndices = getUnplayedQueueIndices(state);
  if (!unplayedIndices.length) return -1;

  if (state.isShuffle) {
    return unplayedIndices[Math.floor(Math.random() * unplayedIndices.length)];
  }

  const nextForward = unplayedIndices.find(index => index > state.currentIndex);
  if (typeof nextForward === 'number') return nextForward;

  return state.isRepeat === 'all' ? unplayedIndices[0] : -1;
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
  playedIndexHistory: [],
  playedSongIds: [],
  isShuffle: false,
  isRepeat: 'none',
  recentlyPlayedIds: getSavedRecentlyPlayedIds(),
  seekRequest: null,
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    playTrack: (state, action: PayloadAction<{ track: PlayerTrack; queue?: PlayerTrack[] }>) => {
      state.currentTrack = action.payload.track;
      state.isPlaying = true;
      state.progress = 0;
      state.playedIndexHistory = [];
      state.playedSongIds = [];
      rememberPlayedTrack(state, action.payload.track);
      
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
    seekToTime: (state, action: PayloadAction<number | { time: number; songId?: number }>) => {
      const payload = typeof action.payload === 'number'
        ? { time: action.payload }
        : action.payload;
      const nextTime = Math.max(0, payload.time);
      state.progress = nextTime;
      state.seekRequest = {
        id: (state.seekRequest?.id || 0) + 1,
        songId: payload.songId,
        time: nextTime,
      };
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    toggleShuffle: (state) => {
      state.isShuffle = !state.isShuffle;
    },
    setShuffle: (state, action: PayloadAction<boolean>) => {
      state.isShuffle = action.payload;
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

      let nextIndex = getNextUnplayedIndex(state);

      // When repeat:all and every song has been played, reset and restart
      if (nextIndex === -1 && state.isRepeat === 'all' && state.queue.length > 0) {
        state.playedSongIds = state.currentTrack ? [state.currentTrack.song.id] : [];
        nextIndex = getNextUnplayedIndex(state);
      }

      if (nextIndex === -1 || typeof nextIndex !== 'number') {
        state.isPlaying = false;
        state.progress = 0;
        return;
      }

      if (state.currentIndex >= 0 && nextIndex !== state.currentIndex) {
        state.playedIndexHistory = [...state.playedIndexHistory, state.currentIndex].slice(-50);
      }
      state.currentIndex = nextIndex;
      state.currentTrack = state.queue[nextIndex];
      state.progress = 0;
      state.isPlaying = true;
      rememberPlayedTrack(state, state.currentTrack);
    },
    prevTrack: (state) => {
      if (state.queue.length === 0) return;

      const historyIndex = state.playedIndexHistory.pop();
      let prevIndex = typeof historyIndex === 'number' ? historyIndex : state.currentIndex - 1;

      if (prevIndex < 0) {
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
      rememberPlayedTrack(state, state.currentTrack);
    },
    playQueueIndex: (state, action: PayloadAction<number>) => {
      const nextIndex = action.payload;
      if (nextIndex < 0 || nextIndex >= state.queue.length) return;

      if (state.currentIndex >= 0 && nextIndex !== state.currentIndex) {
        state.playedIndexHistory = [...state.playedIndexHistory, state.currentIndex].slice(-50);
      }

      state.currentIndex = nextIndex;
      state.currentTrack = state.queue[nextIndex];
      state.progress = 0;
      state.isPlaying = true;
      rememberPlayedTrack(state, state.currentTrack);
    },
    playNext: (state, action: PayloadAction<PlayerTrack>) => {
      const track = action.payload;

      if (!state.currentTrack) {
        state.queue = [track];
        state.currentTrack = track;
        state.currentIndex = 0;
        state.progress = 0;
        state.isPlaying = true;
        rememberPlayedTrack(state, track);
        return;
      }

      if (isSameTrack(track, state.currentTrack)) return;

      const existingIndex = state.queue.findIndex(item => isSameTrack(item, track));
      if (existingIndex !== -1) {
        state.queue.splice(existingIndex, 1);
        if (existingIndex < state.currentIndex) state.currentIndex -= 1;
      }

      state.queue.splice(state.currentIndex + 1, 0, track);
    },
    playLater: (state, action: PayloadAction<PlayerTrack>) => {
      const track = action.payload;
      if (state.currentTrack && isSameTrack(track, state.currentTrack)) return;

      const existingIndex = state.queue.findIndex(item => isSameTrack(item, track));
      if (existingIndex !== -1) {
        state.queue.splice(existingIndex, 1);
        if (existingIndex < state.currentIndex) state.currentIndex -= 1;
      }

      state.queue.push(track);
      if (!state.currentTrack) {
        state.currentTrack = track;
        state.currentIndex = 0;
      }
    },
    removeFromQueue: (state, action: PayloadAction<number>) => {
      const removeIndex = action.payload;
      if (removeIndex < 0 || removeIndex >= state.queue.length) return;

      if (removeIndex === state.currentIndex) {
        state.queue.splice(removeIndex, 1);
        if (!state.queue.length) {
          state.currentTrack = null;
          state.currentIndex = -1;
          state.progress = 0;
          state.isPlaying = false;
          state.playedIndexHistory = [];
          return;
        }

        const nextIndex = Math.min(removeIndex, state.queue.length - 1);
        state.currentIndex = nextIndex;
        state.currentTrack = state.queue[nextIndex];
        state.progress = 0;
        rememberPlayedTrack(state, state.currentTrack);
        return;
      }

      state.queue.splice(removeIndex, 1);
      if (removeIndex < state.currentIndex) state.currentIndex -= 1;
      state.playedIndexHistory = state.playedIndexHistory
        .filter(index => index !== removeIndex)
        .map(index => index > removeIndex ? index - 1 : index);
    },
    moveQueueItemToTop: (state, action: PayloadAction<number>) => {
      const itemIndex = action.payload;
      if (itemIndex < 0 || itemIndex >= state.queue.length || itemIndex === state.currentIndex) return;

      const [item] = state.queue.splice(itemIndex, 1);
      if (itemIndex < state.currentIndex) state.currentIndex -= 1;
      state.queue.splice(Math.min(state.queue.length, state.currentIndex + 1), 0, item);
    },
    moveQueueItemToEnd: (state, action: PayloadAction<number>) => {
      const itemIndex = action.payload;
      if (itemIndex < 0 || itemIndex >= state.queue.length || itemIndex === state.currentIndex) return;

      const [item] = state.queue.splice(itemIndex, 1);
      if (itemIndex < state.currentIndex) state.currentIndex -= 1;
      state.queue.push(item);
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
      state.playedIndexHistory = [];
      state.playedSongIds = [];
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
  seekToTime,
  setDuration,
  toggleShuffle,
  setShuffle,
  toggleRepeat,
  nextTrack,
  prevTrack,
  playQueueIndex,
  playNext,
  playLater,
  removeFromQueue,
  moveQueueItemToTop,
  moveQueueItemToEnd,
  addToQueue,
  clearQueue
} = playerSlice.actions;

export default playerSlice.reducer;
