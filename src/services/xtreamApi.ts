/**
 * Xtream Codes API Client
 *
 * CORS NOTE: In production, most Xtream Codes servers do NOT include
 * CORS headers. When running from a PWA on a different origin, you will
 * encounter CORS errors. Solutions:
 *   1. Use a CORS proxy (e.g., https://corsproxy.io/?{encodedUrl})
 *   2. Run your own proxy server (nginx with `add_header Access-Control-Allow-Origin *`)
 *   3. Some servers have CORS enabled — test yours first
 *
 * To enable a CORS proxy, set the VITE_CORS_PROXY env variable:
 *   VITE_CORS_PROXY=https://corsproxy.io/?
 */

import axios, { type AxiosInstance } from 'axios';
import type {
  AuthResponse,
  Category,
  LiveStream,
  EpgResponse,
  VodStream,
  VodInfo,
  SeriesStream,
  SeriesInfo,
} from '../types';

const CORS_PROXY = import.meta.env.VITE_CORS_PROXY || '';

// Proxy AURA TV — configurable via VITE_PROXY_URL (prod) ou localhost:4000 (dev)
const LOCAL_PROXY = import.meta.env.VITE_PROXY_URL || 'http://localhost:4000';

export function isLocalProxyEnabled(): boolean {
  return localStorage.getItem('aura_use_local_proxy') === '1';
}

export function setLocalProxy(enabled: boolean) {
  localStorage.setItem('aura_use_local_proxy', enabled ? '1' : '0');
}

function proxied(url: string): string {
  if (isLocalProxyEnabled()) {
    return `${LOCAL_PROXY}/api?url=${encodeURIComponent(url)}`;
  }
  if (!CORS_PROXY) return url;
  return `${CORS_PROXY}${encodeURIComponent(url)}`;
}

export class XtreamApi {
  private client: AxiosInstance;
  private serverUrl: string;
  private username: string;
  private password: string;

  constructor(serverUrl: string, username: string, password: string) {
    // Normalize the server URL (strip trailing slash)
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.username = username;
    this.password = password;

    this.client = axios.create({
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private get baseParams() {
    return {
      username: this.username,
      password: this.password,
    };
  }

  private get apiUrl() {
    return `${this.serverUrl}/player_api.php`;
  }

  private async get<T>(params: Record<string, string | number>): Promise<T> {
    const url = proxied(this.apiUrl);
    const response = await this.client.get<T>(url, {
      params: { ...this.baseParams, ...params },
    });
    return response.data;
  }

  // ─── Auth ───────────────────────────────────────────────────────────────

  async authenticate(): Promise<AuthResponse> {
    return this.get<AuthResponse>({});
  }

  // ─── Live TV ────────────────────────────────────────────────────────────

  async getLiveCategories(): Promise<Category[]> {
    return this.get<Category[]>({ action: 'get_live_categories' });
  }

  async getLiveStreams(categoryId?: string): Promise<LiveStream[]> {
    const params: Record<string, string> = { action: 'get_live_streams' };
    if (categoryId && categoryId !== 'all') {
      params.category_id = categoryId;
    }
    return this.get<LiveStream[]>(params);
  }

  async getEpg(streamId: number, limit = 3): Promise<EpgResponse> {
    return this.get<EpgResponse>({
      action: 'get_short_epg',
      stream_id: streamId,
      limit,
    });
  }

  // ─── VOD (Movies) ───────────────────────────────────────────────────────

  async getVodCategories(): Promise<Category[]> {
    return this.get<Category[]>({ action: 'get_vod_categories' });
  }

  async getVodStreams(categoryId?: string): Promise<VodStream[]> {
    const params: Record<string, string> = { action: 'get_vod_streams' };
    if (categoryId && categoryId !== 'all') {
      params.category_id = categoryId;
    }
    return this.get<VodStream[]>(params);
  }

  async getVodInfo(vodId: number): Promise<VodInfo> {
    return this.get<VodInfo>({ action: 'get_vod_info', vod_id: vodId });
  }

  // ─── Series ─────────────────────────────────────────────────────────────

  async getSeriesCategories(): Promise<Category[]> {
    return this.get<Category[]>({ action: 'get_series_categories' });
  }

  async getSeries(categoryId?: string): Promise<SeriesStream[]> {
    const params: Record<string, string> = { action: 'get_series' };
    if (categoryId && categoryId !== 'all') {
      params.category_id = categoryId;
    }
    return this.get<SeriesStream[]>(params);
  }

  async getSeriesInfo(seriesId: number): Promise<SeriesInfo> {
    return this.get<SeriesInfo>({ action: 'get_series_info', series_id: seriesId });
  }

  // ─── Stream URLs ─────────────────────────────────────────────────────────

  getLiveStreamUrl(streamId: number): string {
    const raw = `${this.serverUrl}/live/${this.username}/${this.password}/${streamId}.m3u8`;
    if (isLocalProxyEnabled()) {
      return `${LOCAL_PROXY}/live?url=${encodeURIComponent(raw)}`;
    }
    return raw;
  }

  getVodStreamUrl(streamId: number, extension: string = 'mp4'): string {
    const raw = `${this.serverUrl}/movie/${this.username}/${this.password}/${streamId}.${extension}`;
    if (isLocalProxyEnabled()) {
      return `${LOCAL_PROXY}/vod?url=${encodeURIComponent(raw)}`;
    }
    return raw;
  }

  getEpisodeStreamUrl(episodeId: string, extension: string = 'mp4'): string {
    const raw = `${this.serverUrl}/series/${this.username}/${this.password}/${episodeId}.${extension}`;
    if (isLocalProxyEnabled()) {
      return `${LOCAL_PROXY}/vod?url=${encodeURIComponent(raw)}`;
    }
    return raw;
  }

  // ─── Search (client-side) ─────────────────────────────────────────────

  async searchAll(
    query: string,
    live: LiveStream[],
    vod: VodStream[],
    series: SeriesStream[]
  ) {
    const q = query.toLowerCase().trim();
    if (!q) return { live: [], vod: [], series: [] };

    return {
      live: live.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 30),
      vod: vod.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 30),
      series: series.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 30),
    };
  }
}

// Singleton factory
let _instance: XtreamApi | null = null;

export function createApiInstance(
  serverUrl: string,
  username: string,
  password: string
): XtreamApi {
  _instance = new XtreamApi(serverUrl, username, password);
  return _instance;
}

export function getApiInstance(): XtreamApi | null {
  return _instance;
}
