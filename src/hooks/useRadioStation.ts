import { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '../app/hooks';
import { playTrack } from '../features/player/playerSlice';
import { isAudioPath } from '../lib/audioStorage';
import type { Song } from '../types';

const API_BASE_URL = 'https://juicewrldapi.com/juicewrld';
const CATALOG_PAGE_SIZE = 100;

let playableRadioCache: Song[] | null = null;

const shuffleSongs = (songs: Song[]) => [...songs].sort(() => Math.random() - 0.5);

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
  const response = await fetch(`${API_BASE_URL}/songs/?page=${page}&page_size=${CATALOG_PAGE_SIZE}`, { signal });
  if (!response.ok) throw new Error(`Radio catalog request failed: ${response.status}`);
  return response.json() as Promise<{ count: number; results: Song[] }>;
};

const fetchPlayableRadioPool = async (signal?: AbortSignal) => {
  if (playableRadioCache) return playableRadioCache;

  const firstPage = await fetchSongPage(1, signal);
  const totalPages = Math.ceil(firstPage.count / CATALOG_PAGE_SIZE);
  const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => index + 2);

  const remainingResults = await Promise.all(
    remainingPages.map(page => fetchSongPage(page, signal))
  );

  playableRadioCache = [
    ...firstPage.results,
    ...remainingResults.flatMap(page => page.results),
  ].filter(hasPlayableAudio);

  return playableRadioCache;
};

export const useRadioStation = () => {
  const dispatch = useAppDispatch();
  const abortRef = useRef<AbortController | null>(null);
  const [playableCount, setPlayableCount] = useState(playableRadioCache?.length || 0);
  const [isLoadingPool, setIsLoadingPool] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const queueSongs = (songs: Song[]) => {
    const uniqueSongs = uniqueSongsById(songs);
    const shuffledSongs = shuffleSongs(uniqueSongs);
    setPlayableCount(uniqueSongs.length);

    if (!shuffledSongs.length) {
      setError('No playable tracks were found in the API catalog.');
      return;
    }

    dispatch(playTrack({
      track: { song: shuffledSongs[0] },
      queue: shuffledSongs.map(song => ({ song })),
    }));
  };

  const startRadio = async () => {
    setError('');
    setIsLoadingPool(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const playableSongs = await fetchPlayableRadioPool(abortRef.current.signal);
      queueSongs(playableSongs);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Could not build the radio pool. Try again in a moment.');
    } finally {
      setIsLoadingPool(false);
    }
  };

  const reshuffleRadio = async () => {
    if (!playableRadioCache) {
      await startRadio();
      return;
    }

    queueSongs(playableRadioCache);
  };

  return {
    error,
    isLoadingPool,
    playableCount,
    reshuffleRadio,
    startRadio,
  };
};
