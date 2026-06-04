import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Shuffle, Repeat, Heart, ListMusic } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  pauseTrack, resumeTrack, setProgress, setDuration,
  nextTrack, prevTrack, setVolume, toggleMute, toggleShuffle, toggleRepeat
} from '../features/player/playerSlice';
import { toggleLike } from '../features/library/librarySlice';
import { useIncrementPlayCountMutation } from '../services/uploadsApi';
import {
  getApiAudioUrl,
  getSongsStoragePathFromUrl,
  getSignedSongsUrl,
} from '../lib/audioStorage';

type AudioSource = 'upload' | 'api' | 'none';

const getImageUrl = (image?: string) => {
  if (!image) return null;
  return image.startsWith('http') ? image : `https://juicewrldapi.com${image}`;
};

export const PlayerBar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  } = useAppSelector((state) => state.player);
  const { user } = useAppSelector((state) => state.auth);
  const { likedSongIds } = useAppSelector((state) => state.library);
  const [incrementPlay] = useIncrementPlayCountMutation();

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [sliderVal, setSliderVal] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioSource, setAudioSource] = useState<AudioSource>('none');

  const hasAudio = audioUrl !== '' && !loadError;
  const song = currentTrack?.song;
  const isLiked = song ? likedSongIds.includes(song.id) : false;
  const displayImage = getImageUrl(song?.image_url);
  const upcomingTracks = queue
    .filter((track, index) => index !== currentIndex && track.song.id !== song?.id)
    .slice(0, 4);

  useEffect(() => {
    let cancelled = false;

    setLoadError(false);
    setAudioUrl('');
    setAudioSource('none');

    if (!currentTrack) return;

    if (currentTrack.upload?.audio_url) {
      const storagePath = getSongsStoragePathFromUrl(currentTrack.upload.audio_url);
      if (storagePath) {
        getSignedSongsUrl(storagePath).then(url => {
          if (cancelled) return;
          setAudioUrl(url || currentTrack.upload?.audio_url || '');
          setAudioSource('upload');
        });
        return () => { cancelled = true; };
      }

      setAudioUrl(currentTrack.upload.audio_url);
      setAudioSource('upload');
      return;
    }

    const apiAudioUrl = getApiAudioUrl(currentTrack.song.path);
    if (apiAudioUrl) {
      setAudioUrl(apiAudioUrl);
      setAudioSource('api');
      return;
    }

    setAudioSource('none');

    return () => { cancelled = true; };
  }, [
    currentTrack?.song?.id,
    currentTrack?.song?.name,
    currentTrack?.song?.path,
    currentTrack?.upload?.audio_url,
  ]);

  const playAudio = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || loadError) return;

    audio.play().catch((err) => {
      console.warn('[PlayerBar] play() failed:', err);
    });
  };

  const pauseAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
  };

  useEffect(() => {
    if (!audioRef.current || !audioUrl || loadError) return;
    if (isPlaying) playAudio();
    else pauseAudio();
  }, [isPlaying, audioUrl, loadError]);

  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    setLoadError(false);
    audioRef.current.load();
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

  const formatTime = (t: number) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || isScrubbing) return;
    dispatch(setProgress(audioRef.current.currentTime));
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    dispatch(setDuration(audioRef.current.duration));
    if (currentTrack?.upload?.id) incrementPlay(currentTrack.upload.id);
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

  const handlePrevious = () => {
    if (progress > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      dispatch(setProgress(0));
      return;
    }

    dispatch(prevTrack());
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderVal(parseFloat(e.target.value));
    setIsScrubbing(true);
  };

  const handleScrubEnd = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = sliderVal;
    dispatch(setProgress(sliderVal));
    setIsScrubbing(false);
  };

  const progressPercent = duration > 0 ? (sliderVal / duration) * 100 : 0;
  const activeWaveBars = Math.round((progressPercent / 100) * 44);

  const seekToClientX = (clientX: number, target: HTMLDivElement) => {
    if (!audioRef.current || !duration || !hasAudio) return;
    const rect = target.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const nextTime = ratio * duration;
    audioRef.current.currentTime = nextTime;
    setSliderVal(nextTime);
    dispatch(setProgress(nextTime));
  };

  const handleWavePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!hasAudio || !duration) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    seekToClientX(event.clientX, event.currentTarget);
  };

  const handleWavePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.buttons !== 1) return;
    seekToClientX(event.clientX, event.currentTarget);
  };

  const handleWaveKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || !hasAudio) return;
    const step = event.shiftKey ? 15 : 5;
    let nextTime = audioRef.current.currentTime;

    if (event.key === 'ArrowLeft') nextTime -= step;
    else if (event.key === 'ArrowRight') nextTime += step;
    else if (event.key === 'Home') nextTime = 0;
    else if (event.key === 'End') nextTime = duration;
    else return;

    event.preventDefault();
    nextTime = Math.min(duration, Math.max(0, nextTime));
    audioRef.current.currentTime = nextTime;
    setSliderVal(nextTime);
    dispatch(setProgress(nextTime));
  };

  return (
    <aside className="right-player-panel">
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
        onEnded={() => dispatch(nextTrack())}
        onError={() => {
          if (!audioUrl) return;
          setLoadError(true);
          setAudioSource('none');
          dispatch(pauseTrack());
        }}
      />

      <div className="now-playing-card">
        <div className="right-player-label">Now playing</div>

        {song ? (
          <>
            <button className="right-player-art" onClick={() => navigate(`/song/${song.public_id || song.id}`)}>
              {displayImage ? <img src={displayImage} alt={song.name} /> : <span>JW</span>}
            </button>

            <div className="right-player-meta">
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
            </div>

            <div
              className={`audio-wave ${hasAudio ? 'interactive' : 'disabled'}`}
              role="slider"
              tabIndex={hasAudio ? 0 : -1}
              aria-label="Seek track"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration || 0)}
              aria-valuenow={Math.round(sliderVal || 0)}
              aria-disabled={!hasAudio}
              onPointerDown={handleWavePointerDown}
              onPointerMove={handleWavePointerMove}
              onKeyDown={handleWaveKeyDown}
            >
              {Array.from({ length: 44 }, (_, index) => {
                const isHot = index < activeWaveBars;
                const isCurrent = isHot && index === Math.max(0, activeWaveBars - 1);
                return (
                  <span
                    key={index}
                    style={{ height: `${18 + ((index * 13) % 34)}px` }}
                    className={`${isHot ? 'hot' : ''} ${isCurrent ? 'current' : ''}`}
                  />
                );
              })}
            </div>

            {hasAudio ? (
              <div className="right-player-progress">
                <span>{formatTime(sliderVal)}</span>
                <div className="right-progress-track">
                  <div style={{ width: `${progressPercent}%` }} />
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={sliderVal}
                    onChange={handleScrubChange}
                    onMouseUp={handleScrubEnd}
                    onTouchEnd={handleScrubEnd}
                    aria-label="Track progress"
                  />
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            ) : (
              <div className="right-player-empty-state">
                {audioSource === 'none' ? 'No audio available for this track.' : 'Audio unavailable.'}
              </div>
            )}

            <div className="right-player-controls">
              <button onClick={() => dispatch(toggleShuffle())} className={isShuffle ? 'active' : ''} title="Shuffle">
                <Shuffle size={17} />
              </button>
              <button onClick={handlePrevious} title={progress > 3 ? 'Restart track' : 'Previous track'}>
                <SkipBack size={22} fill="currentColor" />
              </button>
              <button onClick={handlePlayPause} className="right-player-play" disabled={!hasAudio} title={!hasAudio ? 'No audio available' : undefined}>
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
              <button onClick={() => dispatch(nextTrack())} disabled={queue.length <= 1 && isRepeat !== 'all'} title="Next track">
                <SkipForward size={22} fill="currentColor" />
              </button>
              <button onClick={() => dispatch(toggleRepeat())} className={isRepeat !== 'none' ? 'active' : ''} title={`Repeat: ${isRepeat}`}>
                <Repeat size={17} />
              </button>
            </div>

            <div className="right-player-volume">
              <button onClick={() => dispatch(toggleMute())} title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <div>
                <span style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))}
                  aria-label="Volume"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="right-player-placeholder">
            <div className="right-player-placeholder-art">DR</div>
            <strong>Nothing playing</strong>
            <span>Pick a track from the vault to start the session.</span>
          </div>
        )}
      </div>

      <div className="queue-card">
        <div className="queue-card-header">
          <span>Up next</span>
          <ListMusic size={16} />
        </div>

        {upcomingTracks.length > 0 ? upcomingTracks.map((track) => {
          const image = getImageUrl(track.song.image_url);
          return (
            <button key={`${track.song.id}-${track.upload?.id || 'api'}`} onClick={() => navigate(`/song/${track.song.public_id || track.song.id}`)}>
              <div>{image ? <img src={image} alt="" /> : <span>JW</span>}</div>
              <span>
                <strong>{track.song.name}</strong>
                <small>{track.song.credited_artists || 'Juice WRLD'}</small>
              </span>
              <em>{track.song.length || '--:--'}</em>
            </button>
          );
        }) : (
          <p>Queue tracks from an era or search result to fill this list.</p>
        )}
      </div>
    </aside>
  );
};

export default PlayerBar;

