import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Song, Era } from '../types';

interface SongsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Song[];
}

interface ErasResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Era[];
}

interface StatsResponse {
  total_songs: number;
  category_stats: {
    released: number;
    unreleased: number;
    unsurfaced: number;
    recording_session: number;
    [key: string]: number;
  };
  era_stats: {
    [key: string]: number;
  };
}

interface CategoriesResponse {
  categories: {
    value: string;
    label: string;
  }[];
}

export const juicewrldApi = createApi({
  reducerPath: 'juicewrldApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://juicewrldapi.com/juicewrld/' }),
  endpoints: (builder) => ({
    getSongs: builder.query<
      SongsResponse,
      {
        page?: number;
        page_size?: number;
        category?: string;
        era?: string;
        search?: string;
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.page_size) queryParams.append('page_size', params.page_size.toString());
        if (params.category) queryParams.append('category', params.category);
        if (params.era) queryParams.append('era', params.era);
        if (params.search) queryParams.append('search', params.search);
        
        return `songs/?${queryParams.toString()}`;
      },
    }),
    getSongById: builder.query<Song, string | number>({
      query: (id) => `songs/${id}/`,
    }),
    getEras: builder.query<ErasResponse, { page?: number; page_size?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
        return `eras/?${queryParams.toString()}`;
      },
    }),
    getStats: builder.query<StatsResponse, void>({
      query: () => 'stats/',
    }),
    getCategories: builder.query<CategoriesResponse, void>({
      query: () => 'categories/',
    }),
  }),
});

export const {
  useGetSongsQuery,
  useGetSongByIdQuery,
  useGetErasQuery,
  useGetStatsQuery,
  useGetCategoriesQuery,
} = juicewrldApi;
