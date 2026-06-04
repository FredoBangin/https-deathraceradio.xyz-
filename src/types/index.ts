export interface Era {
  id: number;
  name: string;
  description?: string;
  time_frame?: string;
  play_count?: number;
}

export interface GroupbuyInfo {
  additional_info?: string;
  price?: string;
  start_date?: string;
  end_date?: string;
  blind?: boolean;
  finished?: boolean;
  surfaced_with_og?: boolean;
}

export interface Song {
  id: number;
  public_id: number;
  name: string;
  original_key?: string;
  category: string;
  era: Era;
  path?: string;
  track_titles?: string[];
  credited_artists?: string;
  producers?: string;
  engineers?: string;
  recording_locations?: string;
  record_dates?: string;
  length?: string;
  bitrate?: string;
  additional_information?: string;
  file_names?: string;
  instrumentals?: string;
  preview_date?: string;
  release_date?: string;
  dates?: string;
  session_titles?: string;
  session_tracking?: string;
  instrumental_names?: string;
  groupbuy_info?: GroupbuyInfo;
  lyrics?: string;
  snippets?: string[];
  date_leaked?: string;
  leak_type?: string;
  image_url?: string;
}

export interface Upload {
  id: string; // uuid from Supabase
  song_api_id: number;
  song_name: string;
  era_name: string;
  category: string;
  audio_url: string;
  file_name: string;
  file_size?: number;
  duration?: number;
  uploader_id?: string;
  uploader_name?: string;
  upload_date?: string;
  play_count?: number;
  download_count?: number;
  quality?: string; // e.g. "320kbps", "WAV", "CDQ"
  notes?: string; // e.g. "CDQ version", "fan rip"
  status?: string; // active | removed
}

export interface Like {
  id: string;
  user_id: string;
  song_api_id: number;
}

export interface UserSession {
  id: string;
  email: string;
  user_metadata?: {
    username?: string;
    [key: string]: any;
  };
}
