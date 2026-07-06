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
    accent: '193,39,45',
    params: { category: 'unreleased' },
  },
  {
    id: 'official-releases',
    name: 'Official Releases',
    description: 'Every officially released Juice WRLD track in the archive.',
    accent: '193,39,45',
    params: { category: 'released' },
  },
  {
    id: 'recording-sessions',
    name: 'Session Recordings',
    description: 'Raw studio sessions, freestyles, and voice memo recordings.',
    accent: '193,39,45',
    params: { category: 'recording_session' },
  },
  {
    id: 'unsurfaced',
    name: 'Unsurfaced',
    description: 'Known to exist but no audio has circulated yet.',
    accent: '193,39,45',
    params: { category: 'unsurfaced' },
  },
];


const buildBrowseUrl = (params: Playlist['params']) => {
  const query = new URLSearchParams();
  if (params.era) query.set('era', params.era);
  if (params.category) query.set('category', params.category);
  return `/browse?${query.toString()}`;
};

const PlaylistCard: React.FC<{ playlist: Playlist }> = ({ playlist }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data } = useGetSongsQuery({ ...playlist.params, page_size: 4 });
  const preview = data?.results?.slice(0, 4) || [];
  const total = data?.count;
  const openPlaylist = () => navigate(buildBrowseUrl(playlist.params));

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data?.results?.length) return;
    const songs = data.results;
    dispatch(playTrack({ track: { song: songs[0] }, queue: songs.map((s: Song) => ({ song: s })) }));
  };

  return (
    <div
      className="playlist-card"
      style={{ '--playlist-accent': playlist.accent } as React.CSSProperties}
      onClick={openPlaylist}
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
        <button
          type="button"
          className="playlist-card-play"
          onClick={handlePlay}
          disabled={!data?.results?.length}
          aria-label={`Play ${playlist.name}`}
          title="Play playlist"
        >
          <Play size={18} fill="currentColor" />
        </button>
      </div>
      <div className="playlist-card-info">
        <button
          type="button"
          className="playlist-card-title"
          onClick={(event) => {
            event.stopPropagation();
            openPlaylist();
          }}
          aria-label={`Open ${playlist.name}`}
        >
          {playlist.name}
        </button>
        <span>{playlist.description}</span>
        {total !== undefined && <small>{total.toLocaleString()} tracks</small>}
      </div>
    </div>
  );
};

interface PlaylistsProps {
  onOpenAuth: () => void;
}

export const Playlists: React.FC<PlaylistsProps> = () => (
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
        <PlaylistCard key={playlist.id} playlist={playlist} />
      ))}
    </div>
  </div>
);

export default Playlists;
