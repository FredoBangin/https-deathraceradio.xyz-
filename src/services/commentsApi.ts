import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { TrackComment } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== 'object') return fallback;
  return (error as { message?: string }).message || fallback;
};

type AddCommentInput = Omit<TrackComment, 'id' | 'created_at' | 'updated_at' | 'status'>;

export const commentsApi = createApi({
  reducerPath: 'commentsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Comment'],
  endpoints: (builder) => ({
    getCommentsBySongId: builder.query<TrackComment[], number>({
      queryFn: async (songId) => {
        if (!isSupabaseConfigured || !supabase) {
          return { error: 'Comments are unavailable because Supabase is not configured.' };
        }

        try {
          const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('song_api_id', songId)
            .eq('status', 'active')
            .order('comment_time_seconds', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: true });

          if (error) throw error;
          return { data: data as TrackComment[] };
        } catch (err: unknown) {
          return { error: getApiErrorMessage(err, 'Error fetching comments') };
        }
      },
      providesTags: (result, _error, songId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Comment' as const, id })),
              { type: 'Comment', id: `LIST-${songId}` },
            ]
          : [{ type: 'Comment', id: `LIST-${songId}` }],
    }),
    addComment: builder.mutation<TrackComment, AddCommentInput>({
      queryFn: async (newComment) => {
        if (!isSupabaseConfigured || !supabase) {
          return { error: 'Comments are unavailable because Supabase is not configured.' };
        }

        try {
          const insertComment = {
            song_api_id: newComment.song_api_id,
            song_name: newComment.song_name,
            user_id: newComment.user_id,
            author_name: newComment.author_name,
            body: newComment.body,
            comment_time_seconds: newComment.comment_time_seconds ?? null,
          };

          const { data, error } = await supabase
            .from('comments')
            .insert(insertComment)
            .select()
            .single();

          if (error) throw error;
          return { data: data as TrackComment };
        } catch (err: unknown) {
          return { error: getApiErrorMessage(err, 'Error adding comment') };
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Comment', id: `LIST-${arg.song_api_id}` },
      ],
    }),
  }),
});

export const {
  useGetCommentsBySongIdQuery,
  useAddCommentMutation,
} = commentsApi;
