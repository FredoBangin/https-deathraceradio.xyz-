import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Search } from '../components/AppIcon';
import type { Era } from '../types';
import { useGetErasQuery, useGetSongsQuery } from '../services/juicewrldApi';
import { useAppDispatch } from '../app/hooks';
import { playTrack } from '../features/player/playerSlice';
import { getEraDescription } from '../lib/eraDescriptions';

const getImageUrl = (image?: string) => {
  if (!image) return '';
  return image.startsWith('http') ? image : `https://juicewrldapi.com${image}`;
};

const parseStartYear = (timeFrame?: string): number => {
  if (!timeFrame) return 9999;
  const match = timeFrame.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : 9999;
};

const EraCover: React.FC<{ era: Era }> = ({ era }) => {
  const { data } = useGetSongsQuery({ era: era.name, page_size: 4 });
  const songs = data?.results || [];
  if (!songs.length) {
    return <div className="era-cover-placeholder">{era.name.slice(0, 2).toUpperCase()}</div>;
  }
  return (
    <div className={`era-cover-mosaic count-${Math.min(songs.length, 4)}`}>
      {songs.slice(0, 4).map(song => {
        const image = getImageUrl(song.image_url);
        return image
          ? <img key={song.id} src={image} alt={song.name} />
          : <div key={song.id}>{song.name.slice(0, 2).toUpperCase()}</div>;
      })}
    </div>
  );
};

const GridEraCard: React.FC<{ era: Era }> = ({ era }) => {
  const navigate = useNavigate();
  return (
    <button className="browse-vault-card" onClick={() => navigate(`/browse?era=${encodeURIComponent(era.name)}`)}>
      <EraCover era={era} />
      <div className="browse-vault-card-info">
        <strong>{era.name}</strong>
        <span>{era.time_frame || 'Recording era'}</span>
        <p>{getEraDescription(era.name)}</p>
        <small>{era.play_count ? `${era.play_count.toLocaleString()} plays` : 'Open playlist'}</small>
      </div>
    </button>
  );
};

const TimelineEraCard: React.FC<{ era: Era; side: 'left' | 'right' }> = ({ era, side }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data } = useGetSongsQuery({ era: era.name, page_size: 8 });
  const songs = data?.results || [];

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!songs.length) return;
    dispatch(playTrack({ track: { song: songs[0] }, queue: songs.map(s => ({ song: s })) }));
  };

  return (
    <div className={`timeline-era-card side-${side}`}>
      <div className="timeline-era-dot" />
      <div className="timeline-era-inner" onClick={() => navigate(`/browse?era=${encodeURIComponent(era.name)}`)}>
        <div className="timeline-era-art">
          <EraCover era={era} />
          {songs.length > 0 && (
            <button className="timeline-era-play" onClick={handlePlay} title={`Play ${era.name}`}>
              <Play size={16} fill="currentColor" />
            </button>
          )}
        </div>
        <div className="timeline-era-info">
          <strong>{era.name}</strong>
          {era.time_frame && <time>{era.time_frame}</time>}
          <p>{getEraDescription(era.name)}</p>
          {era.play_count ? <small>{era.play_count.toLocaleString()} plays</small> : null}
        </div>
      </div>
    </div>
  );
};

type ViewMode = 'timeline' | 'grid';

export const Eras: React.FC = () => {
  const { data, isLoading } = useGetErasQuery({ page_size: 50 });
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'plays' | 'name'>('date');
  const [view, setView] = useState<ViewMode>('timeline');

  const eras = useMemo(() => {
    const list = [...(data?.results || [])];
    return list
      .filter(era => era.name.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'plays') return (b.play_count || 0) - (a.play_count || 0);
        return parseStartYear(a.time_frame) - parseStartYear(b.time_frame);
      });
  }, [data, query, sortBy]);

  return (
    <div className="browse-vault-page">
      <div className="vault-header">
        <div>
          <div className="section-label">Library</div>
          <h1>The Vault</h1>
          <p>Juice WRLD's career, organized by era.</p>
        </div>
        <div className="vault-tools">
          <label>
            <Search size={15} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter eras" />
          </label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
            <option value="date">Chronological</option>
            <option value="plays">Most played</option>
            <option value="name">A to Z</option>
          </select>
          <div className="view-toggle">
            <button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')} title="Timeline">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} title="Grid">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="browse-vault-grid">
          {Array.from({ length: 12 }, (_, i) => <div key={i} className="browse-vault-skeleton" />)}
        </div>
      ) : view === 'grid' ? (
        <div className="browse-vault-grid">
          {eras.map(era => <GridEraCard key={era.id} era={era} />)}
        </div>
      ) : (
        <div className="timeline-container">
          <div className="timeline-line" />
          {eras.map((era, index) => (
            <TimelineEraCard key={era.id} era={era} side={index % 2 === 0 ? 'left' : 'right'} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Eras;
