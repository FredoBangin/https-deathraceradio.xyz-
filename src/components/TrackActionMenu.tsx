import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Album,
  ArrowUp,
  Clock3,
  Info,
  ListEnd,
  ListPlus,
  MoreHorizontal,
  Radio,
  Share2,
  Star,
  Trash2,
  UserRound,
} from './AppIcon';
import type { Song, Upload } from '../types';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  moveQueueItemToEnd,
  moveQueueItemToTop,
  playLater,
  playNext,
  removeFromQueue,
  setShuffle,
} from '../features/player/playerSlice';
import type { PlayerTrack } from '../features/player/playerSlice';
import { toggleLike } from '../features/library/librarySlice';
import { useRadioStation } from '../hooks/useRadioStation';

interface TrackActionMenuProps {
  song: Song;
  onOpenAuth: () => void;
  upload?: Upload;
  track?: PlayerTrack;
  queueIndex?: number;
  variant?: 'track' | 'queue';
  visible?: boolean;
}

interface MenuItem {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  dividerBefore?: boolean;
}

const getSongUrl = (song: Song) => `${window.location.origin}/song/${song.public_id || song.id}`;

export const TrackActionMenu: React.FC<TrackActionMenuProps> = ({
  song,
  upload,
  track,
  queueIndex,
  variant = 'track',
  visible = true,
  onOpenAuth,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { startRadio } = useRadioStation();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const { user } = useAppSelector(state => state.auth);
  const { likedSongIds } = useAppSelector(state => state.library);
  const { currentIndex } = useAppSelector(state => state.player);
  const isLiked = likedSongIds.includes(song.id);
  const actionTrack = track || { song, upload };
  const canMoveToTop = variant === 'queue' && typeof queueIndex === 'number' && queueIndex !== currentIndex + 1;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const closeMenu = () => setOpen(false);

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [open]);

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const width = 292;
    const left = Math.max(10, Math.min(window.innerWidth - width - 10, rect.right - width));
    const top = Math.max(10, Math.min(window.innerHeight - 460, rect.bottom + 8));
    setPosition({ left, top });
    setOpen(previous => !previous);
  };

  const run = (action: () => void) => {
    action();
    setOpen(false);
  };

  const handleFavorite = () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    dispatch(toggleLike(song.id, user.id));
  };

  const shareTrack = async () => {
    const url = getSongUrl(song);
    if (navigator.share) {
      await navigator.share({ title: song.name, text: song.credited_artists || 'Juice WRLD', url });
      return;
    }

    await navigator.clipboard?.writeText(url);
  };

  const artist = (song.credited_artists || '').split(/,|&| x | and /i)[0]?.trim();
  const items: MenuItem[] = [
    ...(variant === 'queue' && typeof queueIndex === 'number'
      ? [
          { label: 'Remove from Queue', icon: Trash2, onClick: () => dispatch(removeFromQueue(queueIndex)) },
          ...(canMoveToTop
            ? [{ label: 'Move to Top', icon: ArrowUp, onClick: () => dispatch(moveQueueItemToTop(queueIndex)) }]
            : []),
        ]
      : []),
    {
      label: 'Play Next',
      icon: ListPlus,
      dividerBefore: variant === 'queue',
      onClick: () => {
        if (variant === 'queue' && typeof queueIndex === 'number') {
          dispatch(moveQueueItemToTop(queueIndex));
          return;
        }
        dispatch(playNext(actionTrack));
      },
    },
    {
      label: 'Play Later',
      icon: ListEnd,
      onClick: () => {
        if (variant === 'queue' && typeof queueIndex === 'number') {
          dispatch(moveQueueItemToEnd(queueIndex));
          return;
        }
        dispatch(playLater(actionTrack));
      },
    },
    {
      label: 'Start Radio',
      icon: Radio,
      onClick: () => {
        dispatch(setShuffle(true));
        void startRadio();
      },
    },
    {
      label: isLiked ? 'Unfavorite' : 'Favorite',
      icon: Star,
      dividerBefore: true,
      onClick: handleFavorite,
    },
    {
      label: 'Properties',
      icon: Info,
      onClick: () => navigate(`/song/${song.public_id || song.id}`),
    },
    ...(artist
      ? [{
          label: 'Go to Artist',
          icon: UserRound,
          dividerBefore: true,
          onClick: () => navigate(`/browse?search=${encodeURIComponent(artist)}`),
        }]
      : []),
    ...(song.era?.name
      ? [{
          label: 'Go to Album',
          icon: Album,
          onClick: () => navigate(`/browse?era=${encodeURIComponent(song.era.name)}`),
        }]
      : []),
    {
      label: 'Share',
      icon: Share2,
      dividerBefore: true,
      onClick: () => { void shareTrack(); },
    },
  ];

  return (
    <span className={`track-action-shell ${visible || open ? 'visible' : ''}`} onClick={event => event.stopPropagation()}>
      <button
        ref={triggerRef}
        className={`track-action-trigger ${open ? 'active' : ''}`}
        onClick={openMenu}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${song.name}`}
        title="More"
      >
        <MoreHorizontal size={17} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="track-action-menu"
          style={{ top: position.top, left: position.left }}
          role="menu"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={`${item.label}-${index}`}
                className={item.dividerBefore ? 'has-divider' : ''}
                onClick={() => run(item.onClick)}
                type="button"
                role="menuitem"
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.label === 'Play Later' && <Clock3 size={13} className="menu-trailing-icon" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </span>
  );
};

export default TrackActionMenu;
