/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  ListMusic,
  MessageSquare,
  Pause,
  Play,
  Radio,
  RepeatAll,
  RepeatOne,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from './AppIcon';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  pauseTrack, resumeTrack, setProgress, setDuration,
  nextTrack, prevTrack, setVolume, toggleMute, toggleRepeat
} from '../features/player/playerSlice';
import { playQueueIndex, setShuffle } from '../features/player/playerSlice';
import { toggleLike } from '../features/library/librarySlice';
import { useRadioStation } from '../hooks/useRadioStation';
import { TrackActionMenu } from './TrackActionMenu';
import {
  getApiAudioUrl,
  getSongsStoragePathFromUrl,
  getSignedSongsUrl,
} from '../lib/audioStorage';
import {
  getLyricLinesForSong,
  hasSyncedLyricLines,
} from '../data/syncedLyrics';

type AudioSource = 'upload' | 'api' | 'none';
type RightRailMode = 'queue' | 'lyrics' | null;

interface PlayerBarProps {
  radioMode?: boolean;
  onOpenAuth: () => void;
}

const getImageUrl = (image?: string) => {
  if (!image) return null;
  return image.startsWith('http') ? image : `https://juicewrldapi.com${image}`;
};

const motionSurface = 'transition-[opacity,transform,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none';
const motionSoft = 'transition-[opacity,transform,box-shadow,background-color,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none';
const motionButton = 'transition-[opacity,transform,box-shadow,background-color,border-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100';
const radioEnter = 'animate-[radioPanelIn_520ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none';
const UI_PROGRESS_INTERVAL_MS = 250;
const STORE_PROGRESS_INTERVAL_MS = 1000;

export const PlayerBar: React.FC<PlayerBarProps> = ({ radioMode = false, onOpenAuth }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricScrollerRef = useRef<HTMLDivElement | null>(null);
  const lyricLineRefs = useRef<Record<number, HTMLParagraphElement | null>>({});
  const lastUiProgressAtRef = useRef(0);
  const lastStoreProgressAtRef = useRef(0);
  const lastStoreProgressValueRef = useRef(0);
  const progressDraggingRef = useRef(false);
  const volumeDraggingRef = useRef(false);
  const pendingVolumeRef = useRef<number | null>(null);
  const {
    error: radioError,
    isLoadingPool,
    startRadio,
  } = useRadioStation();

  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    progress,
    duration,
    isShuffle,
    isRepeat,
    queue,
    currentIndex,
    seekRequest,
  } = useAppSelector((state) => state.player);
  const { user } = useAppSelector((state) => state.auth);
  const { likedSongIds } = useAppSelector((state) => state.library);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const [sliderVal, setSliderVal] = useState(0);
  const [volumePreview, setVolumePreview] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioSource, setAudioSource] = useState<AudioSource>('none');
  const [rightRailMode, setRightRailMode] = useState<RightRailMode>('queue');

  const hasAudio = audioUrl !== '' && !loadError;
  const song = currentTrack?.song;
  const currentSongId = currentTrack?.song?.id;
  const currentSongPath = currentTrack?.song?.path;
  const currentUploadAudioUrl = currentTrack?.upload?.audio_url;
  const seekRequestId = seekRequest?.id;
  const seekRequestSongId = seekRequest?.songId;
  const seekRequestTime = seekRequest?.time;
  const isLiked = song ? likedSongIds.includes(song.id) : false;
  const displayImage = getImageUrl(song?.image_url);
  const panelStyle = radioMode && displayImage
    ? ({ '--radio-cover-bg': `url("${displayImage}")` } as React.CSSProperties)
    : undefined;
  const upcomingTracks = useMemo(() => {
    const queueItems = queue.map((track, index) => ({ track, index }));
    const songId = song?.id;

    if (radioMode) {
      return [
        ...queueItems.slice(currentIndex + 1),
        ...queueItems.slice(0, Math.max(0, currentIndex)),
      ].filter(({ track, index }) => index !== currentIndex && track.song.id !== songId);
    }

    return queueItems
      .filter(({ track, index }) => index !== currentIndex && track.song.id !== songId)
      .slice(0, 4);
  }, [currentIndex, queue, radioMode, song?.id]);
  const lyricDisplayLines = useMemo(() => getLyricLinesForSong(song), [song]);
  const lyricsAreSynced = useMemo(() => hasSyncedLyricLines(lyricDisplayLines), [lyricDisplayLines]);
  const stationButtonLabel = isLoadingPool ? 'Building Station' : 'Start Radio';
  const showRightRail = radioMode && rightRailMode;

  useEffect(() => {
    let cancelled = false;

    setLoadError(false);
    setAudioUrl('');
    setAudioSource('none');

    if (!currentSongId && !currentSongPath && !currentUploadAudioUrl) return;

    if (currentUploadAudioUrl) {
      const storagePath = getSongsStoragePathFromUrl(currentUploadAudioUrl);
      if (storagePath) {
        getSignedSongsUrl(storagePath).then(url => {
          if (cancelled) return;
          setAudioUrl(url || currentUploadAudioUrl);
          setAudioSource('upload');
        });
        return () => { cancelled = true; };
      }

      setAudioUrl(currentUploadAudioUrl);
      setAudioSource('upload');
      return;
    }

    const apiAudioUrl = getApiAudioUrl(currentSongPath);
    if (apiAudioUrl) {
      setAudioUrl(apiAudioUrl);
      setAudioSource('api');
      return;
    }

    setAudioSource('none');

    return () => { cancelled = true; };
  }, [
    currentSongId,
    currentSongPath,
    currentUploadAudioUrl,
  ]);

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || loadError) return;

    audio.play().catch((err) => {
      console.warn('[PlayerBar] play() failed:', err);
    });
  }, [audioUrl, loadError]);

  const pauseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
  }, []);

  useEffect(() => {
    if (!audioRef.current || !audioUrl || loadError) return;
    if (isPlaying) playAudio();
    else pauseAudio();
  }, [audioUrl, isPlaying, loadError, pauseAudio, playAudio]);

  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    setLoadError(false);
    audioRef.current.load();
    setSliderVal(0);
    lastUiProgressAtRef.current = 0;
    lastStoreProgressAtRef.current = 0;
    lastStoreProgressValueRef.current = 0;
    dispatch(setDuration(0));
    dispatch(setProgress(0));
  }, [audioUrl, dispatch]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    if (!isScrubbing) setSliderVal(progress);
  }, [progress, isScrubbing]);

  useEffect(() => {
    if (!seekRequestId || typeof seekRequestTime !== 'number' || !audioRef.current || !hasAudio) return;
    if (seekRequestSongId && seekRequestSongId !== song?.id) return;

    const expectedApiUrl = getApiAudioUrl(song?.path);
    if (seekRequestSongId && expectedApiUrl && audioUrl !== expectedApiUrl) return;

    const audio = audioRef.current;

    const applySeek = () => {
      const maxTime = Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : seekRequestTime;
      const nextTime = Math.min(maxTime, Math.max(0, seekRequestTime));

      audio.currentTime = nextTime;
      setSliderVal(nextTime);
      lastUiProgressAtRef.current = performance.now();
      lastStoreProgressAtRef.current = lastUiProgressAtRef.current;
      lastStoreProgressValueRef.current = nextTime;
      dispatch(setProgress(nextTime));

      if (isPlaying) {
        playAudio();
      }
    };

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      applySeek();
      return;
    }

    audio.addEventListener('loadedmetadata', applySeek, { once: true });
    return () => audio.removeEventListener('loadedmetadata', applySeek);
  }, [audioUrl, dispatch, hasAudio, isPlaying, playAudio, seekRequestId, seekRequestSongId, seekRequestTime, song?.id, song?.path]);

  const formatTime = (t: number) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || isScrubbing) return;
    const nextTime = audioRef.current.currentTime;
    const now = performance.now();

    if (now - lastUiProgressAtRef.current >= UI_PROGRESS_INTERVAL_MS) {
      lastUiProgressAtRef.current = now;
      setSliderVal(nextTime);
    }

    if (
      now - lastStoreProgressAtRef.current >= STORE_PROGRESS_INTERVAL_MS ||
      Math.abs(nextTime - lastStoreProgressValueRef.current) >= 1
    ) {
      lastStoreProgressAtRef.current = now;
      lastStoreProgressValueRef.current = nextTime;
      dispatch(setProgress(nextTime));
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    dispatch(setDuration(audioRef.current.duration));
  };

  const handlePlayPause = () => {
    if (!hasAudio) return;

    if (isPlaying) {
      pauseAudio();
      dispatch(pauseTrack());
      return;
    }

    dispatch(resumeTrack());
    playAudio();
  };

  const handleAudioEnded = () => {
    if (isRepeat === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      dispatch(setProgress(0));
      playAudio();
      return;
    }

    dispatch(nextTrack());
  };

  const handlePrevious = () => {
    const currentAudioTime = audioRef.current?.currentTime ?? progress;

    if (currentAudioTime >= 30 && audioRef.current) {
      audioRef.current.currentTime = 0;
      setSliderVal(0);
      lastUiProgressAtRef.current = 0;
      lastStoreProgressAtRef.current = 0;
      lastStoreProgressValueRef.current = 0;
      dispatch(setProgress(0));
      return;
    }

    dispatch(prevTrack());
  };

  const handleShuffle = () => {
    const nextShuffle = !isShuffle;
    dispatch(setShuffle(nextShuffle));

    if (radioMode && nextShuffle && queue.length < 100) {
      void startRadio();
    }
  };

  const commitProgressValue = (nextTime: number, syncStore = true) => {
    if (!audioRef.current || !duration || !hasAudio) return;
    const clampedTime = Math.min(duration, Math.max(0, nextTime));
    audioRef.current.currentTime = clampedTime;
    setSliderVal(clampedTime);
    lastUiProgressAtRef.current = performance.now();
    lastStoreProgressAtRef.current = lastUiProgressAtRef.current;
    lastStoreProgressValueRef.current = clampedTime;

    if (syncStore) {
      dispatch(setProgress(clampedTime));
    }
  };

  const getTrackValueFromClientX = (clientX: number, target: HTMLDivElement) => {
    if (!duration) return 0;
    const rect = target.getBoundingClientRect();
    if (!rect.width) return sliderVal;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  const handleProgressPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!hasAudio || !duration) return;
    event.preventDefault();
    progressDraggingRef.current = true;
    setIsScrubbing(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    commitProgressValue(getTrackValueFromClientX(event.clientX, event.currentTarget), false);
  };

  const handleProgressPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!progressDraggingRef.current || event.buttons !== 1) return;
    event.preventDefault();
    commitProgressValue(getTrackValueFromClientX(event.clientX, event.currentTarget), false);
  };

  const handleProgressPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!progressDraggingRef.current) return;
    event.preventDefault();
    progressDraggingRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    commitProgressValue(getTrackValueFromClientX(event.clientX, event.currentTarget), true);
    setIsScrubbing(false);
  };

  const handleProgressPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!progressDraggingRef.current) return;
    progressDraggingRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    commitProgressValue(sliderVal, true);
    setIsScrubbing(false);
  };

  const handleProgressKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || !hasAudio) return;
    const step = event.shiftKey ? 15 : 5;
    let nextTime = sliderVal;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') nextTime -= step;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nextTime += step;
    else if (event.key === 'Home') nextTime = 0;
    else if (event.key === 'End') nextTime = duration;
    else return;

    event.preventDefault();
    commitProgressValue(nextTime, true);
  };

  const progressPercent = duration > 0 ? Math.max(0, Math.min(100, (sliderVal / duration) * 100)) : 0;
  const volumeSliderValue = volumePreview ?? (isMuted ? 0 : volume);
  const volumePercent = Math.max(0, Math.min(100, volumeSliderValue * 100));
  const volumeButtonIsMuted = volumeSliderValue <= 0;
  const activeLyricLineIndex = useMemo(() => {
    if (!lyricDisplayLines.length || !lyricsAreSynced) return -1;

    const activeIndex = lyricDisplayLines.findLastIndex(line =>
      typeof line.time === 'number' && line.time <= sliderVal + 0.08
    );

    return activeIndex === -1 ? 0 : activeIndex;
  }, [lyricDisplayLines, lyricsAreSynced, sliderVal]);
  const queueRows = useMemo(() => upcomingTracks.map(({ track, index }) => {
    const image = getImageUrl(track.song.image_url);

    return (
      <div
        className={`queue-row group/queue ${motionSoft}`}
        key={`${index}-${track.song.id}-${track.upload?.id || 'api'}`}
        onClick={() => {
          if (radioMode) {
            dispatch(playQueueIndex(index));
            return;
          }

          navigate(`/song/${track.song.public_id || track.song.id}`);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          if (radioMode) dispatch(playQueueIndex(index));
          else navigate(`/song/${track.song.public_id || track.song.id}`);
        }}
        role="button"
        tabIndex={0}
      >
        <div className="queue-row-art">{image ? <img src={image} alt="" /> : <span>JW</span>}</div>
        <span className="queue-row-copy">
          <strong>{track.song.name}</strong>
          <small>{track.song.credited_artists || 'Juice WRLD'}</small>
        </span>
        <em>{track.song.length || '--:--'}</em>
        <TrackActionMenu
          song={track.song}
          track={track}
          queueIndex={index}
          variant="queue"
          visible={false}
          onOpenAuth={onOpenAuth}
        />
      </div>
    );
  }), [dispatch, navigate, onOpenAuth, radioMode, upcomingTracks]);

  useEffect(() => {
    if (rightRailMode !== 'lyrics' || !lyricsAreSynced || activeLyricLineIndex < 0) return;

    const scroller = lyricScrollerRef.current;
    const activeLine = lyricLineRefs.current[activeLyricLineIndex];
    if (!scroller || !activeLine) return;

    const targetTop = Math.max(0, activeLine.offsetTop - scroller.clientHeight * 0.42);
    scroller.scrollTo({
      top: targetTop,
      behavior: isPlaying ? 'smooth' : 'auto',
    });
  }, [activeLyricLineIndex, isPlaying, lyricsAreSynced, rightRailMode, song?.id]);

  const commitVolumeValue = (nextVolume: number, syncStore = true) => {
    const clampedVolume = Math.min(1, Math.max(0, nextVolume));
    pendingVolumeRef.current = clampedVolume;
    setVolumePreview(clampedVolume);

    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }

    if (syncStore) {
      dispatch(setVolume(clampedVolume));
      pendingVolumeRef.current = null;
      setVolumePreview(null);
    }
  };

  const getVolumeValueFromClientX = (clientX: number, target: HTMLDivElement) => {
    const rect = target.getBoundingClientRect();
    if (!rect.width) return volumeSliderValue;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const handleVolumePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    volumeDraggingRef.current = true;
    setIsVolumeDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    commitVolumeValue(getVolumeValueFromClientX(event.clientX, event.currentTarget), false);
  };

  const handleVolumePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!volumeDraggingRef.current || event.buttons !== 1) return;
    event.preventDefault();
    commitVolumeValue(getVolumeValueFromClientX(event.clientX, event.currentTarget), false);
  };

  const handleVolumePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!volumeDraggingRef.current) return;
    event.preventDefault();
    volumeDraggingRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    commitVolumeValue(getVolumeValueFromClientX(event.clientX, event.currentTarget), true);
    setIsVolumeDragging(false);
  };

  const handleVolumePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!volumeDraggingRef.current) return;
    volumeDraggingRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    commitVolumeValue(pendingVolumeRef.current ?? volumeSliderValue, true);
    setIsVolumeDragging(false);
  };

  const handleVolumeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.05;
    let nextVolume = volumeSliderValue;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') nextVolume -= step;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nextVolume += step;
    else if (event.key === 'Home') nextVolume = 0;
    else if (event.key === 'End') nextVolume = 1;
    else return;

    event.preventDefault();
    commitVolumeValue(nextVolume, true);
  };

  return (
    <aside
      className={`right-player-panel ${motionSurface}${radioMode ? ' radio-mode-player' : ''}${showRightRail ? '' : ' rail-collapsed'}${radioMode && rightRailMode === 'lyrics' ? ' lyrics-mode' : ''}`}
      style={panelStyle}
    >
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={() => {
          if (isPlaying) playAudio();
        }}
        onPlay={() => {
          if (!isPlaying) dispatch(resumeTrack());
        }}
        onEnded={handleAudioEnded}
        onError={() => {
          if (!audioUrl) return;
          setLoadError(true);
          setAudioSource('none');
          if (radioMode && queue.length > 1) {
            dispatch(nextTrack());
            return;
          }
          dispatch(pauseTrack());
        }}
      />

      <div className={`now-playing-card ${motionSurface}${radioMode ? ` ${radioEnter}` : ''}`}>
        {!radioMode && (
          <div className="right-player-header">
            <div>
              <div className="right-player-label">Now playing</div>
            </div>
          </div>
        )}

        {song ? (
          <>
            {radioMode ? (
              <div className={`right-player-art radio-static-art ${motionSoft} hover:scale-[1.015] motion-reduce:hover:scale-100`}>
                {displayImage ? <img src={displayImage} alt={song.name} /> : <span>JW</span>}
              </div>
            ) : (
              <button className={`right-player-art ${motionSoft} hover:scale-[1.015] motion-reduce:hover:scale-100`} onClick={() => navigate(`/song/${song.public_id || song.id}`)}>
                {displayImage ? <img src={displayImage} alt={song.name} /> : <span>JW</span>}
              </button>
            )}

            <div className={`right-player-meta ${motionSoft}`}>
              {radioMode ? (
                <div className="right-player-track-text">
                  <strong>{song.name}</strong>
                  <span>{song.credited_artists || 'Juice WRLD'}</span>
                </div>
              ) : (
                <>
                  <button onClick={() => navigate(`/song/${song.public_id || song.id}`)}>
                    <strong>{song.name}</strong>
                    <span>{song.credited_artists || 'Juice WRLD'}</span>
                  </button>
                  <button
                    className={`right-player-like ${isLiked ? 'active' : ''}`}
                    onClick={() => {
                      if (user) dispatch(toggleLike(song.id, user.id));
                    }}
                    title={user ? (isLiked ? 'Remove from liked' : 'Like') : 'Sign in to like tracks'}
                  >
                    <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                  </button>
                </>
              )}
            </div>

            {hasAudio ? (
              <div className="right-player-progress">
                <span>{formatTime(sliderVal)}</span>
                <div
                  className={`right-progress-track app-slider ${isScrubbing ? 'dragging' : ''}`}
                  role="slider"
                  tabIndex={0}
                  aria-label="Track progress"
                  aria-valuemin={0}
                  aria-valuemax={Math.round(duration || 0)}
                  aria-valuenow={Math.round(sliderVal || 0)}
                  aria-valuetext={`${formatTime(sliderVal)} of ${formatTime(duration)}`}
                  onPointerDown={handleProgressPointerDown}
                  onPointerMove={handleProgressPointerMove}
                  onPointerUp={handleProgressPointerUp}
                  onPointerCancel={handleProgressPointerCancel}
                  onKeyDown={handleProgressKeyDown}
                >
                  <b className="slider-fill" style={{ width: `${progressPercent}%` }} />
                  <i className="slider-thumb" style={{ left: `${progressPercent}%` }} />
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            ) : (
              <div className="right-player-empty-state">
                {audioSource === 'none' ? 'No audio available for this track.' : 'Audio unavailable.'}
              </div>
            )}

            <div className="right-player-controls">
              <button
                onClick={handleShuffle}
                className={`${motionButton} ${isShuffle ? 'active' : ''}`}
                title={isShuffle ? 'Shuffle on' : 'Shuffle off'}
              >
                <Shuffle size={17} />
              </button>
              <button className={motionButton} onClick={handlePrevious} title={sliderVal >= 30 ? 'Restart track' : 'Previous track'}>
                <SkipBack size={22} fill="currentColor" />
              </button>
              <button onClick={handlePlayPause} className={`right-player-play ${motionButton}`} disabled={!hasAudio} title={!hasAudio ? 'No audio available' : undefined}>
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
              <button className={motionButton} onClick={() => dispatch(nextTrack())} disabled={queue.length <= 1 && isRepeat !== 'all'} title="Next track">
                <SkipForward size={22} fill="currentColor" />
              </button>
              <button
                onClick={() => dispatch(toggleRepeat())}
                className={`${motionButton} ${isRepeat !== 'none' ? 'active' : ''}`}
                title={isRepeat === 'one' ? 'Repeat one' : isRepeat === 'all' ? 'Repeat all' : 'Repeat off'}
              >
                {isRepeat === 'one' ? <RepeatOne size={19} /> : <RepeatAll size={18} />}
              </button>
            </div>

            <div className="right-player-volume">
              <button className={motionButton} onClick={() => dispatch(toggleMute())} title={volumeButtonIsMuted ? 'Unmute' : 'Mute'}>
                {volumeButtonIsMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <div
                className={`right-volume-track app-slider ${isVolumeDragging ? 'dragging' : ''}`}
                role="slider"
                tabIndex={0}
                aria-label="Volume"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(volumePercent)}
                aria-valuetext={`${Math.round(volumePercent)}%`}
                onPointerDown={handleVolumePointerDown}
                onPointerMove={handleVolumePointerMove}
                onPointerUp={handleVolumePointerUp}
                onPointerCancel={handleVolumePointerCancel}
                onKeyDown={handleVolumeKeyDown}
              >
                <b className="slider-fill" style={{ width: `${volumePercent}%` }} />
                <i className="slider-thumb" style={{ left: `${volumePercent}%` }} />
              </div>
            </div>

          </>
        ) : radioMode ? (
          <div className={`right-player-placeholder radio-player-placeholder ${motionSurface} ${radioEnter}`}>
            <div className={`right-player-placeholder-art ${motionSoft}`}>DR</div>
            <button onClick={startRadio} disabled={isLoadingPool} className={`btn btn-primary radio-start-main ${motionButton}`}>
              <Radio size={16} /> {stationButtonLabel}
            </button>
            {radioError && <small>{radioError}</small>}
          </div>
        ) : (
          <div className={`right-player-placeholder ${motionSurface}`}>
            <div className={`right-player-placeholder-art ${motionSoft}`}>DR</div>
            <strong>No track selected.</strong>
            <span>Start your session by selecting a track from the vault, or tune into the radio.</span>
          </div>
        )}
      </div>

      {radioMode && !rightRailMode && (
        <div className="player-rail-dock" aria-label="Player side panel">
          <button
            type="button"
            onClick={() => setRightRailMode('queue')}
            title="Show queue"
          >
            <ListMusic size={17} />
          </button>
          <button
            type="button"
            onClick={() => setRightRailMode('lyrics')}
            title="Show lyrics"
          >
            <MessageSquare size={17} />
          </button>
        </div>
      )}

      {radioMode && rightRailMode && (
      <div className={`queue-card custom-scroll ${motionSurface}${radioMode ? ` ${radioEnter}` : ''}`}>
        <div className="queue-card-header">
          <span>{rightRailMode === 'lyrics' ? 'Lyrics' : 'Up next'}</span>
          <div className="queue-view-toggle" aria-label="Player side panel">
            <button
              type="button"
              className={rightRailMode === 'queue' ? 'active' : ''}
              onClick={() => setRightRailMode(rightRailMode === 'queue' ? null : 'queue')}
              aria-pressed={rightRailMode === 'queue'}
              title={rightRailMode === 'queue' ? 'Hide queue' : 'Show queue'}
            >
              <ListMusic size={17} />
            </button>
            <button
              type="button"
              className={rightRailMode === 'lyrics' ? 'active' : ''}
              onClick={() => setRightRailMode('lyrics')}
              aria-pressed={rightRailMode === 'lyrics'}
              title="Show lyrics"
            >
              <MessageSquare size={17} />
            </button>
          </div>
        </div>

        {rightRailMode === 'lyrics' ? (
          <div
            ref={lyricScrollerRef}
            className={`lyrics-full-view ${song?.lyrics ? `has-lyrics apple-lyrics ${lyricsAreSynced ? 'synced' : 'unsynced'}` : ''}`}
            key={song?.id || 'empty-lyrics'}
          >
            {song?.lyrics ? (
              <div
                className="lyrics-live-stage"
                aria-label={`Lyrics for ${song.name}`}
              >
                <div className="lyrics-lines">
                  {lyricDisplayLines.map((line, index) => {
                    const distance = activeLyricLineIndex < 0 ? 0 : Math.abs(index - activeLyricLineIndex);
                    const stateClass = !lyricsAreSynced
                      ? 'unsynced-line'
                      : index === activeLyricLineIndex
                        ? 'active'
                        : index < activeLyricLineIndex
                          ? 'past'
                          : 'future';

                    return (
                      <p
                        key={`${index}-${line.time ?? 'plain'}-${line.text}`}
                        ref={(element) => {
                          lyricLineRefs.current[index] = element;
                        }}
                        className={`lyrics-line ${stateClass} ${typeof line.time === 'number' ? 'timed' : ''} distance-${Math.min(distance, 4)}`}
                        aria-current={lyricsAreSynced && index === activeLyricLineIndex ? 'true' : undefined}
                        style={{
                          '--line-index': Math.min(index, 14),
                          '--line-distance': Math.min(distance, 4),
                        } as React.CSSProperties}
                      >
                        {line.text}
                      </p>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="rail-empty-message">No lyrics available for this track.</p>
            )}
          </div>
        ) : (
        <div className="queue-list">
          {queueRows.length > 0 ? queueRows : (
            <p className="rail-empty-message">Queue is empty.</p>
          )}
        </div>
        )}
      </div>
      )}
    </aside>
  );
};

export default PlayerBar;
