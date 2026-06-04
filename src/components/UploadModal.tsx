import React, { useState, useEffect } from 'react';
import { X, UploadCloud, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { closeUploadModal, setUploadProgress, startUploading, uploadSuccess, uploadFailure } from '../features/upload/uploadSlice';
import { useGetSongByIdQuery, useGetSongsQuery } from '../services/juicewrldApi';
import { useAddUploadMutation } from '../services/uploadsApi';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const UploadModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOpen, selectedSongId, uploading, progress, error, success } = useAppSelector((state) => state.upload);
  const { user } = useAppSelector((state) => state.auth);
  
  const [addUpload] = useAddUploadMutation();

  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState('320kbps');
  const [notes, setNotes] = useState('');
  
  // Search state if song not pre-selected
  const [songSearch, setSongSearch] = useState('');
  const [chosenSongId, setChosenSongId] = useState<number | null>(null);

  // Queries
  const { data: preselectedSong } = useGetSongByIdQuery(selectedSongId || '', { skip: !selectedSongId });
  const { data: searchResults } = useGetSongsQuery({ search: songSearch, page_size: 5 }, { skip: !!selectedSongId || !songSearch });

  const activeSong = preselectedSong || (searchResults?.results.find(s => s.id === chosenSongId) || null);

  useEffect(() => {
    if (selectedSongId) {
      setChosenSongId(selectedSongId);
    }
  }, [selectedSongId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !activeSong || !user) return;

    dispatch(startUploading());

    let audioUrl = '';
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    try {
      if (isSupabaseConfigured && supabase) {
        // Upload to Supabase Storage
        dispatch(setUploadProgress(10));
        
        const { error: storageError } = await supabase.storage
          .from('songs')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (storageError) throw storageError;

        dispatch(setUploadProgress(60));

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('songs')
          .getPublicUrl(fileName);

        audioUrl = publicUrl;
      } else {
        // Local demo mode: create an Object URL that exists in-memory
        dispatch(setUploadProgress(40));
        audioUrl = URL.createObjectURL(file);
        dispatch(setUploadProgress(80));
      }

      // Add to database / localStorage
      await addUpload({
        song_api_id: activeSong.id,
        song_name: activeSong.name,
        era_name: activeSong.era?.name || 'Unknown',
        category: activeSong.category,
        audio_url: audioUrl,
        file_name: file.name,
        file_size: file.size,
        quality,
        notes,
        uploader_id: user.id,
        uploader_name: user.user_metadata?.username || user.email.split('@')[0],
      }).unwrap();

      dispatch(uploadSuccess());
      // Clean form
      setFile(null);
      setNotes('');
    } catch (err: any) {
      console.error(err);
      dispatch(uploadFailure(err.message || 'Upload failed. Ensure the "songs" bucket exists in Supabase.'));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '520px',
          borderRadius: '16px',
          padding: '32px',
          position: 'relative',
          boxShadow: '0 18px 60px rgba(0,0,0,0.65)',
          border: '1px solid var(--border)'
        }}
      >
        <button
          onClick={() => dispatch(closeUploadModal())}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>
          Add community audio
        </h2>

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 0', gap: '16px' }}>
            <CheckCircle size={56} style={{ color: '#10b981' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff' }}>Upload complete</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Your file was added to the selected track.
            </p>
            <button onClick={() => dispatch(closeUploadModal())} className="btn btn-primary" style={{ width: '150px', marginTop: '12px' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Song Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Match to catalog track
              </label>
              {selectedSongId && activeSong ? (
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontWeight: 500 }}>
                  {activeSong.name} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>({activeSong.era?.name})</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Search the catalog..."
                    value={songSearch}
                    onChange={(e) => setSongSearch(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  {searchResults?.results && searchResults.results.length > 0 && !chosenSongId && (
                    <div className="glass" style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: '180px', overflowY: 'auto' }}>
                      {searchResults.results.map((song) => (
                        <div
                          key={song.id}
                          onClick={() => {
                            setChosenSongId(song.id);
                            setSongSearch(song.name);
                          }}
                          style={{ padding: '10px 16px', cursor: 'pointer', transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                          className="search-row-select"
                        >
                          <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>{song.name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>({song.era?.name})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {chosenSongId && activeSong && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--accent-light)', border: '1px solid rgba(255,85,0,0.2)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#fff' }}>Selected: <strong>{activeSong.name}</strong></span>
                      <button type="button" onClick={() => { setChosenSongId(null); setSongSearch(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drag and Drop Dropzone */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Audio File (.mp3 / .wav)
              </label>
              <div
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '12px',
                  padding: '32px 16px',
                  textAlign: 'center',
                  background: 'var(--bg-input)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'border 0.2s'
                }}
                className="dropzone"
              >
                <input
                  type="file"
                  accept="audio/mp3, audio/mpeg, audio/wav, audio/x-wav"
                  onChange={handleFileChange}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
                <UploadCloud size={36} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
                {file ? (
                  <div>
                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>{file.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB · Click or drag to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Drop an MP3 or WAV file here</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>or click to browse local files</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inputs: Quality & Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Audio Quality
                </label>
                <select value={quality} onChange={(e) => setQuality(e.target.value)} style={{ width: '100%', height: '42px' }}>
                  <option value="320kbps">320 kbps (High MP3)</option>
                  <option value="192kbps">192 kbps (Medium MP3)</option>
                  <option value="128kbps">128 kbps (Low MP3)</option>
                  <option value="WAV">WAV (Lossless)</option>
                  <option value="CDQ">CDQ</option>
                  <option value="Snippet">Snippet / Preview</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Version notes
                </label>
                <input
                  type="text"
                  placeholder="CDQ, edit, notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', height: '42px' }}
                />
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader size={14} className="spin-slow" />
                    Uploading audio...
                  </span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{progress}%</span>
                </div>
                <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px', transition: 'width 0.2s ease' }} />
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!file || !activeSong}
                className="btn btn-primary"
                style={{ width: '100%', height: '44px', marginTop: '12px', opacity: (!file || !activeSong) ? 0.6 : 1 }}
              >
                Add audio
              </button>
            )}
          </form>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .search-row-select:hover {
          background: var(--accent-light) !important;
        }
        .dropzone:hover {
          border-color: var(--accent) !important;
        }
      `}} />
    </div>
  );
};
export default UploadModal;
