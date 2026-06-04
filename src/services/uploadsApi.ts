import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Upload } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Helper for local mock uploads
const getLocalUploads = (): Upload[] => {
  const saved = localStorage.getItem('mock_uploads');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

const saveLocalUploads = (uploads: Upload[]) => {
  localStorage.setItem('mock_uploads', JSON.stringify(uploads));
};

export const uploadsApi = createApi({
  reducerPath: 'uploadsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Upload'],
  endpoints: (builder) => ({
    getUploadsBySongId: builder.query<Upload[], number>({
      queryFn: async (songId) => {
        if (isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase
              .from('uploads')
              .select('*')
              .eq('song_api_id', songId)
              .eq('status', 'active')
              .order('upload_date', { ascending: false });

            if (error) throw error;
            return { data: data as Upload[] };
          } catch (err: any) {
            return { error: err.message || 'Error fetching uploads' };
          }
        } else {
          // Local demo mode
          const local = getLocalUploads();
          const filtered = local.filter((u) => u.song_api_id === songId && u.status !== 'removed');
          return { data: filtered };
        }
      },
      providesTags: (result, _error, songId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Upload' as const, id })),
              { type: 'Upload', id: `LIST-${songId}` },
            ]
          : [{ type: 'Upload', id: `LIST-${songId}` }],
    }),
    getAllUploads: builder.query<Upload[], void>({
      queryFn: async () => {
        if (isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase
              .from('uploads')
              .select('*')
              .eq('status', 'active')
              .order('upload_date', { ascending: false });

            if (error) throw error;
            return { data: data as Upload[] };
          } catch (err: any) {
            return { error: err.message || 'Error fetching uploads' };
          }
        } else {
          // Local demo mode
          const local = getLocalUploads().filter(u => u.status !== 'removed');
          return { data: local };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Upload' as const, id })),
              { type: 'Upload', id: 'LIST' },
            ]
          : [{ type: 'Upload', id: 'LIST' }],
    }),
    addUpload: builder.mutation<Upload, Omit<Upload, 'id' | 'upload_date' | 'play_count' | 'download_count' | 'status'>>({
      queryFn: async (newUpload) => {
        const id = crypto.randomUUID();
        const uploadDate = new Date().toISOString();
        const fullUpload: Upload = {
          ...newUpload,
          id,
          upload_date: uploadDate,
          play_count: 0,
          download_count: 0,
          status: 'active',
        };

        if (isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase
              .from('uploads')
              .insert(fullUpload)
              .select()
              .single();

            if (error) throw error;
            return { data: data as Upload };
          } catch (err: any) {
            return { error: err.message || 'Error adding upload' };
          }
        } else {
          // Local demo mode
          const local = getLocalUploads();
          local.unshift(fullUpload);
          saveLocalUploads(local);
          return { data: fullUpload };
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Upload', id: 'LIST' },
        { type: 'Upload', id: `LIST-${arg.song_api_id}` },
      ],
    }),
    incrementPlayCount: builder.mutation<void, string>({
      queryFn: async (uploadId) => {
        if (isSupabaseConfigured && supabase) {
          try {
            // Note: In real app, we can use rpc increment, or standard update
            const { data: current } = await supabase
              .from('uploads')
              .select('play_count')
              .eq('id', uploadId)
              .single();
            const newCount = (current?.play_count || 0) + 1;
            
            await supabase
              .from('uploads')
              .update({ play_count: newCount })
              .eq('id', uploadId);

            return { data: undefined };
          } catch (err: any) {
            return { error: err.message || 'Error incrementing play' };
          }
        } else {
          const local = getLocalUploads();
          const found = local.find(u => u.id === uploadId);
          if (found) {
            found.play_count = (found.play_count || 0) + 1;
            saveLocalUploads(local);
          }
          return { data: undefined };
        }
      },
      invalidatesTags: (_result, _error, arg) => [{ type: 'Upload', id: arg }],
    }),
    incrementDownloadCount: builder.mutation<void, string>({
      queryFn: async (uploadId) => {
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: current } = await supabase
              .from('uploads')
              .select('download_count')
              .eq('id', uploadId)
              .single();
            const newCount = (current?.download_count || 0) + 1;
            
            await supabase
              .from('uploads')
              .update({ download_count: newCount })
              .eq('id', uploadId);

            return { data: undefined };
          } catch (err: any) {
            return { error: err.message || 'Error incrementing download' };
          }
        } else {
          const local = getLocalUploads();
          const found = local.find(u => u.id === uploadId);
          if (found) {
            found.download_count = (found.download_count || 0) + 1;
            saveLocalUploads(local);
          }
          return { data: undefined };
        }
      },
      invalidatesTags: (_result, _error, arg) => [{ type: 'Upload', id: arg }],
    }),
  }),
});

export const {
  useGetUploadsBySongIdQuery,
  useGetAllUploadsQuery,
  useAddUploadMutation,
  useIncrementPlayCountMutation,
  useIncrementDownloadCountMutation,
} = uploadsApi;
