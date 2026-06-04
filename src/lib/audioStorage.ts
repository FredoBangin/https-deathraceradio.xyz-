import { supabase } from './supabase';

export async function getSignedSongsUrl(filePath: string): Promise<string> {
  if (!supabase) return '';
  try {
    const { data, error } = await supabase.storage
      .from('songs')
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.warn('[Storage] createSignedUrl failed for', filePath, error.message);
      const { data: publicData } = supabase.storage.from('songs').getPublicUrl(filePath);
      return publicData?.publicUrl || '';
    }

    return data?.signedUrl || '';
  } catch (err) {
    console.warn('[Storage] getSignedUrl error:', err);
    return '';
  }
}

export function getSongsStoragePathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathMarker = '/storage/v1/object/';
    const markerIndex = parsed.pathname.indexOf(pathMarker);
    if (markerIndex === -1) return null;

    const objectPath = parsed.pathname.slice(markerIndex + pathMarker.length);
    const bucketPath = objectPath.replace(/^(public|sign|authenticated)\//, '');
    if (!bucketPath.startsWith('songs/')) return null;

    return decodeURIComponent(bucketPath.slice('songs/'.length));
  } catch {
    return null;
  }
}

const AUDIO_EXTENSIONS = ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'opus'];
const JUICEWRLD_API_BASE_URL = 'https://juicewrldapi.com/juicewrld';
export function isAudioPath(path?: string) {
  if (!path) return false;
  const extension = path.split('?')[0].split('.').pop()?.toLowerCase();
  return Boolean(extension && AUDIO_EXTENSIONS.includes(extension));
}

export function getApiAudioUrl(path?: string) {
  if (!isAudioPath(path)) return '';
  return `${JUICEWRLD_API_BASE_URL}/files/download/?path=${encodeURIComponent(path || '')}`;
}
