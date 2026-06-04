import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Shuffle, Repeat, Heart } from 'lucide-react';
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

export const PlayerBar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { currentTrack, isPlaying, volume, isMuted, progress, duration, isShuffle, isRepeat, queue } = useAppSelector(
    (state) => state.player
  );
  const { user } = useAppSelector((state) => state.auth);
  const { likedSongIds } = useAppSelector((state) => state.library);
  const [incrementPlay] = useIncrementPlayCountMutation();

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [sliderVal, setSliderVal] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioSource, setAudioSource] = useState<AudioSource>('none');

  const hasAudio = audioUrl !== '' && !loadError;

  // Resolve audio source when track changes
  useEffect(() => {
    let cancelled = false;

    setLoadError(false);
    setAudioUrl('');
    setAudioSource('none');

    if (!currentTrack) return;

    // Priority 1: Community upload
    if (currentTrack.upload?.audio_url) {
      const storagePath = getSongsStoragePathFromUrl(currentTrack.upload.audio_url);
      if (storagePath) {
        getSignedSongsUrl(storagePath).then(url => {
          if (cancelled) return;
          setAudioUrl(url || currentTrack.upload?.audio_url || '');
          setAudioSource('upload');
        });
        return () => { cancelled = true; };
      } else {
        setAudioUrl(currentTrack.upload.audio_url);
        setAudioSource('upload');
      }
      return;
    }

    const songPath = currentTrack.song.path;

    // Priority 2: API stream path — metadata and audio are from the same API song record
    const apiAudioUrl = getApiAudioUrl(songPath);
    if (apiAudioUrl) {
      setAudioUrl(apiAudioUrl);
      setAudioSource('api');
      return;
    }

    // No audio available
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

  // Play / Pause
  useEffect(() => {
    if (!audioRef.current || !audioUrl || loadError) return;
    if (isPlaying) {
      playAudio();
    } else {
      pauseAudio();
    }
  }, [isPlaying, audioUrl, loadError]);

  // Source change — load and auto-play when URL updates
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    console.log('[PlayerBar] Loading audio URL:', audioUrl);
    setLoadError(false);
    audioRef.current.load();
    dispatch(setDuration(0));
    dispatch(setProgress(0));
  }, [audioUrl]);

  // Volume / mute
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

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

  const handleEnded = () => dispatch(nextTrack());

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

  const handleNext = () => {
    dispatch(nextTrack());
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

  useEffect(() => {
    if (!isScrubbing) setSliderVal(progress);
  }, [progress, isScrubbing]);

  const progressPercent = duration > 0 ? (sliderVal / duration) * 100 : 0;

  if (!currentTrack) return null;
  const song = currentTrack.song;
  const isLiked = likedSongIds.includes(song.id);

  const displayImage = song.image_url
    ? (song.image_url.startsWith('http') ? song.image_url : `https://juicewrldapi.com${song.image_url}`)
    : null;

  const sourceLabel = loadError ? 'Error loading audio' : audioSource === 'upload' ? 'Community upload' : null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'var(--player-height)',
      background: 'rgba(13,13,20,0.92)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,85,0,0.75)',
      boxShadow: '0 -4px 40px rgba(0,0,0,0.6), 0 -1px 0 rgba(255,85,0,0.08)',
      display: 'grid',
      gridTemplateColumns: 'minmax(220px, 320px) 40px minmax(230px, 1fr) minmax(260px, 520px) minmax(110px, 160px)',
      alignItems: 'center',
      padding: '0 28px',
      gap: '18px',
      zIndex: 100,
    }}>
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
        onEnded={handleEnded}
        onError={() => {
          if (!audioUrl) return;
          setLoadError(true);
          setAudioSource('none');
          dispatch(pauseTrack());
        }}
      />

      {/* Left: Track Info */}
      <div
        onClick={() => navigate(`/song/${song.public_id || song.id}`)}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', minWidth: 0 }}
      >
        <div style={{ width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-card)', flexShrink: 0, boxShadow: '0 0 12px rgba(0,0,0,0.5)' }}>
          {displayImage
            ? <img src={displayImage} alt={song.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>JW</div>
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {song.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Juice WRLD</span>
            {sourceLabel && (
              <span style={{ fontSize: '9px', background: loadError ? '#fef2f2' : 'var(--accent-light)', color: loadError ? '#dc2626' : 'var(--accent)', padding: '1px 5px', borderRadius: '2px', fontWeight: 700, flexShrink: 0 }}>
                {sourceLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          if (user) dispatch(toggleLike(song.id, user.id));
        }}
        style={{
          width: '32px',
          height: '32px',
          border: 'none',
          background: 'transparent',
          color: isLiked ? '#ff4d6d' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        title={user ? (isLiked ? 'Remove from liked' : 'Like') : 'Sign in to like tracks'}
      >
        <Heart size={18} fill={isLiked ? '#ff4d6d' : 'none'} />
      </button>

      {/* Center: Controls + Scrubber */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '22px', minWidth: 0 }}>
          <button onClick={() => dispatch(toggleShuffle())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isShuffle ? 'var(--accent)' : 'var(--text-muted)', padding: '2px' }} title={isShuffle ? 'Shuffle on' : 'Shuffle off'}>
            <Shuffle size={15} />
          </button>
          <button onClick={handlePrevious} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '2px' }} title={progress > 3 ? 'Restart track' : 'Previous track'}>
            <SkipBack size={18} fill="var(--text-primary)" />
          </button>
          <button
            onClick={handlePlayPause}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: hasAudio ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
              border: 'none', cursor: hasAudio ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', flexShrink: 0,
              boxShadow: hasAudio ? '0 0 20px rgba(255,85,0,0.5), 0 0 40px rgba(255,85,0,0.2)' : 'none',
              animation: isPlaying && hasAudio ? 'glowPulse 2.5s infinite' : 'none',
              transition: 'all 0.15s',
            }}
            title={!hasAudio ? 'No audio available' : undefined}
          >
            {isPlaying
              ? <Pause size={18} fill="#fff" />
              : <Play size={18} fill="#fff" style={{ marginLeft: '2px' }} />
            }
          </button>
          <button
            onClick={handleNext}
            disabled={queue.length <= 1 && isRepeat !== 'all'}
            style={{
              background: 'none',
              border: 'none',
              cursor: queue.length <= 1 && isRepeat !== 'all' ? 'default' : 'pointer',
              color: queue.length <= 1 && isRepeat !== 'all' ? 'var(--text-muted)' : 'var(--text-primary)',
              opacity: queue.length <= 1 && isRepeat !== 'all' ? 0.45 : 1,
              padding: '2px',
            }}
            title={queue.length <= 1 ? 'Add more tracks to use next' : 'Next track'}
          >
            <SkipForward size={18} fill="currentColor" />
          </button>
          <button
            onClick={() => dispatch(toggleRepeat())}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isRepeat !== 'none' ? 'var(--accent)' : 'var(--text-muted)', padding: '2px', position: 'relative' }}
            title={`Repeat: ${isRepeat}`}
          >
            <Repeat size={15} />
            {isRepeat === 'one' && (
              <span style={{ position: 'absolute', top: '-3px', right: '-5px', fontSize: '7px', background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: '9px', height: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</span>
            )}
          </button>
      </div>

      {!hasAudio ? (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
          {audioSource === 'none'
            ? 'No audio available'
            : 'Audio unavailable'}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '34px', textAlign: 'right', flexShrink: 0 }}>{formatTime(sliderVal)}</span>
          <div style={{ flex: 1, position: 'relative', height: '3px', background: 'rgba(255,255,255,0.12)', borderRadius: '2px', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progressPercent}%`, background: 'var(--accent)', borderRadius: '2px', pointerEvents: 'none' }} />
            <input type="range" min={0} max={duration || 100} value={sliderVal}
              onChange={handleScrubChange} onMouseUp={handleScrubEnd} onTouchEnd={handleScrubEnd}
              style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%', margin: 0 }}
            />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '34px', flexShrink: 0 }}>{formatTime(duration)}</span>
        </div>
      )}

      {/* Right: Volume */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={() => dispatch(toggleMute())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}>
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <div style={{ position: 'relative', width: '86px', height: '3px', background: 'rgba(255,255,255,0.16)', borderRadius: '2px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(isMuted ? 0 : volume) * 100}%`, background: 'var(--text-secondary)', borderRadius: '2px', pointerEvents: 'none' }} />
          <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
            onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))}
            style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%', margin: 0 }}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
};
export default PlayerBar;
