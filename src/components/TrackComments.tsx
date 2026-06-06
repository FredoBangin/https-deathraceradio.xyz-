import React, { useMemo, useState } from 'react';
import { Clock3, MessageSquare, Send, UserRound } from './AppIcon';
import { AppCheckbox } from './AppCheckbox';
import type { Song } from '../types';
import { useAddCommentMutation, useGetCommentsBySongIdQuery } from '../services/commentsApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { getDisplayNameFromUser } from '../lib/supabase';
import { isAudioPath } from '../lib/audioStorage';
import { playTrack, resumeTrack, seekToTime } from '../features/player/playerSlice';

interface TrackCommentsProps {
  song: Song;
  onOpenAuth: () => void;
}

const formatTime = (seconds?: number | null) => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return null;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const parseLengthToSeconds = (length?: string) => {
  if (!length) return 0;
  const parts = length.split(':').map(part => Number(part));
  if (parts.some(Number.isNaN)) return 0;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
};

const getCommentErrorMessage = (error: unknown) => {
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return 'Could not post comment.';

  const errorLike = error as {
    data?: { message?: string };
    error?: string;
    message?: string;
  };

  return errorLike.data?.message || errorLike.message || errorLike.error || 'Could not post comment.';
};

export const TrackComments: React.FC<TrackCommentsProps> = ({ song, onOpenAuth }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { currentTrack, duration, isPlaying, progress } = useAppSelector(state => state.player);
  const { data: comments, isLoading } = useGetCommentsBySongIdQuery(song.id);
  const [addComment, { isLoading: isPosting }] = useAddCommentMutation();
  const [body, setBody] = useState('');
  const [attachTime, setAttachTime] = useState(true);
  const [commentError, setCommentError] = useState<string | null>(null);
  const isCurrentSong = currentTrack?.song.id === song.id;
  const canUseTimedComments = isAudioPath(song.path);
  const canAttachTime = canUseTimedComments && isCurrentSong && progress > 0;
  const currentTime = canAttachTime ? Math.max(0, Math.floor(progress)) : null;
  const displayName = getDisplayNameFromUser(user);

  const commentsCount = comments?.length || 0;
  const sortedComments = useMemo(() => comments || [], [comments]);
  const timedComments = useMemo(
    () => sortedComments.filter(comment => typeof comment.comment_time_seconds === 'number'),
    [sortedComments]
  );
  const timelineDuration = isCurrentSong && duration > 0 ? duration : parseLengthToSeconds(song.length);
  const activeTimedComment = isCurrentSong
    ? timedComments.findLast(comment => (
        typeof comment.comment_time_seconds === 'number' &&
        comment.comment_time_seconds <= progress + 0.35
      ))
    : undefined;
  const progressPercent = isCurrentSong && timelineDuration > 0
    ? Math.max(0, Math.min(100, (progress / timelineDuration) * 100))
    : 0;
  const hasTimeline = timedComments.length > 0 && timelineDuration > 0;
  const timeCheckboxLabel = !canUseTimedComments
    ? 'Timestamps need playable audio'
    : canAttachTime
      ? `At ${formatTime(currentTime)}`
      : 'Play this track to timestamp';

  const handleSeekToComment = (seconds: number) => {
    if (!canUseTimedComments) return;

    if (!isCurrentSong) {
      dispatch(playTrack({ track: { song } }));
    } else if (!isPlaying) {
      dispatch(resumeTrack());
    }

    dispatch(seekToTime({ time: seconds, songId: song.id }));
  };

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    setCommentError(null);
    const trimmedBody = body.trim();

    if (!user) {
      onOpenAuth();
      setCommentError('Sign in before posting a comment.');
      return;
    }

    if (!trimmedBody) {
      setCommentError('Write a comment before posting.');
      return;
    }

    try {
      await addComment({
        song_api_id: song.id,
        song_name: song.name,
        user_id: user.id,
        author_name: displayName,
        body: trimmedBody,
        comment_time_seconds: attachTime && canAttachTime ? currentTime : null,
      }).unwrap();

      setBody('');
    } catch (error: unknown) {
      const message = getCommentErrorMessage(error);
      const needsSetupHint = /comments|permission|policy|schema|relation|grant|row-level|rls/i.test(message);
      setCommentError(
        `${message}${needsSetupHint ? ' Make sure the comments SQL in supabase_setup.sql has been applied.' : ''}`
      );
    }
  };

  return (
    <section className="track-comments">
      <div className="track-comments-header">
        <h3>
          Comments
          <span>{commentsCount}</span>
        </h3>
      </div>

      <form className="track-comment-form" onSubmit={submitComment}>
        <div className="track-comment-avatar">
          {user ? displayName[0].toUpperCase() : <UserRound size={15} />}
        </div>
        <div className="track-comment-compose">
          <textarea
            value={body}
            onChange={event => setBody(event.target.value)}
            placeholder={user ? 'Leave a comment on this track...' : 'Sign in to comment on this track...'}
            rows={3}
            onFocus={() => {
              if (!user) onOpenAuth();
            }}
          />
          {commentError && <div className="track-comment-error">{commentError}</div>}
          <div className="track-comment-compose-footer">
            <AppCheckbox
              checked={attachTime}
              disabled={!canAttachTime}
              onCheckedChange={setAttachTime}
              className={`track-comment-time-check ${!canAttachTime ? 'disabled' : ''}`}
              variant="soft"
              size="sm"
            >
              <Clock3 size={13} />
              <span>{timeCheckboxLabel}</span>
            </AppCheckbox>
            <button type="submit" disabled={isPosting || (Boolean(user) && !body.trim())}>
              <Send size={14} />
              {!user ? 'Sign in' : isPosting ? 'Posting' : 'Post'}
            </button>
          </div>
        </div>
      </form>

      {hasTimeline && (
        <div className={`track-comment-timeline ${canUseTimedComments ? 'is-clickable' : 'is-disabled'}`}>
          <div className="track-comment-timeline-header">
            <span>{canUseTimedComments ? 'Timed comments' : 'Timed comments unavailable'}</span>
            {isCurrentSong && <strong>{formatTime(progress)}</strong>}
          </div>
          <div className="track-comment-timeline-bar" aria-hidden={!canUseTimedComments}>
            <span className="track-comment-timeline-fill" style={{ width: `${progressPercent}%` }} />
            {timedComments.map(comment => {
              const commentTime = typeof comment.comment_time_seconds === 'number' ? comment.comment_time_seconds : 0;
              const markerLeft = timelineDuration > 0
                ? Math.max(0, Math.min(100, (commentTime / timelineDuration) * 100))
                : 0;
              const isActive = activeTimedComment?.id === comment.id;

              return (
                <button
                  key={`marker-${comment.id}`}
                  type="button"
                  className={`track-comment-marker ${isActive ? 'active' : ''}`}
                  style={{ '--marker-left': `${markerLeft}%` } as React.CSSProperties}
                  disabled={!canUseTimedComments}
                  onClick={() => handleSeekToComment(commentTime)}
                  title={canUseTimedComments ? `Jump to ${formatTime(commentTime)}` : 'No playable audio for this track'}
                >
                  <span>{comment.author_name[0]?.toUpperCase() || 'U'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="track-comments-list">
        {isLoading ? (
          <div className="track-comments-empty">Loading comments...</div>
        ) : sortedComments.length === 0 ? (
          <div className="track-comments-empty">
            <MessageSquare size={28} />
            <strong>No comments yet</strong>
            <span>Start the track and leave the first timestamped note.</span>
          </div>
        ) : (
          sortedComments.map(comment => {
            const commentTime = formatTime(comment.comment_time_seconds);
            const canSeekComment = canUseTimedComments && typeof comment.comment_time_seconds === 'number';
            const isActiveComment = activeTimedComment?.id === comment.id;
            return (
              <article key={comment.id} className={`track-comment ${isActiveComment ? 'is-live' : ''}`}>
                <div className="track-comment-avatar">{comment.author_name[0]?.toUpperCase() || 'U'}</div>
                <div>
                  <header>
                    <strong>{comment.author_name}</strong>
                    {commentTime && (
                      canSeekComment ? (
                        <button
                          type="button"
                          className="track-comment-time-button"
                          onClick={() => handleSeekToComment(comment.comment_time_seconds || 0)}
                          title={`Jump to ${commentTime}`}
                        >
                          {commentTime}
                        </button>
                      ) : (
                        <span className="track-comment-time-badge" title="No playable audio for this track">{commentTime}</span>
                      )
                    )}
                    <time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString()}</time>
                  </header>
                  <p>{comment.body}</p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};

export default TrackComments;
