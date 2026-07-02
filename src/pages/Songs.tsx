import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, Play, Shuffle } from '../components/AppIcon';
import { useGetErasQuery, useGetSongsQuery } from '../services/juicewrldApi';
import { TrackRow } from '../components/TrackRow';
import { CategoryTabs } from '../components/CategoryTabs';
import { playTrack } from '../features/player/playerSlice';
import { useAppDispatch } from '../app/hooks';
import type { Era } from '../types';

interface SongsProps {
  onOpenAuth: () => void;
}

const PAGE_SIZE = 15;

const RowSkeleton = () => <div className="track-row-skeleton" />;

const EraDropdown: React.FC<{ eras: Era[]; value: string; onChange: (v: string) => void }> = ({ eras, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const closeOnEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeOnEsc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeOnEsc);
    };
  }, [open]);

  return (
    <div className="era-dropdown" ref={ref}>
      <button
        type="button"
        className={`era-dropdown-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{value || 'All eras'}</span>
        <ChevronDown size={13} className={`era-dropdown-chevron${open ? ' flipped' : ''}`} />
      </button>

      {open && (
        <div className="era-dropdown-panel custom-scroll" role="listbox">
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className={`era-dropdown-item${!value ? ' active' : ''}`}
            onClick={() => { onChange(''); setOpen(false); }}
          >
            All eras
          </button>
          {eras.map(era => (
            <button
              key={era.id}
              type="button"
              role="option"
              aria-selected={value === era.name}
              className={`era-dropdown-item${value === era.name ? ' active' : ''}`}
              onClick={() => { onChange(era.name); setOpen(false); }}
            >
              {era.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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

  const handleCategoryChange = (next: string) => { setCategory(next); setCurrentPage(1); };
  const handleEraChange = (next: string) => { setEra(next); setCurrentPage(1); };

  const songs = data?.results || [];
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;
  const totalCount = data?.count || 0;
  const loading = isLoading || isFetching;

  const playSongs = (shuffle = false) => {
    if (!songs.length) return;
    const queue = shuffle ? [...songs].sort(() => Math.random() - 0.5) : songs;
    dispatch(playTrack({ track: { song: queue[0] }, queue: queue.map(song => ({ song })) }));
  };

  return (
    <div className="library-page">
      <div className="songs-page-header">
        <div>
          <h1>Songs</h1>
          <p>{totalCount ? `${totalCount.toLocaleString()} tracks` : 'Every track in the archive.'}</p>
        </div>
        <div className="songs-page-actions">
          <button onClick={() => playSongs(false)} disabled={!songs.length} className="btn btn-primary">
            <Play size={15} fill="currentColor" /> Play
          </button>
          <button onClick={() => playSongs(true)} disabled={!songs.length} className="btn btn-secondary">
            <Shuffle size={15} /> Shuffle
          </button>
        </div>
      </div>

      <div className="songs-filter-bar">
        <CategoryTabs activeTab={category} onTabChange={handleCategoryChange} />
        <EraDropdown eras={eras} value={era} onChange={handleEraChange} />
      </div>

      {loading ? (
        <div className="track-list-card">
          {Array.from({ length: PAGE_SIZE }, (_, i) => <RowSkeleton key={i} />)}
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
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="btn btn-secondary">
            <ArrowLeft size={15} /> Prev
          </button>
          <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="btn btn-secondary">
            Next <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Songs;
