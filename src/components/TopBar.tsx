import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, User, LogOut, Shield, Music } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logoutUser } from '../features/auth/authSlice';
import { isSupabaseConfigured } from '../lib/supabase';
import { useGetSongsQuery } from '../services/juicewrldApi';
import type { Song } from '../types';

interface TopBarProps { onOpenAuth: () => void; }

export const TopBar: React.FC<TopBarProps> = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector(s => s.auth);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [focused, setFocused] = useState(false);
  const trimmedQuery = searchQuery.trim();
  const { data: suggestionData, isFetching: suggestionsLoading } = useGetSongsQuery(
    { search: trimmedQuery, page_size: 6 },
    { skip: trimmedQuery.length < 2 }
  );
  const suggestions = suggestionData?.results || [];
  const showSuggestions = focused && trimmedQuery.length >= 2;

  useEffect(() => { setSearchQuery(searchParams.get('search') || ''); }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(trimmedQuery ? `/browse?search=${encodeURIComponent(trimmedQuery)}` : '/eras');
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
      {/* Search */}
      <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '420px', maxWidth: '48vw' }}>
        <Search size={14} style={{
          position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
          color: focused ? 'var(--accent)' : 'var(--text-muted)',
          pointerEvents: 'none', transition: 'color 0.15s',
          filter: focused ? 'drop-shadow(0 0 6px rgba(255,85,0,0.5))' : 'none',
        }} />
        <input
          type="text"
          placeholder="Search tracks, eras, artists..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          style={{
            width: '100%', paddingLeft: '38px', height: '36px',
            borderRadius: '20px', fontSize: '13px',
            border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
            boxShadow: focused ? 'var(--glow-sm), 0 0 0 3px rgba(255,85,0,0.08)' : 'none',
            transition: 'all 0.18s ease',
          }}
        />

        {showSuggestions && (
          <div style={{
            position: 'absolute',
            top: '46px',
            left: 0,
            right: 0,
            background: 'rgba(18,18,28,0.98)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 24px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,85,0,0.06)',
            padding: '8px',
            zIndex: 250,
            backdropFilter: 'blur(18px)',
          }}>
            <div style={{
              padding: '8px 10px',
              color: 'var(--text-muted)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: 700,
            }}>
              Search results
            </div>

            {suggestionsLoading && suggestions.length === 0 ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px' }}>
                  <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: '6px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '70%', height: '11px', marginBottom: '7px' }} />
                    <div className="skeleton" style={{ width: '42%', height: '9px' }} />
                  </div>
                </div>
              ))
            ) : suggestions.length > 0 ? (
              suggestions.map((song) => {
                const imageUrl = getImageUrl(song);
                return (
                  <button
                    key={song.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      openSong(song);
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      background: 'var(--bg-card)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {imageUrl ? (
                        <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Music size={16} color="var(--text-muted)" />
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {song.name}
                      </div>
                      <div style={{
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {song.credited_artists || 'Juice WRLD'} {song.era?.name ? `- ${song.era.name}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div style={{ padding: '16px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No matches yet. Try a different title or era.
              </div>
            )}

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                openSearchResults();
              }}
              style={{
                width: '100%',
                marginTop: '6px',
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-primary)',
                borderRadius: '10px',
                padding: '9px 10px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              See all results for "{trimmedQuery}"
            </button>
          </div>
        )}
      </form>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {!isSupabaseConfigured && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '11px', color: 'var(--text-muted)',
            padding: '4px 10px', borderRadius: '4px',
            border: '1px solid var(--border)', background: 'var(--bg-glass)',
          }}>
            <Shield size={10} /> Demo mode
          </div>
        )}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'var(--accent)', boxShadow: '0 0 14px rgba(255,85,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '12px', fontWeight: 700,
            }}>
              {(user.user_metadata?.username || user.email)[0].toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {user.user_metadata?.username || user.email.split('@')[0]}
            </span>
            <button
              onClick={() => dispatch(logoutUser())}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '4px', display: 'flex',
                alignItems: 'center', transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button onClick={onOpenAuth} className="btn btn-primary" style={{ padding: '7px 16px', fontSize: '13px' }}>
            <User size={14} /> Sign In
          </button>
        )}
      </div>
    </div>
  );
};
export default TopBar;
