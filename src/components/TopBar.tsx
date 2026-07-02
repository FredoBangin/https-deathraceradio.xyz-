import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, LogOut, Shield, Music, Heart } from './AppIcon';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logoutUser } from '../features/auth/authSlice';
import { getDisplayNameFromUser, isSupabaseConfigured } from '../lib/supabase';
import { useGetSongsQuery } from '../services/juicewrldApi';
import type { Song } from '../types';

interface TopBarProps { onOpenAuth: () => void; }

export const TopBar: React.FC<TopBarProps> = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector(s => s.auth);
  const likedCount = useAppSelector(s => s.library.likedSongIds.length);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [focused, setFocused] = useState(false);
  const trimmedQuery = searchQuery.trim();
  const { data: suggestionData, isFetching: suggestionsLoading } = useGetSongsQuery(
    { search: trimmedQuery, page_size: 6 },
    { skip: trimmedQuery.length < 2 }
  );
  const suggestions = suggestionData?.results || [];
  const showSuggestions = focused && trimmedQuery.length >= 2;
  const displayName = getDisplayNameFromUser(user);

  useEffect(() => { setSearchQuery(searchParams.get('search') || ''); }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(trimmedQuery ? `/browse?search=${encodeURIComponent(trimmedQuery)}` : '/songs');
    setFocused(false);
  };

  const getImageUrl = (song: Song) => {
    if (!song.image_url) return null;
    return song.image_url.startsWith('http')
      ? song.image_url
      : `https://juicewrldapi.com${song.image_url}`;
  };

  const openSong = (song: Song) => {
    setSearchQuery(song.name);
    setFocused(false);
    navigate(`/song/${song.public_id || song.id}`);
  };

  const openSearchResults = () => {
    setFocused(false);
    navigate(`/browse?search=${encodeURIComponent(trimmedQuery)}`);
  };

  return (
    <div className="topbar-area">
      <form onSubmit={handleSearchSubmit} className="topbar-search">
        <Search size={19} />
        <input
          type="text"
          placeholder="Search tracks, eras, artists..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        />

        {showSuggestions && (
          <div className="search-suggestions-panel">
            <div className="search-suggestions-title">Search results</div>

            {suggestionsLoading && suggestions.length === 0 ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="search-suggestion-skeleton">
                  <div className="skeleton" />
                  <span><i className="skeleton" /><i className="skeleton" /></span>
                </div>
              ))
            ) : suggestions.length > 0 ? (
              suggestions.map((song) => {
                const imageUrl = getImageUrl(song);
                return (
                  <button
                    key={song.id}
                    type="button"
                    className="search-suggestion-row"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      openSong(song);
                    }}
                  >
                    <div>
                      {imageUrl ? <img src={imageUrl} alt="" /> : <Music size={16} />}
                    </div>
                    <span>
                      <strong>{song.name}</strong>
                      <small>{song.credited_artists || 'Juice WRLD'} {song.era?.name ? `- ${song.era.name}` : ''}</small>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="search-suggestion-empty">No matches yet. Try a different title or era.</div>
            )}

            <button type="button" className="search-see-all" onMouseDown={(e) => { e.preventDefault(); openSearchResults(); }}>
              See all results for "{trimmedQuery}"
            </button>
          </div>
        )}
      </form>

      <div className="topbar-actions">
        <button className="topbar-liked-btn" title="Liked tracks" onClick={() => navigate('/liked')}>
          <Heart size={18} />
          <span>{likedCount}</span>
        </button>

        {!isSupabaseConfigured && (
          <div className="demo-mode-pill"><Shield size={10} /> Demo</div>
        )}

        {user ? (
          <div className="topbar-user">
            <div>{displayName[0].toUpperCase()}</div>
            <span>{displayName}</span>
            <button onClick={() => dispatch(logoutUser())} title="Sign out"><LogOut size={15} /></button>
          </div>
        ) : (
          <button onClick={onOpenAuth} className="topbar-signin-btn">
            Sign in
          </button>
        )}
      </div>
    </div>
  );
};

export default TopBar;
