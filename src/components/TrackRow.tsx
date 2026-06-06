import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, Download } from './AppIcon';
import type { Song, Upload } from '../types';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { playTrack, pauseTrack, resumeTrack } from '../features/player/playerSlice';
import { toggleLike } from '../features/library/librarySlice';
import { isAudioPath } from '../lib/audioStorage';
import { TrackActionMenu } from './TrackActionMenu';

interface TrackRowProps {
  song: Song;
  index: number;
  onOpenAuth: () => void;
  upload?: Upload;
  queue?: Song[];
}

const getDeterministicColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 50%, 35%)`;
};

export const TrackRow: React.FC<TrackRowProps> = ({ song, index, onOpenAuth, upload, queue }) => {
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
  const hasPlayableAudio = Boolean(upload?.audio_url || hasApiAudio);

  const displayImage = song.image_url
    ? (song.image_url.startsWith('http') ? song.image_url : `https://juicewrldapi.com${song.image_url}`)
    : null;
  const bgColor = getDeterministicColor(song.name);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      if (isPlaying) dispatch(pauseTrack());
      else dispatch(resumeTrack());
    } else {
      const q = queue ? queue.map(s => ({ song: s })) : [{ song, upload }];
      dispatch(playTrack({ track: { song, upload }, queue: q }));
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { onOpenAuth(); return; }
    dispatch(toggleLike(song.id, user.id));
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

  return (
    <div
      onClick={() => navigate(`/song/${song.public_id || song.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center',
        padding: '8px 14px', gap: '12px',
        borderRadius: '6px',
        background: hovered ? 'var(--bg-card-hover)' : 'transparent',
        boxShadow: isCurrent ? 'inset 0 0 0 1px rgba(255,85,0,0.2), inset 0 0 20px rgba(255,85,0,0.04)' : 'none',
        cursor: 'pointer', transition: 'all 0.15s ease',
      }}
    >
      {/* Index / Play */}
      <div style={{ width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {hovered || isCurrentlyPlaying || hasPlayableAudio ? (
          <button
            onClick={handlePlay}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: hasPlayableAudio ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', padding: 0,
              filter: hasPlayableAudio ? 'drop-shadow(0 0 6px rgba(255,85,0,0.6))' : 'none',
            }}
            title={upload?.audio_url ? 'Community upload' : undefined}
          >
            {isCurrentlyPlaying ? <Pause size={15} fill="var(--accent)" /> : <Play size={15} fill="var(--accent)" />}
          </button>
        ) : (
          <span style={{
            fontSize: '12px',
            color: isCurrent ? 'var(--accent)' : 'var(--text-muted)',
            textShadow: isCurrent ? '0 0 8px rgba(255,85,0,0.5)' : 'none',
          }}>
            {isCurrentlyPlaying ? (
              <span style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: '14px' }}>
                {[0, 0.2, 0.1].map((d, i) => (
                  <span key={i} style={{ display: 'block', width: '2.5px', background: 'var(--accent)', borderRadius: '1px', animation: `waveBar 0.8s ease-in-out ${d}s infinite` }} />
                ))}
              </span>
            ) : index + 1}
          </span>
        )}
      </div>

      {/* Thumbnail */}
      <div style={{
        width: '38px', height: '38px', borderRadius: '4px',
        overflow: 'hidden', background: bgColor, flexShrink: 0,
        boxShadow: isCurrent ? `0 0 12px ${bgColor}60` : 'none',
        transition: 'box-shadow 0.15s ease',
      }}>
        {displayImage ? (
          <img src={displayImage} alt={song.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
          }}>
            {song.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Title & artist */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13.5px', fontWeight: 500,
          color: isCurrent ? 'var(--accent)' : 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          textShadow: isCurrent ? '0 0 16px rgba(255,85,0,0.35)' : 'none',
        }}>
          {song.name}
          {upload && <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 400, marginLeft: '6px' }}>({upload.notes || 'CDQ'})</span>}
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
          {song.credited_artists || 'Juice WRLD'}
        </div>
      </div>

      {/* Era */}
      <div style={{ width: '130px', fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }} className="row-era">
        {song.era?.name || '—'}
      </div>

      {/* Category badge */}
      <div style={{ width: '90px', flexShrink: 0 }} className="row-cat">
        <span className={`badge ${getCategoryClass(song.category)}`}>
          {song.category === 'recording_session' ? 'Session' : song.category.charAt(0).toUpperCase() + song.category.slice(1)}
        </span>
      </div>

      {/* Duration */}
      <div style={{ width: '52px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
        {upload ? (upload.quality || 'MP3') : (song.length || '—')}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button
          onClick={handleLike}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            color: isLiked ? '#ff4d6d' : 'var(--text-muted)',
            display: hovered || isLiked ? 'flex' : 'none', alignItems: 'center',
            filter: isLiked ? 'drop-shadow(0 0 6px rgba(255,77,109,0.5))' : 'none',
            transition: 'all 0.12s ease',
          }}
        >
          <Heart size={14} fill={isLiked ? '#ff4d6d' : 'none'} />
        </button>
        {upload && (
          <a
            href={upload.audio_url} download={upload.file_name}
            style={{
              color: 'var(--text-muted)', display: hovered ? 'flex' : 'none',
              alignItems: 'center', padding: '4px',
            }}
          >
            <Download size={14} />
          </a>
        )}
        <TrackActionMenu
          song={song}
          upload={upload}
          visible={hovered}
          onOpenAuth={onOpenAuth}
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@media(max-width:768px){.row-era,.row-cat{display:none!important}}` }} />
    </div>
  );
};
export default TrackRow;
