import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from '../components/AppIcon';
import { useGetSongsQuery } from '../services/juicewrldApi';
import { useAppDispatch } from '../app/hooks';
import { playTrack } from '../features/player/playerSlice';
import type { Song } from '../types';

interface Playlist {
  id: string;
  name: string;
  description: string;
  accent: string;
  params: { category?: string; era?: string; ordering?: string };
}

const PLAYLISTS: Playlist[] = [
  {
    id: 'top-unreleased',
    name: 'Top Unreleased',
    description: 'The most-played unreleased tracks in the archive.',
    accent: '#ff5500',
    params: { category: 'unreleased' },
  },
  {
    id: 'official-releases',
    name: 'Official Releases',
    description: 'Every officially released Juice WRLD track in the archive.',
    accent: '#7c3aed',
    params: { category: 'released' },
  },
  {
    id: 'recording-sessions',
    name: 'Session Recordings',
    description: 'Raw session footage, freestyle recordings, and studio fragments.',
    accent: '#0891b2',
    params: { category: 'recording_session' },
  },
  {
    id: 'gb-gr-era',
    name: 'Goodbye & Good Riddance',
    description: 'Tracks tied to the GB&GR era — the debut album and its surrounding sessions.',
    accent: '#16a34a',
    params: { era: 'gb&gr' },
  },
  {
    id: 'drfl-era',
    name: 'Death Race for Love',
    description: 'The sophomore album era — high-energy records and session leaks.',
    accent: '#dc2626',
    params: { era: 'drfl' },
  },
  {
    id: 'fd-era',
    name: 'Fighting Demons',
    description: 'Posthumous material from the Fighting Demons era and surrounding vaults.',
    accent: '#9333ea',
    params: { era: 'fd' },
  },
  {
    id: 'lnd-era',
    name: 'Legends Never Die',
    description: 'The first posthumous album era and its related session material.',
    accent: '#b45309',
    params: { era: 'lnd' },
  },
  {
    id: 'out-era',
    name: 'Outsiders Era',
    description: 'One of the most prolific archive periods with deep vault material.',
    accent: '#0f766e',
    params: { era: 'out' },
  },
];

const buildBrowseUrl = (params: Playlist['params']) => {
  const query = new URLSearchParams();
  if (params.era) query.set('era', params.era);
  if (params.category) query.set('category', params.category);
  return `/browse?${query.toString()}`;
};

const PlaylistCard: React.FC<{ playlist: Playlist; onOpenAuth: () => void }> = ({ playlist, onOpenAuth: _onOpenAuth }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data } = useGetSongsQuery({ ...playlist.params, page_size: 4 });
  const preview = data?.results?.slice(0, 4) || [];
  const total = data?.count;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data?.results?.length) return;
    const songs = data.results;
    dispatch(playTrack({ track: { song: songs[0] }, queue: songs.map((s: Song) => ({ song: s })) }));
  };

  return (
    <button
      className="playlist-card"
      style={{ '--playlist-accent': playlist.accent } as React.CSSProperties}
      onClick={() => navigate(buildBrowseUrl(playlist.params))}
    >
      <div className="playlist-card-art">
        {preview.length > 0 ? (
          <div className={`playlist-card-mosaic count-${preview.length}`}>
            {preview.map(song =>
              song.image_url ? (
                <img
                  key={song.id}
                  src={song.image_url.startsWith('http') ? song.image_url : `https://juicewrldapi.com${song.image_url}`}
                  alt=""
                />
              ) : (
                <div key={song.id} className="playlist-card-mosaic-placeholder" />
              )
            )}
          </div>
        ) : (
          <div className="playlist-card-art-placeholder" />
        )}
        <button className="playlist-card-play" onClick={handlePlay} title="Play playlist">
          <Play size={18} fill="currentColor" />
        </button>
      </div>
      <div className="playlist-card-info">
        <strong>{playlist.name}</strong>
        <span>{playlist.description}</span>
        {total !== undefined && <small>{total.toLocaleString()} tracks</small>}
      </div>
    </button>
  );
};

interface PlaylistsProps {
  onOpenAuth: () => void;
}

export const Playlists: React.FC<PlaylistsProps> = ({ onOpenAuth }) => (
  <div className="library-page">
    <div className="browse-header">
      <div>
        <div className="section-label">Discover</div>
        <h1>Playlists</h1>
        <p>Curated collections from the archive.</p>
      </div>
    </div>

    <div className="playlists-grid">
      {PLAYLISTS.map(playlist => (
        <PlaylistCard key={playlist.id} playlist={playlist} onOpenAuth={onOpenAuth} />
      ))}
    </div>
  </div>
);

export default Playlists;
