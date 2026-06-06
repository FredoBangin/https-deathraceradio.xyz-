import type { Song } from '../types';

export interface TimedLyricLine {
  time: number | null;
  text: string;
}

const syncedLyricsBySongId: Record<number, string> = {};

const timestampPattern = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

const parseTimestamp = (minutes: string, seconds: string, fraction?: string) => {
  const fractionSeconds = fraction
    ? Number(`0.${fraction.padEnd(3, '0').slice(0, 3)}`)
    : 0;

  return Number(minutes) * 60 + Number(seconds) + fractionSeconds;
};

export const parseLyricLines = (lyrics?: string): TimedLyricLine[] => {
  if (!lyrics) return [];

  const lines = lyrics.replace(/\r\n/g, '\n').split('\n');
  const parsedLines = lines.reduce<TimedLyricLine[]>((acc, line) => {
    const matches = Array.from(line.matchAll(timestampPattern));
    const text = line.replace(timestampPattern, '').trim();

    if (!matches.length) {
      if (text) acc.push({ time: null, text });
      return acc;
    }

    acc.push(...matches
      .map(match => ({
        time: parseTimestamp(match[1], match[2], match[3]),
        text,
      }))
      .filter(line => line.text));

    return acc;
  }, []);

  return parsedLines.sort((a, b) => {
    if (a.time === null && b.time === null) return 0;
    if (a.time === null) return 1;
    if (b.time === null) return -1;
    return a.time - b.time;
  });
};

export const getLyricLinesForSong = (song?: Song): TimedLyricLine[] => {
  if (!song) return [];

  return parseLyricLines(syncedLyricsBySongId[song.id] || song.lyrics);
};

export const hasSyncedLyricLines = (lines: TimedLyricLine[]) =>
  lines.some(line => typeof line.time === 'number');
