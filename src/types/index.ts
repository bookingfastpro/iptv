// ─── Authentication ──────────────────────────────────────────────────────────

export interface Credentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface ServerProfile {
  id: string;
  name: string;
  serverUrl: string;
  username: string;
  password: string;
  createdAt: number;
}

export interface UserInfo {
  username: string;
  password: string;
  message: string;
  auth: number;
  status: string;
  exp_date: string;
  is_trial: string;
  active_cons: string;
  created_at: string;
  max_connections: string;
  allowed_output_formats: string[];
}

export interface ServerInfo {
  xui: boolean;
  version: string;
  revision: number;
  url: string;
  port: string;
  https_port: string;
  server_protocol: string;
  rtmp_port: string;
  timestamp_now: number;
  time_now: string;
  timezone: string;
}

export interface AuthResponse {
  user_info: UserInfo;
  server_info: ServerInfo;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

// ─── Live TV ─────────────────────────────────────────────────────────────────

export interface LiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface EpgEntry {
  id: string;
  epg_id: string;
  title: string;
  lang: string;
  start: string;
  end: string;
  description: string;
  channel_id: string;
  start_timestamp: number;
  stop_timestamp: number;
}

export interface EpgResponse {
  epg_listings: EpgEntry[];
}

// ─── VOD (Movies) ─────────────────────────────────────────────────────────────

export interface VodStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

export interface VodInfo {
  info: {
    kinopoisk_url: string;
    tmdb_id: string;
    name: string;
    o_name: string;
    cover_big: string;
    movie_image: string;
    releasedate: string;
    episode_run_time: string;
    youtube_trailer: string;
    director: string;
    actors: string;
    cast: string;
    description: string;
    plot: string;
    age: string;
    mpaa_rating: string;
    rating_count_kinopoisk: number;
    country: string;
    genre: string;
    backdrop_path: string[];
    duration_secs: number;
    duration: string;
    video: Record<string, unknown>;
    audio: Record<string, unknown>;
    bitrate: number;
    rating: number;
  };
  movie_data: {
    stream_id: number;
    name: string;
    added: string;
    category_id: string;
    container_extension: string;
    custom_sid: string;
    direct_source: string;
  };
}

// ─── Series ──────────────────────────────────────────────────────────────────

export interface SeriesStream {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string[];
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
}

export interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info: {
    tmdb_id: number;
    releasedate: string;
    plot: string;
    duration_secs: number;
    duration: string;
    movie_image: string;
    bitrate: number;
    rating: number;
  };
  custom_sid: string;
  added: string;
  season: number;
  direct_source: string;
}

export interface Season {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  season_number: number;
  cover: string;
  cover_big: string;
}

export interface SeriesInfo {
  seasons: Season[];
  info: {
    name: string;
    cover: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releaseDate: string;
    last_modified: string;
    rating: string;
    rating_5based: number;
    backdrop_path: string[];
    youtube_trailer: string;
    episode_run_time: string;
    category_id: string;
  };
  episodes: Record<string, Episode[]>;
}

// ─── Player ──────────────────────────────────────────────────────────────────

export type StreamType = 'live' | 'vod' | 'series';

export interface PlayerParams {
  streamId: number | string;
  streamType: StreamType;
  title: string;
  poster?: string;
  containerExtension?: string;
  episodeId?: string;
}

// ─── Favorites & History ─────────────────────────────────────────────────────

export interface FavoriteItem {
  id: string;
  streamId: number;
  streamType: StreamType;
  name: string;
  poster?: string;
  addedAt: number;
}

export interface HistoryItem {
  id: string;
  streamId: number;
  streamType: StreamType;
  name: string;
  poster?: string;
  watchedAt: number;
  progress?: number;
  duration?: number;
}

export interface WatchProgress {
  [key: string]: {
    position: number;
    duration: number;
    updatedAt: number;
  };
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchResults {
  live: LiveStream[];
  vod: VodStream[];
  series: SeriesStream[];
}

// ─── Store ───────────────────────────────────────────────────────────────────

export interface AppState {
  // Auth
  credentials: Credentials | null;
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
  serverInfo: ServerInfo | null;
  profiles: ServerProfile[];

  // Categories
  liveCategories: Category[];
  vodCategories: Category[];
  seriesCategories: Category[];

  // Current Category
  currentLiveCategory: string;
  currentVodCategory: string;
  currentSeriesCategory: string;

  // Streams
  liveStreams: LiveStream[];
  vodStreams: VodStream[];
  seriesStreams: SeriesStream[];

  // Favorites & History
  favorites: FavoriteItem[];
  watchHistory: HistoryItem[];
  watchProgress: WatchProgress;

  // Search
  searchQuery: string;
  searchResults: SearchResults;

  // UI State
  isLoading: boolean;
  error: string | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}
