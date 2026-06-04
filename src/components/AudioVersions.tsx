import React from 'react';
import { Play, Pause, Download, Calendar, User, Plus, Music } from 'lucide-react';
import type { Song, Upload } from '../types';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { playTrack, pauseTrack, resumeTrack } from '../features/player/playerSlice';
import { useIncrementDownloadCountMutation } from '../../src/services/uploadsApi';

interface AudioVersionsProps {
  song: Song;
  uploads: Upload[] | undefined;
  isLoading: boolean;
  onOpenUpload: () => void;
}

export const AudioVersions: React.FC<AudioVersionsProps> = ({ song, uploads, isLoading, onOpenUpload }) => {
  const dispatch = useAppDispatch();
  const { currentTrack, isPlaying } = useAppSelector((state) => state.player);
  const [incrementDownload] = useIncrementDownloadCountMutation();

  const handlePlayVersion = (upload: Upload) => {
    const isCurrentUpload = currentTrack?.upload?.id === upload.id;
    if (isCurrentUpload) {
      if (isPlaying) dispatch(pauseTrack());
      else dispatch(resumeTrack());
    } else {
      dispatch(playTrack({ track: { song, upload } }));
    }
  };

  const isPlayingUpload = (uploadId: string) => currentTrack?.upload?.id === uploadId && isPlaying;

  if (isLoading) {
    return <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '12px 0' }}>Loading versions...</div>;
  }

  const versions = uploads || [];

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          Community uploads
          <span style={{ fontSize: '12px', background: 'var(--bg-secondary)', padding: '1px 8px', borderRadius: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {versions.length}
          </span>
        </h3>
        <button onClick={onOpenUpload} className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }}>
          <Plus size={13} />
          Add upload
        </button>
      </div>

      {versions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '32px',
          background: 'var(--bg-card)',
          borderRadius: '4px',
          border: '1px dashed var(--border)',
        }}>
          <Music size={28} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>No community uploads yet</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '14px' }}>
            Add a file here only for alternate versions or newly added audio.
          </p>
          <button onClick={onOpenUpload} className="btn btn-primary" style={{ fontSize: '13px' }}>
            Add audio
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {versions.map((ver) => {
            const active = isPlayingUpload(ver.id);
            return (
              <div
                key={ver.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  background: active ? 'var(--accent-light)' : 'var(--bg-card)',
                  border: '1px solid',
                  borderColor: active ? 'rgba(255,85,0,0.3)' : 'var(--border)',
                  borderRadius: '4px',
                  transition: 'all 0.12s',
                }}
              >
                {/* Play button */}
                <button
                  onClick={() => handlePlayVersion(ver)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: active ? 'var(--accent)' : 'var(--bg-secondary)',
                    border: '1px solid',
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: active ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.12s',
                  }}
                >
                  {active ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" style={{ marginLeft: '1px' }} />}
                </button>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: active ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ver.file_name}
                    {ver.notes && <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '6px', fontStyle: 'italic' }}>"{ver.notes}"</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
                    <span className="badge badge-session" style={{ fontSize: '10px' }}>{ver.quality || 'MP3'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={11} /> {ver.uploader_name || 'Anonymous'}
                    </span>
                    {ver.upload_date && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} /> {new Date(ver.upload_date).toLocaleDateString()}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ver.play_count || 0} plays</span>
                  </div>
                </div>

                {/* Download */}
                <a
                  href={ver.audio_url}
                  download={ver.file_name}
                  onClick={() => incrementDownload(ver.id)}
                  style={{
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px',
                    borderRadius: '3px',
                    flexShrink: 0,
                  }}
                  title="Download"
                >
                  <Download size={15} />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default AudioVersions;
