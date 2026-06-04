import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { Era } from '../types';
import { useGetErasQuery, useGetSongsQuery } from '../services/juicewrldApi';
import { getEraDescription } from '../lib/eraDescriptions';

const getImageUrl = (image?: string) => {
  if (!image) return '';
  return image.startsWith('http') ? image : `https://juicewrldapi.com${image}`;
};

const EraCover: React.FC<{ era: Era }> = ({ era }) => {
  const { data } = useGetSongsQuery({ era: era.name, page_size: 4 });
  const songs = data?.results || [];

  if (!songs.length) {
    return (
      <div className="era-cover-placeholder">
        {era.name.slice(0, 2).toUpperCase()}
      </div>
    );
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

const EraTile: React.FC<{ era: Era }> = ({ era }) => {
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

export const Eras: React.FC = () => {
  const { data, isLoading } = useGetErasQuery({ page_size: 50 });
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'plays' | 'name'>('plays');

  const eras = useMemo(() => {
    const list = [...(data?.results || [])];
    return list
      .filter(era => era.name.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return (b.play_count || 0) - (a.play_count || 0);
      });
  }, [data, query, sortBy]);

  return (
    <div className="browse-vault-page">
      <div className="vault-header">
        <div>
          <div className="section-label">Library</div>
          <h1>Browse Vault</h1>
          <p>Explore every era. Filter, search, and dive into the archive. </p>
        </div>
        <div className="vault-tools">
          <label>
            <Search size={15} />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter eras" />
          </label>
          <select value={sortBy} onChange={event => setSortBy(event.target.value as 'plays' | 'name')}>
            <option value="plays">Most played</option>
            <option value="name">A to Z</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="browse-vault-grid">
          {Array.from({ length: 12 }, (_, index) => <div key={index} className="browse-vault-skeleton" />)}
        </div>
      ) : (
        <div className="browse-vault-grid">
          {eras.map(era => <EraTile key={era.id} era={era} />)}
        </div>
      )}
    </div>
  );
};

export default Eras;
