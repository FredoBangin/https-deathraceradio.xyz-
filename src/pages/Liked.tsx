import React from 'react';
import { useAppSelector } from '../app/hooks';
import { useGetSongByIdQuery } from '../services/juicewrldApi';
import { TrackRow } from '../components/TrackRow';
import { Heart, Lock, Music } from '../components/AppIcon';

interface LikedProps {
  onOpenAuth: () => void;
}

const LikedRow: React.FC<{ songId: number; index: number; onOpenAuth: () => void }> = ({ songId, index, onOpenAuth }) => {
  const { data: song, isLoading } = useGetSongByIdQuery(songId);
  if (isLoading) {
    return <div style={{ height: '52px', borderRadius: '4px', background: 'var(--bg-secondary)', marginBottom: '4px', animation: 'pulse 1.5s infinite' }} />;
  }
  if (!song) return null;
  return <TrackRow song={song} index={index} onOpenAuth={onOpenAuth} />;
};

export const Liked: React.FC<LikedProps> = ({ onOpenAuth }) => {
  const { user } = useAppSelector((state) => state.auth);
  const { likedSongIds } = useAppSelector((state) => state.library);

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <Lock size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Sign in to see your likes</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', maxWidth: '320px', marginInline: 'auto' }}>
          Heart tracks while browsing and they'll appear here.
        </p>
        <button onClick={onOpenAuth} className="btn btn-primary">Sign In</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Heart size={22} fill="var(--accent-liked)" style={{ color: 'var(--accent-liked)', flexShrink: 0, filter: 'drop-shadow(0 0 4px rgba(var(--accent-rgb),0.18))' }} />
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Liked Tracks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
            {likedSongIds.length} {likedSongIds.length === 1 ? 'track' : 'tracks'}
          </p>
        </div>
      </div>

      {likedSongIds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px dashed var(--border)' }}>
          <Music size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
          <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>No liked tracks yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Heart songs while browsing and they'll show up here.
          </p>
        </div>
      ) : (
        <div>
          {likedSongIds.map((id, index) => (
            <LikedRow key={id} songId={id} index={index} onOpenAuth={onOpenAuth} />
          ))}
        </div>
      )}
    </div>
  );
};
export default Liked;
