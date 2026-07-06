import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Song, Upload } from '../../types';

export interface PlayerTrack {
  song: Song;
  upload?: Upload; // If playing a community upload version, otherwise preview mode
}

type QueueSource = 'user' | 'radio';

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
  queueSource: QueueSource | null;
  originalQueue: PlayerTrack[]; // unshuffled order, stored while shuffle is on
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

const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const applyShuffle = (state: PlayerState) => {
  state.originalQueue = [...state.queue];
  const upcoming = shuffleArray(state.queue.slice(state.currentIndex + 1));
  state.queue = [...state.queue.slice(0, state.currentIndex + 1), ...upcoming];
  state.playedIndexHistory = [];
};

const applyUnshuffle = (state: PlayerState) => {
  if (!state.originalQueue.length) return;
  const current = state.currentTrack;
  state.queue = [...state.originalQueue];
  if (current) {
    const newIdx = state.queue.findIndex(t => isSameTrack(t, current));
    if (newIdx >= 0) state.currentIndex = newIdx;
  }
  state.originalQueue = [];
  state.playedIndexHistory = [];
};

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  volume: parseFloat(localStorage.getItem('player_volume') || '0.8'),
  isMuted: false,
  progress: 0,
  duration: 0,
  queue: [],
  queueSource: null,
  originalQueue: [],
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
    playTrack: (state, action: PayloadAction<{ track: PlayerTrack; queue?: PlayerTrack[]; source?: QueueSource }>) => {
      state.currentTrack = action.payload.track;
      state.isPlaying = true;
      state.progress = 0;
      state.playedIndexHistory = [];
      state.playedSongIds = [];
      state.originalQueue = [];
      rememberPlayedTrack(state, action.payload.track);

      if (action.payload.queue) {
        const incoming = action.payload.queue;
        const startIdx = Math.max(0, incoming.findIndex(
          t => t.song.id === action.payload.track.song.id &&
               t.upload?.id === action.payload.track.upload?.id
        ));
        state.queue = incoming;
        state.queueSource = action.payload.source || 'user';
        state.currentIndex = startIdx;
        if (state.isShuffle) applyShuffle(state);
      } else {
        const indexInQueue = state.queue.findIndex(
          t => t.song.id === action.payload.track.song.id &&
               t.upload?.id === action.payload.track.upload?.id
        );
        if (indexInQueue !== -1) {
          state.currentIndex = indexInQueue;
        } else {
          state.queue = [action.payload.track];
          state.queueSource = action.payload.source || 'user';
          state.currentIndex = 0;
        }
      }
    },
    loadQueue: (state, action: PayloadAction<{ queue: PlayerTrack[]; startIndex?: number; autoplay?: boolean; source?: QueueSource }>) => {
      const incoming = action.payload.queue;
      if (!incoming.length) return;

      const startIndex = Math.min(
        incoming.length - 1,
        Math.max(0, action.payload.startIndex || 0)
      );

      state.queue = incoming;
      state.queueSource = action.payload.source || 'user';
      state.currentIndex = startIndex;
      state.currentTrack = incoming[startIndex];
      state.progress = 0;
      state.duration = 0;
      state.playedIndexHistory = [];
      state.playedSongIds = [];
      state.originalQueue = [];
      state.isPlaying = Boolean(action.payload.autoplay);

      if (state.isShuffle) applyShuffle(state);
      if (state.isPlaying && state.currentTrack) rememberPlayedTrack(state, state.currentTrack);
    },
    pauseTrack: (state) => {
      state.isPlaying = false;
    },
    resumeTrack: (state) => {
      if (state.currentTrack) {
        state.isPlaying = true;
        rememberPlayedTrack(state, state.currentTrack);
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
      if (!state.queue.length) return;
      if (state.isShuffle) applyShuffle(state);
      else applyUnshuffle(state);
    },
    setShuffle: (state, action: PayloadAction<boolean>) => {
      if (state.isShuffle === action.payload) return;
      state.isShuffle = action.payload;
      if (!state.queue.length) return;
      if (state.isShuffle) applyShuffle(state);
      else applyUnshuffle(state);
    },
    toggleRepeat: (state) => {
      const modes: ('none' | 'one' | 'all')[] = ['none', 'all', 'one'];
      const currentIndex = modes.indexOf(state.isRepeat);
      state.isRepeat = modes[(currentIndex + 1) % modes.length];
    },
    nextTrack: (state) => {
      if (!state.queue.length) return;

      if (state.isRepeat === 'one') {
        state.progress = 0;
        return;
      }

      const oldIndex = state.currentIndex;
      let nextIndex = oldIndex + 1;

      if (nextIndex >= state.queue.length) {
        if (state.isRepeat === 'all') {
          nextIndex = 0;
        } else {
          state.isPlaying = false;
          state.progress = 0;
          return;
        }
      }

      state.playedIndexHistory = [...state.playedIndexHistory, oldIndex].slice(-50);
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
        state.queueSource = 'user';
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
      state.queueSource = 'user';
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
      state.queueSource = 'user';
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
          state.queueSource = null;
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
        state.queueSource = 'user';
        if (state.currentIndex === -1) {
          state.currentIndex = 0;
          state.currentTrack = action.payload;
        }
      }
    },
    clearQueue: (state) => {
      state.queue = [];
      state.queueSource = null;
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
  loadQueue,
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
