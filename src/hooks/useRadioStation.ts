import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { loadQueue } from '../features/player/playerSlice';
import { isAudioPath } from '../lib/audioStorage';
import type { Song } from '../types';

const API_BASE_URL = 'https://juicewrldapi.com/juicewrld';
const RADIO_PLAYLIST_SIZE = 120;
const RADIO_FALLBACK_PAGE_LIMIT = 3;

let playableRadioCache: Song[] | null = null;

interface RadioStationOptions {
  autoLoad?: boolean;
}

const uniqueSongsById = (songs: Song[]) => {
  const seen = new Set<number>();
  return songs.filter(song => {
    if (seen.has(song.id)) return false;
    seen.add(song.id);
    return true;
  });
};

const hasPlayableAudio = (song: Song) => {
  const audioFlags = song as Song & {
    audio_available?: boolean;
    has_audio?: boolean;
    audioAvailable?: boolean;
  };
  const markedUnavailable =
    audioFlags.audio_available === false ||
    audioFlags.has_audio === false ||
    audioFlags.audioAvailable === false;

  return !markedUnavailable && isAudioPath(song.path);
};

const fetchSongPage = async (page: number, signal?: AbortSignal) => {
  const response = await fetch(`${API_BASE_URL}/songs/?page=${page}&page_size=${RADIO_PLAYLIST_SIZE}`, { signal });
  if (!response.ok) throw new Error(`Radio catalog request failed: ${response.status}`);
  return response.json() as Promise<{ count: number; results: Song[] }>;
};

const fetchPlayableRadioPool = async (signal?: AbortSignal) => {
  if (playableRadioCache) return playableRadioCache;

  for (let page = 1; page <= RADIO_FALLBACK_PAGE_LIMIT; page += 1) {
    const songPage = await fetchSongPage(page, signal);
    const playableSongs = songPage.results.filter(hasPlayableAudio);

    if (playableSongs.length || page * RADIO_PLAYLIST_SIZE >= songPage.count) {
      playableRadioCache = playableSongs;
      break;
    }
  }

  playableRadioCache ||= [];
  return playableRadioCache;
};

export const useRadioStation = (options: RadioStationOptions = {}) => {
  const dispatch = useAppDispatch();
  const queueSource = useAppSelector(state => state.player.queueSource);
  const abortRef = useRef<AbortController | null>(null);
  const [playableCount, setPlayableCount] = useState(playableRadioCache?.length || 0);
  const [isLoadingPool, setIsLoadingPool] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const queueSongs = useCallback((songs: Song[], autoplay: boolean) => {
    const uniqueSongs = uniqueSongsById(songs);
    setPlayableCount(uniqueSongs.length);

    if (!uniqueSongs.length) {
      setError('No playable tracks were found in the API catalog.');
      return;
    }

    dispatch(loadQueue({
      queue: uniqueSongs.map(song => ({ song })),
      source: 'radio',
      autoplay,
    }));
  }, [dispatch]);

  const loadStation = useCallback(async (autoplay: boolean, force = false) => {
    if (!force && queueSource === 'radio' && playableRadioCache) {
      setPlayableCount(playableRadioCache.length);
      setError('');
      return;
    }

    setError('');
    setIsLoadingPool(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const playableSongs = await fetchPlayableRadioPool(abortRef.current.signal);
      queueSongs(playableSongs, autoplay);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Could not load the radio playlist. Try again in a moment.');
    } finally {
      setIsLoadingPool(false);
    }
  }, [queueSongs, queueSource]);

  useEffect(() => {
    if (!options.autoLoad) return;

    if (queueSource === 'radio') return;

    const loadTimeout = window.setTimeout(() => {
      void loadStation(false);
    }, 0);

    return () => window.clearTimeout(loadTimeout);
  }, [loadStation, options.autoLoad, queueSource]);

  const startRadio = () => loadStation(true, true);

  const reshuffleRadio = async () => {
    if (!playableRadioCache) {
      await startRadio();
      return;
    }

    queueSongs(playableRadioCache, true);
  };

  return {
    error,
    isLoadingPool,
    playableCount,
    reshuffleRadio,
    startRadio,
  };
};
