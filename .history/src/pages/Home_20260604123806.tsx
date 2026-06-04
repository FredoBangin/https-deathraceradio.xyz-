import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Disc3, Play } from 'lucide-react';
import { useAppSelector } from '../app/hooks';
import { useGetErasQuery, useGetSongByIdQuery, useGetSongsQuery, useGetStatsQuery } from '../services/juicewrldApi';
import { TrackCard } from '../components/TrackCard';

interface HomeProps { onOpenAuth: () => void; }

const SectionHeader: React.FC<{ eyebrow?: string; title: string; description?: string; action?: () => void }> = ({ eyebrow, title, description, action }) => (
  <div className="section-heading">
    <div>
      {eyebrow && <div className="section-label">{eyebrow}</div>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
    {action && (
      <button onClick={action} className="section-link">
        View all <ChevronRight size={15} />
      </button>
    )}
  </div>
);

const SkeletonCard = () => (
  <div className="spotify-card skeleton-card">
    <div className="skeleton-cover" />
    <div className="skeleton-line" />
    <div className="skeleton-line short" />
  </div>
);

const RecentlyPlayedCard: React.FC<{ songId: number; onOpenAuth: () => void }> = ({ songId, onOpenAuth }) => {
  const { data: song, isLoading } = useGetSongByIdQuery(songId);
  if (isLoading) return <SkeletonCard />;
  if (!song) return null;
  return <TrackCard song={song} onOpenAuth={onOpenAuth} />;
};

export const Home: React.FC<HomeProps> = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useGetStatsQuery();
  const { data: popularSongs, isLoading: popularLoading } = useGetSongsQuery({ page_size: 10 });
  const { data: unreleasedSongs, isLoading: unreleasedLoading } = useGetSongsQuery({ page_size: 10, category: 'unreleased' });
  const { data: releasedSongs, isLoading: releasedLoading } = useGetSongsQuery({ page_size: 10, category: 'released' });
  const { data: eras } = useGetErasQuery({ page_size: 8 });
  const recentlyPlayedIds = useAppSelector(state => state.player.recentlyPlayedIds);

  const totalSongs = stats?.total_songs || 2452;
  const unreleasedCount = stats?.category_stats?.unreleased || 0;
  const releasedCount = stats?.category_stats?.released || 0;

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="section-label">deathraceradio</div>
          <h1>Juice WRLD Archive</h1>
          <p>
            A clean archive player for browsing eras, playing tracks, and keeping community uploads separate
            when new audio gets added.
          </p>
          <div className="hero-stats">
            <div><strong>{statsLoading ? '-' : totalSongs.toLocaleString()}</strong><span>Total tracks</span></div>
            <div><strong>{statsLoading ? '-' : unreleasedCount.toLocaleString()}</strong><span>Unreleased</span></div>
            <div><strong>{statsLoading ? '-' : releasedCount.toLocaleString()}</strong><span>Released</span></div>
          </div>
          <div className="hero-actions">
            <button onClick={() => navigate('/eras')} className="btn btn-primary">
              <Disc3 size={16} /> Browse Vault
            </button>
          </div>
        </div>
        <div className="home-hero-art">
          <div className="hero-orbit one" />
          <div className="hero-orbit two" />
          <div className="hero-now-playing">
            <span>Start here</span>
            <strong>Browse the vault</strong>
            <button onClick={() => navigate('/eras')}>
              <Play size={14} fill="currentColor" /> Start listening
            </button>
          </div>
        </div>
      </section>

      {recentlyPlayedIds.length > 0 && (
        <section className="home-section">
          <SectionHeader
            eyebrow="For you"
            title="Recently listened"
            description="Jump back into tracks you played recently on this device."
          />
          <div className="spotify-grid">
            {recentlyPlayedIds.slice(0, 10).map(songId => (
              <RecentlyPlayedCard key={songId} songId={songId} onOpenAuth={onOpenAuth} />
            ))}
          </div>
        </section>
      )}

      <section className="home-section">
        <SectionHeader
          eyebrow="Featured"
          title="Popular tracks"
          description="A quick entry point into the API catalog, pulled straight from the archive."
        />
        <div className="spotify-grid">
          {popularLoading
            ? Array.from({ length: 5 }, (_, index) => <SkeletonCard key={index} />)
            : popularSongs?.results.slice(0, 10).map(song => (
              <TrackCard key={song.id} song={song} onOpenAuth={onOpenAuth} queue={popularSongs.results} />
            ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeader
          eyebrow="Vault"
          title="Browse by era"
          description="Start with a recording period when you know the era but not the exact title."
          action={() => navigate('/eras')}
        />
        <div className="era-strip">
          {(eras?.results || []).slice(0, 8).map(era => (
            <button key={era.id} onClick={() => navigate(`/browse?era=${encodeURIComponent(era.name)}`)}>
              <span>{era.name}</span>
              <small>{era.play_count ? `${era.play_count.toLocaleString()} plays` : 'Open era'}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="home-section two-column-sections">
        <div>
          <SectionHeader
            eyebrow="Deep cuts"
            title="Unreleased"
            description="Leaks, session tracks, and archive cuts grouped by API metadata."
          />
          <div className="compact-card-list">
            {unreleasedLoading
              ? Array.from({ length: 6 }, (_, index) => <div key={index} className="compact-skeleton" />)
              : unreleasedSongs?.results.slice(0, 6).map((song, index) => (
                <button key={song.id} onClick={() => navigate(`/song/${song.public_id || song.id}`)}>
                  <span>{index + 1}</span>
                  <strong>{song.name}</strong>
                  <small>{song.era?.name || 'Unknown era'}</small>
                </button>
              ))}
          </div>
        </div>
        <div>
          <SectionHeader
            eyebrow="Catalog"
            title="Released"
            description="Officially released tracks kept beside the vault for easy browsing."
          />
          <div className="compact-card-list">
            {releasedLoading
              ? Array.from({ length: 6 }, (_, index) => <div key={index} className="compact-skeleton" />)
              : releasedSongs?.results.slice(0, 6).map((song, index) => (
                <button key={song.id} onClick={() => navigate(`/song/${song.public_id || song.id}`)}>
                  <span>{index + 1}</span>
                  <strong>{song.name}</strong>
                  <small>{song.era?.name || 'Unknown era'}</small>
                </button>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
