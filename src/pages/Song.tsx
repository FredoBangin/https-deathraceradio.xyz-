import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetSongByIdQuery } from '../services/juicewrldApi';
import { TrackComments } from '../components/TrackComments';
import { LyricsDrawer } from '../components/LyricsDrawer';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { playTrack } from '../features/player/playerSlice';
import { toggleLike } from '../features/library/librarySlice';
import { Play, Heart, FileText, ArrowLeft, Calendar, Disc, MapPin, Key, Radio, Music } from '../components/AppIcon';
import { isAudioPath } from '../lib/audioStorage';

interface SongPageProps {
  onOpenAuth: () => void;
}

const getDeterministicColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 50%, 25%)`;
};

export const SongPage: React.FC<SongPageProps> = ({ onOpenAuth }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [lyricsOpen, setLyricsOpen] = useState(false);

  const { user } = useAppSelector((state) => state.auth);
  const { likedSongIds } = useAppSelector((state) => state.library);

  const { data: song, isLoading: songLoading, error: songError } = useGetSongByIdQuery(id || '');

  const isLiked = song ? likedSongIds.includes(song.id) : false;
  const hasApiAudio = isAudioPath(song?.path);

  const handlePlayDefault = () => {
    if (!song) return;
    dispatch(playTrack({ track: { song } }));
  };

  const handleLike = () => {
    if (!song) return;
    if (!user) { onOpenAuth(); return; }
    dispatch(toggleLike(song.id, user.id));
  };

  if (songLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px', color: 'var(--text-secondary)' }}>
        <div style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Loading...
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  if (songError || !song) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent)', marginBottom: '8px' }}>Track Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          This track could not be loaded. The ID may be invalid.
        </p>
        <button onClick={() => navigate('/eras')} className="btn btn-secondary">
          <ArrowLeft size={15} />
          Back to Vault
        </button>
      </div>
    );
  }

  const displayImage = song.image_url
    ? (song.image_url.startsWith('http') ? song.image_url : `https://juicewrldapi.com${song.image_url}`)
    : null;

  const bgColor = getDeterministicColor(song.name);

  const getCategoryClass = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'released': return 'badge-released';
      case 'unreleased': return 'badge-unreleased';
      case 'unsurfaced': return 'badge-unsurfaced';
      case 'recording_session': return 'badge-session';
      default: return 'badge-unreleased';
    }
  };

  const metaItems = [
    { label: 'Category', value: song.category.charAt(0).toUpperCase() + song.category.slice(1).replace('_', ' '), icon: Radio },
    { label: 'Era', value: song.era?.name, icon: Calendar },
    { label: 'Credited Artists', value: song.credited_artists, icon: Music },
    { label: 'Producers', value: song.producers, icon: Disc },
    { label: 'Recording Locations', value: song.recording_locations, icon: MapPin },
    { label: 'Key / Scale', value: song.original_key, icon: Key },
    { label: 'Bitrate', value: song.bitrate, icon: Disc },
    { label: 'Record Date', value: song.record_dates, icon: Calendar },
  ].filter(item => item.value);

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="btn btn-text"
        style={{ marginBottom: '20px', padding: '4px 0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
      >
        <ArrowLeft size={15} />
        Back
      </button>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '32px', marginBottom: '32px', alignItems: 'start' }} className="song-detail-grid">
        {/* Cover Art */}
        <div>
          <div style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: '6px',
            overflow: 'hidden',
            background: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            {displayImage ? (
              <img src={displayImage} alt={song.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '40px', fontWeight: 700, color: 'rgba(0,0,0,0.2)' }}>JW</span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handlePlayDefault}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              title={!hasApiAudio ? 'No audio path found yet' : undefined}
            >
              <Play size={15} fill="#fff" />
              Play
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={handleLike}
                className="btn btn-secondary"
                style={{
                  justifyContent: 'center',
                  color: isLiked ? 'var(--accent-liked)' : undefined,
                  borderColor: isLiked ? 'var(--accent-liked)' : undefined,
                  boxShadow: isLiked ? '0 0 6px rgba(var(--accent-rgb),0.14)' : 'none',
                }}
              >
                <Heart size={14} fill={isLiked ? 'var(--accent-liked)' : 'none'} />
                {isLiked ? 'Liked' : 'Like'}
              </button>
              <button
                onClick={() => setLyricsOpen(true)}
                className="btn btn-secondary"
                style={{ justifyContent: 'center' }}
                disabled={!song.lyrics}
                title={!song.lyrics ? 'No lyrics available' : undefined}
              >
                <FileText size={14} />
                Lyrics
              </button>
            </div>
          </div>
        </div>

        {/* Track info */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            {song.era?.name || 'Legacy'}
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', lineHeight: 1.2 }}>
            {song.name}
          </h1>
          <div style={{ marginBottom: '16px' }}>
            <span className={`badge ${getCategoryClass(song.category)}`}>
              {song.category === 'recording_session' ? 'Recording Session' : song.category.charAt(0).toUpperCase() + song.category.slice(1)}
            </span>
          </div>

          {song.additional_information && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px', maxWidth: '500px' }}>
              {song.additional_information}
            </p>
          )}

          {/* No audio notice */}
          {!hasApiAudio && (
            <div style={{
              padding: '12px 16px',
              background: 'var(--accent-light)',
              border: '1px solid rgba(var(--accent-rgb),0.2)',
              borderRadius: '4px',
              fontSize: '13px',
              color: 'var(--accent)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Music size={14} />
              No audio path is available for this track yet.
            </div>
          )}

          {/* Metadata grid */}
          {metaItems.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
              padding: '20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
            }}>
              {metaItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Icon size={14} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '1px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.value?.toString()}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="divider" />

      {/* Comments */}
      <TrackComments song={song} onOpenAuth={onOpenAuth} />

      {/* Lyrics Drawer */}
      <LyricsDrawer isOpen={lyricsOpen} onClose={() => setLyricsOpen(false)} song={song} />

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          .song-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
};
export default SongPage;
