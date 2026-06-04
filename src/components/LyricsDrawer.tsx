import React from 'react';
import { X } from 'lucide-react';
import type { Song } from '../types';

interface LyricsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
}

export const LyricsDrawer: React.FC<LyricsDrawerProps> = ({ isOpen, onClose, song }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            zIndex: 998, cursor: 'pointer',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '420px',
        zIndex: 999,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-24px 0 60px rgba(0,0,0,0.5)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{song.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{song.credited_artists || 'Juice WRLD'}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="custom-scroll" style={{ flex: 1, padding: '22px', overflowY: 'auto' }}>
          {song.lyrics ? (
            <pre style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              lineHeight: '1.8',
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              fontWeight: 400,
            }}>
              {song.lyrics}
            </pre>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              No lyrics available for this track.
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export default LyricsDrawer;
