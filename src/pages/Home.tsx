import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Music, Send, Briefcase, Play } from '../components/AppIcon';
import { useAppSelector } from '../app/hooks';
import { useGetErasQuery, useGetSongByIdQuery, useGetSongsQuery, useGetStatsQuery } from '../services/juicewrldApi';
import { TrackCard } from '../components/TrackCard';
import type { Song, Era } from '../types';

interface HomeProps { onOpenAuth: () => void; }

const heroPhotos = [
  {
    url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Juice_Wrld_performs_at_the_InField_Fest_at_the_2019_Preakness_on_May_18,_2019.jpg',
    credit: 'Photo: Andy Jones / CC BY-SA 2.0',
    href: 'https://commons.wikimedia.org/wiki/File:Juice_Wrld_performs_at_the_InField_Fest_at_the_2019_Preakness_on_May_18,_2019.jpg',
    position: '68% 42%',
    size: 'cover',
    mobilePosition: '56% 26%',
    mobileSize: 'cover',
    accent: '#ff6a1a',
    accentRgb: '255,106,26',
    secondaryRgb: '106,64,255',
  },
  {
    url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Juice_WRLD_-_Les_Ardentes_2019.jpg',
    credit: 'Photo: Lexiou WesCudi / CC BY-SA 2.0',
    href: 'https://commons.wikimedia.org/wiki/File:Juice_WRLD_-_Les_Ardentes_2019.jpg',
    position: '74% 42%',
    size: 'cover',
    mobilePosition: '62% 22%',
    mobileSize: 'cover',
    accent: '#ff5500',
    accentRgb: '255,85,0',
    secondaryRgb: '23,178,170',
  },
  {
    url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Juice_Wrld_VMAs.png',
    credit: 'Photo: MTV International / CC BY 3.0',
    href: 'https://commons.wikimedia.org/wiki/File:Juice_Wrld_VMAs.png',
    position: '70% 36%',
    size: 'cover',
    mobilePosition: '56% 20%',
    mobileSize: 'cover',
    accent: '#ff3d1f',
    accentRgb: '255,61,31',
    secondaryRgb: '58,131,255',
  },
];

const HERO_ROTATE_MS = 7000;

const SectionHeader: React.FC<{ title: string; action?: () => void }> = ({ title, action }) => (
  <div className="dr-section-heading">
    <h2>{title}</h2>
    {action && <button onClick={action}>View all <ChevronRight size={17} /></button>}
  </div>
);

const getImageUrl = (image?: string) => {
  if (!image) return null;
  return image.startsWith('http') ? image : `https://juicewrldapi.com${image}`;
};

const HomeTrackTile: React.FC<{ song: Song; onOpenAuth: () => void; queue?: Song[] }> = ({ song, onOpenAuth, queue }) => {
  return (
    <div className="home-track-tile">
      <TrackCard song={song} onOpenAuth={onOpenAuth} queue={queue} />
    </div>
  );
};

const RecentSongCard: React.FC<{ song: Song; onOpen: () => void }> = ({ song, onOpen }) => {
  const image = getImageUrl(song.image_url);
  return (
    <button className="recent-listened-card" onClick={onOpen}>
      <div>{image ? <img src={image} alt="" /> : <span>JW</span>}</div>
      <span>
        <strong>{song.name}</strong>
        <small>{song.credited_artists || 'Juice WRLD'}</small>
      </span>
      <em><Play size={16} fill="currentColor" /></em>
    </button>
  );
};

const RecentlyPlayedCard: React.FC<{ songId: number }> = ({ songId }) => {
  const navigate = useNavigate();
  const { data: song, isLoading } = useGetSongByIdQuery(songId);
  if (isLoading) return <div className="recent-listened-card skeleton-card" />;
  if (!song) return null;
  return <RecentSongCard song={song} onOpen={() => navigate(`/song/${song.public_id || song.id}`)} />;
};

const EraHomeCard: React.FC<{ era: Era }> = ({ era }) => {
  const navigate = useNavigate();
  const { data } = useGetSongsQuery({ era: era.name, page_size: 1 });
  const song = data?.results?.[0];
  const image = getImageUrl(song?.image_url);

  return (
    <button className="home-era-card" onClick={() => navigate(`/browse?era=${encodeURIComponent(era.name)}`)}>
      <div>{image ? <img src={image} alt="" /> : <span>{era.name.slice(0, 2).toUpperCase()}</span>}</div>
      <strong>{era.name}</strong>
      <small>{era.time_frame || 'Recording era'}</small>
    </button>
  );
};

export const Home: React.FC<HomeProps> = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const { data: stats, isLoading: statsLoading } = useGetStatsQuery();
  const { data: popularSongs, isLoading: popularLoading } = useGetSongsQuery({ page_size: 8 });
  const { data: eras } = useGetErasQuery({ page_size: 8 });
  const recentlyPlayedIds = useAppSelector(state => state.player.recentlyPlayedIds);

  const totalSongs = stats?.total_songs || 2452;
  const unreleasedCount = stats?.category_stats?.unreleased || 0;
  const releasedCount = stats?.category_stats?.released || 0;
  const safeHeroIndex = activeHeroIndex % heroPhotos.length;
  const activeHeroPhoto = heroPhotos[safeHeroIndex];

  useEffect(() => {
    heroPhotos.forEach((photo) => {
      const image = new Image();
      image.src = photo.url;
    });
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    let interval: number | undefined;

    const startHeroCycle = () => {
      window.clearInterval(interval);
      if (document.hidden) return;
      interval = window.setInterval(() => {
        if (document.hidden) return;
        setActiveHeroIndex(index => (index + 1) % heroPhotos.length);
      }, HERO_ROTATE_MS);
    };

    const handleVisibilityChange = () => {
      startHeroCycle();
    };

    startHeroCycle();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const showHeroPhoto = (index: number) => {
    setActiveHeroIndex(index);
  };

  return (
    <div className="home-page dr-home-page">
      <section
        className="home-hero dr-hero"
        style={{
          '--hero-accent': activeHeroPhoto.accent,
          '--hero-accent-rgb': activeHeroPhoto.accentRgb,
          '--hero-secondary-rgb': activeHeroPhoto.secondaryRgb,
        } as React.CSSProperties}
      >
        <div className="dr-hero-bg-stack" aria-hidden="true">
          {heroPhotos.map((photo, index) => (
            <div
              key={photo.url}
              className={`dr-hero-bg ${index === safeHeroIndex ? 'active' : ''}`}
              style={{
                backgroundImage: `url("${photo.url}")`,
                '--hero-position': photo.position,
                '--hero-size': photo.size,
                '--hero-mobile-position': photo.mobilePosition,
                '--hero-mobile-size': photo.mobileSize,
              } as React.CSSProperties}
            />
          ))}
        </div>
        <div className="dr-hero-content">
          <div className="section-label">deathraceradio</div>
          <h1>Juice WRLD<br />Archive</h1>
          <p>A clean archive player for all released, unreleased, and unsurfaced Juice WRLD tracks.</p>
          <div className="hero-stats dr-hero-stats">
            <div><Music size={20} /><strong>{statsLoading ? '-' : totalSongs.toLocaleString()}</strong><span>Total tracks</span></div>
            <div><Briefcase size={20} /><strong>{statsLoading ? '-' : unreleasedCount.toLocaleString()}</strong><span>Unreleased</span></div>
            <div><Send size={20} /><strong>{statsLoading ? '-' : releasedCount.toLocaleString()}</strong><span>Released</span></div>
          </div>
          <button onClick={() => navigate('/eras')} className="dr-hero-button">
            Browse the vault <ChevronRight size={18} />
          </button>
        </div>
        <footer className="dr-hero-footer">
          <a className="hero-photo-credit" href={activeHeroPhoto.href} target="_blank" rel="noreferrer">
            {activeHeroPhoto.credit}
          </a>
          <a className="hero-api-credit" href="https://juicewrldapi.com" target="_blank" rel="noreferrer">
            © Powered by Juice WRLD API
          </a>
        </footer>
        <div className="dr-hero-photo-controls" aria-label="Hero photos">
          {heroPhotos.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              className={index === safeHeroIndex ? 'active' : ''}
              onClick={() => showHeroPhoto(index)}
              aria-label={`Show hero photo ${index + 1}`}
              aria-current={index === safeHeroIndex ? 'true' : undefined}
            />
          ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeader title="Recently listened" action={() => navigate('/liked')} />
        <div className="recent-listened-row">
          {recentlyPlayedIds.length > 0
            ? recentlyPlayedIds.slice(0, 3).map(songId => <RecentlyPlayedCard key={songId} songId={songId} />)
            : popularSongs?.results.slice(0, 3).map(song => (
              <RecentSongCard key={song.id} song={song} onOpen={() => navigate(`/song/${song.public_id || song.id}`)} />
            ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeader title="Explore by era" action={() => navigate('/eras')} />
        <div className="home-era-row">
          {(eras?.results || []).slice(0, 5).map(era => <EraHomeCard key={era.id} era={era} />)}
        </div>
      </section>

      <section className="home-section">
        <SectionHeader title="Popular tracks" />
        <div className="spotify-grid compact-home-grid">
          {popularLoading
            ? Array.from({ length: 4 }, (_, index) => <div key={index} className="spotify-card skeleton-card" />)
            : popularSongs?.results.slice(0, 4).map(song => (
              <HomeTrackTile key={song.id} song={song} onOpenAuth={onOpenAuth} queue={popularSongs.results} />
            ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
