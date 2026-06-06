import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { TrackComment } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_COMMENTS_KEY = 'mock_track_comments';

const getLocalComments = (): TrackComment[] => {
  const saved = localStorage.getItem(LOCAL_COMMENTS_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as TrackComment[];
  } catch {
    return [];
  }
};

const saveLocalComments = (comments: TrackComment[]) => {
  localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(comments));
};

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
        if (isSupabaseConfigured && supabase) {
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
        }

        const local = getLocalComments()
          .filter(comment => comment.song_api_id === songId && comment.status !== 'removed')
          .sort((a, b) => {
            const aTime = typeof a.comment_time_seconds === 'number' ? a.comment_time_seconds : Number.MAX_SAFE_INTEGER;
            const bTime = typeof b.comment_time_seconds === 'number' ? b.comment_time_seconds : Number.MAX_SAFE_INTEGER;
            if (aTime !== bTime) return aTime - bTime;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });

        return { data: local };
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
        const timestamp = new Date().toISOString();
        const fullComment: TrackComment = {
          ...newComment,
          id: crypto.randomUUID(),
          created_at: timestamp,
          updated_at: timestamp,
          status: 'active',
        };

        if (isSupabaseConfigured && supabase) {
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
        }

        const local = getLocalComments();
        local.push(fullComment);
        saveLocalComments(local);
        return { data: fullComment };
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
