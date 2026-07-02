import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Play, Shuffle } from '../components/AppIcon';
import { useGetErasQuery, useGetSongsQuery } from '../services/juicewrldApi';
import { TrackRow } from '../components/TrackRow';
import { CategoryTabs } from '../components/CategoryTabs';
import { playTrack } from '../features/player/playerSlice';
import { useAppDispatch } from '../app/hooks';

interface SongsProps {
  onOpenAuth: () => void;
}

const PAGE_SIZE = 15;

const RowSkeleton = () => <div className="track-row-skeleton" />;

export const Songs: React.FC<SongsProps> = ({ onOpenAuth }) => {
  const dispatch = useAppDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [category, setCategory] = useState('');
  const [era, setEra] = useState('');

  const { data: eraData } = useGetErasQuery({ page_size: 50 });
  const eras = eraData?.results || [];

  const { data, isLoading, isFetching } = useGetSongsQuery(
    { page: currentPage, page_size: PAGE_SIZE, category: category || undefined, era: era || undefined }
  );

  const handleCategoryChange = (next: string) => {
    setCategory(next);
    setCurrentPage(1);
  };

  const handleEraChange = (next: string) => {
    setEra(next);
    setCurrentPage(1);
  };

  const songs = data?.results || [];
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;
  const totalCount = data?.count || 0;
  const loading = isLoading || isFetching;

  const playSongs = (shuffle = false) => {
    if (!songs.length) return;
    const queueSongs = shuffle ? [...songs].sort(() => Math.random() - 0.5) : songs;
    dispatch(playTrack({
      track: { song: queueSongs[0] },
      queue: queueSongs.map(song => ({ song })),
    }));
  };

  return (
    <div className="library-page">
      <div className="browse-header">
        <div>
          <div className="section-label">Library</div>
          <h1>Songs</h1>
          <p>{totalCount ? `${totalCount.toLocaleString()} tracks` : 'Every track in the archive.'}</p>
        </div>
        <div className="playlist-actions">
          <button onClick={() => playSongs(false)} disabled={!songs.length} className="btn btn-primary">
            <Play size={15} fill="currentColor" /> Play
          </button>
          <button onClick={() => playSongs(true)} disabled={!songs.length} className="btn btn-secondary">
            <Shuffle size={15} /> Shuffle
          </button>
        </div>
      </div>

      <div className="songs-filters">
        <CategoryTabs activeTab={category} onTabChange={handleCategoryChange} />
        <select
          className="songs-era-select"
          value={era}
          onChange={e => handleEraChange(e.target.value)}
        >
          <option value="">All eras</option>
          {eras.map(e => (
            <option key={e.id} value={e.name}>{e.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="track-list-card">
          {Array.from({ length: PAGE_SIZE }, (_, index) => <RowSkeleton key={index} />)}
        </div>
      ) : songs.length > 0 ? (
        <div className="track-list-card">
          <div className="track-list-heading">
            <span>#</span>
            <span>Title</span>
            <span>Era</span>
            <span>Category</span>
            <span>Length</span>
          </div>
          {songs.map((song, idx) => (
            <TrackRow
              key={song.id}
              song={song}
              index={(currentPage - 1) * PAGE_SIZE + idx}
              onOpenAuth={onOpenAuth}
              queue={songs}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No tracks found</strong>
          <span>Try a different category or era.</span>
        </div>
      )}

      {totalCount > PAGE_SIZE && (
        <div className="pagination-controls">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="btn btn-secondary">
            <ArrowLeft size={15} /> Prev
          </button>
          <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className="btn btn-secondary">
            Next <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Songs;
