import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Heart } from './AppIcon';
import type { Song } from '../types';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { playTrack, pauseTrack, resumeTrack } from '../features/player/playerSlice';
import { toggleLike } from '../features/library/librarySlice';
import { isAudioPath } from '../lib/audioStorage';

interface TrackCardProps {
  song: Song;
  onOpenAuth: () => void;
  queue?: Song[];
}

const getDeterministicColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 55%, 28%)`;
};

const getCategoryClass = (cat: string) => {
  switch (cat.toLowerCase()) {
    case 'released': return 'badge-released';
    case 'unreleased': return 'badge-unreleased';
    case 'unsurfaced': return 'badge-unsurfaced';
    case 'recording_session': return 'badge-session';
    default: return 'badge-unreleased';
  }
};

export const TrackCard: React.FC<TrackCardProps> = ({ song, onOpenAuth, queue }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [hovered, setHovered] = useState(false);

  const { user } = useAppSelector(s => s.auth);
  const { likedSongIds } = useAppSelector(s => s.library);
  const { currentTrack, isPlaying } = useAppSelector(s => s.player);

  const isLiked = likedSongIds.includes(song.id);
  const isCurrent = currentTrack?.song?.id === song.id;
  const isCurrentlyPlaying = isCurrent && isPlaying;
  const hasApiAudio = isAudioPath(song.path);
  const hasPlayableAudio = hasApiAudio;

  const displayImage = song.image_url
    ? (song.image_url.startsWith('http') ? song.image_url : `https://juicewrldapi.com${song.image_url}`)
    : null;
  const bgColor = getDeterministicColor(song.name);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasPlayableAudio) return;
    if (isCurrent) {
      if (isPlaying) dispatch(pauseTrack());
      else dispatch(resumeTrack());
    } else {
      const q = queue ? queue.map(s => ({ song: s })) : [{ song }];
      dispatch(playTrack({ track: { song }, queue: q }));
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { onOpenAuth(); return; }
    dispatch(toggleLike(song.id, user.id));
  };

  const openSong = () => navigate(`/song/${song.public_id || song.id}`);

  return (
    <div
      onClick={openSong}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setHovered(false);
        }
      }}
      style={{
        cursor: 'pointer',
        borderRadius: '10px',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        transition: 'all 0.22s ease',
        outline: 'none',
        boxShadow: hovered
          ? 'var(--glow-card-hover)'
          : 'var(--glow-card)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        padding: '12px',
      }}
    >
      {/* Album Art */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1',
        borderRadius: '6px',
        overflow: 'hidden',
        background: bgColor,
        marginBottom: '12px',
        boxShadow: hovered
          ? `0 8px 18px rgba(0,0,0,0.42), 0 0 10px ${bgColor.replace('hsl', 'hsla').replace(')', ', 0.14)')}`
          : '0 4px 12px rgba(0,0,0,0.38)',
        transition: 'box-shadow 0.22s ease',
      }}>
        {displayImage ? (
          <img src={displayImage} alt={song.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontWeight: 700,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: 0,
          }}>
            {song.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }} />

        {/* Play button */}
        {(hovered || isCurrentlyPlaying || hasPlayableAudio) && (
          <button
            onClick={handlePlay}
            disabled={!hasPlayableAudio}
            aria-label={isCurrentlyPlaying ? `Pause ${song.name}` : `Play ${song.name}`}
            title={hasPlayableAudio ? `Play ${song.name}` : 'No audio available'}
            style={{
              position: 'absolute', bottom: '10px', right: '10px',
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'var(--accent)', border: 'none', cursor: hasPlayableAudio ? 'pointer' : 'not-allowed',
              opacity: hasPlayableAudio ? 1 : 0.55,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 6px 14px rgba(var(--accent-rgb),0.24), 0 3px 10px rgba(0,0,0,0.32)',
              transition: 'transform 0.12s ease',
              animation: isCurrentlyPlaying ? 'glowPulse 2s infinite' : 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isCurrentlyPlaying
              ? <Pause size={16} fill="#fff" />
              : <Play size={16} fill="#fff" style={{ marginLeft: '2px' }} />
            }
          </button>
        )}

        {/* Like button */}
        {(hovered || isLiked) && (
          <button
            onClick={handleLike}
            aria-label={isLiked ? `Remove ${song.name} from liked tracks` : `Like ${song.name}`}
            title={isLiked ? 'Remove from liked tracks' : 'Like track'}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%', width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: isLiked ? 'var(--accent-liked)' : 'rgba(255,255,255,0.7)',
              transition: 'all 0.12s ease',
            }}
          >
            <Heart size={13} fill={isLiked ? 'var(--accent-liked)' : 'none'} />
          </button>
        )}

        {/* Now playing indicator */}
        {isCurrentlyPlaying && (
          <div style={{
            position: 'absolute', top: '8px', left: '8px',
            display: 'flex', alignItems: 'flex-end', gap: '2px', height: '16px',
          }}>
            {[0, 0.2, 0.1].map((delay, i) => (
              <div key={i} style={{
                width: '3px', background: 'var(--accent)',
                borderRadius: '2px',
                boxShadow: '0 0 3px rgba(var(--accent-rgb),0.32)',
                animation: `waveBar 0.8s ease-in-out ${delay}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openSong();
          }}
          aria-label={`Open ${song.name}`}
          style={{
            display: 'block',
            width: '100%',
            background: 'none',
            border: 0,
            padding: 0,
            margin: '0 0 4px',
            textAlign: 'left',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: '13px', fontWeight: 600,
            color: isCurrent ? 'var(--accent)' : 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            textShadow: 'none',
          }}
          title={song.name}
        >
          {song.name}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {song.era?.name || 'Unknown Era'}
          </span>
          <span className={`badge ${getCategoryClass(song.category)}`}>
            {song.category === 'recording_session' ? 'Session' : song.category.charAt(0).toUpperCase() + song.category.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
};
export default TrackCard;
