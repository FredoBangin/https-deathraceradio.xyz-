/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Play, Shuffle } from '../components/AppIcon';
import { useGetSongsQuery } from '../services/juicewrldApi';
import { TrackRow } from '../components/TrackRow';
import { playTrack } from '../features/player/playerSlice';
import { useAppDispatch } from '../app/hooks';
import { getEraDescription } from '../lib/eraDescriptions';

interface BrowseProps {
  onOpenAuth: () => void;
}

const getImageUrl = (image?: string) => {
  if (!image) return '';
  return image.startsWith('http') ? image : `https://juicewrldapi.com${image}`;
};

const RowSkeleton = () => <div className="track-row-skeleton" />;

export const Browse: React.FC<BrowseProps> = ({ onOpenAuth }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const selectedEra = searchParams.get('era') || '';
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const isEraPlaylist = Boolean(selectedEra);
  const isCategoryView = Boolean(selectedCategory) && !isEraPlaylist;
  const isSearchResults = Boolean(searchQuery.trim());

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEra, searchQuery, selectedCategory]);

  const pageSize = isEraPlaylist ? 30 : 20;
  const { data, isLoading, isFetching } = useGetSongsQuery({
    page: currentPage,
    page_size: pageSize,
    era: selectedEra || undefined,
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
  }, { skip: !isEraPlaylist && !isSearchResults && !isCategoryView });

  if (!isEraPlaylist && !isSearchResults && !isCategoryView) {
    return <Navigate to="/eras" replace />;
  }

  const songs = data?.results || [];
  const totalPages = data ? Math.ceil(data.count / pageSize) : 1;
  const coverImage = getImageUrl(songs.find(song => song.image_url)?.image_url);
  const pageTitle = isEraPlaylist ? selectedEra : isCategoryView ? selectedCategory.replace('_', ' ') : `Search: ${searchQuery}`;
  const pageDescription = isEraPlaylist
    ? getEraDescription(selectedEra)
    : isCategoryView
      ? `${selectedCategory.replace('_', ' ')} tracks from the Juice WRLD archive.`
      : `Tracks matching "${searchQuery}" from the Juice WRLD API catalog.`;

  const playSongs = (shuffle = false) => {
    if (!songs.length) return;
    const queueSongs = shuffle ? [...songs].sort(() => Math.random() - 0.5) : songs;
    dispatch(playTrack({
      track: { song: queueSongs[0] },
      queue: queueSongs.map(song => ({ song })),
    }));
  };

  return (
    <div className="browse-page">
      {isEraPlaylist ? (
        <div className="playlist-header">
          <button onClick={() => navigate('/eras')} className="btn btn-text playlist-back">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="playlist-hero">
            <div className="playlist-cover">
              {coverImage ? <img src={coverImage} alt={pageTitle} /> : <span>{pageTitle.slice(0, 2).toUpperCase()}</span>}
            </div>
            <div>
              <div className="section-label">Playlist</div>
              <h1>{pageTitle}</h1>
              <p>{data ? `${data.count.toLocaleString()} tracks` : 'Loading tracks'}</p>
              <span className="playlist-description">{pageDescription}</span>
              <div className="playlist-actions">
                <button onClick={() => playSongs(false)} disabled={!songs.length} className="btn btn-primary">
                  <Play size={15} fill="currentColor" /> Play
                </button>
                <button onClick={() => playSongs(true)} disabled={!songs.length} className="btn btn-secondary">
                  <Shuffle size={15} /> Shuffle
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="browse-header">
          <div>
            <div className="section-label">Search results</div>
            <h1>{pageTitle}</h1>
            <p>{data ? `${data.count.toLocaleString()} tracks` : 'Loading tracks'}</p>
            <span className="playlist-description">{pageDescription}</span>
          </div>
        </div>
      )}

      {(isLoading || isFetching) ? (
        <div className="track-list-card">
          {Array.from({ length: 10 }, (_, index) => <RowSkeleton key={index} />)}
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
              index={(currentPage - 1) * pageSize + idx}
              onOpenAuth={onOpenAuth}
              queue={songs}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No tracks found</strong>
          <span>Try a different search.</span>
        </div>
      )}

      {data && data.count > pageSize && (
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

export default Browse;
