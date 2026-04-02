import { create } from 'zustand';
import { createApiInstance, getApiInstance } from '../services/xtreamApi';
import {
  saveCredentials,
  loadCredentials,
  clearCredentials,
  loadFavorites,
  saveFavorites,
  toggleFavorite as storageFavorite,
  loadHistory,
  addToHistory as storageAddHistory,
  loadProgress,
  updateProgress as storageUpdateProgress,
  loadProfiles,
  addProfile as storageAddProfile,
  deleteProfile as storageDeleteProfile,
} from '../services/storage';
import type {
  Credentials,
  ServerProfile,
  Category,
  LiveStream,
  VodStream,
  SeriesStream,
  FavoriteItem,
  HistoryItem,
  WatchProgress,
  SearchResults,
  UserInfo,
  ServerInfo,
} from '../types';

interface AppStore {
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

  // Current Category selection
  currentLiveCategory: string;
  currentVodCategory: string;
  currentSeriesCategory: string;

  // Streams cache
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

  // UI
  isLoading: boolean;
  error: string | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;

  // ── Actions ──────────────────────────────────────────────────────────────

  // Auth actions
  login: (serverUrl: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  initAuth: () => Promise<void>;
  addProfile: (profile: Omit<ServerProfile, 'id' | 'createdAt'>) => void;
  removeProfile: (id: string) => void;
  loginWithProfile: (profile: ServerProfile) => Promise<boolean>;

  // Data fetching
  fetchLiveCategories: () => Promise<void>;
  fetchLiveStreams: (categoryId?: string) => Promise<void>;
  fetchVodCategories: () => Promise<void>;
  fetchVodStreams: (categoryId?: string) => Promise<void>;
  fetchSeriesCategories: () => Promise<void>;
  fetchSeriesStreams: (categoryId?: string) => Promise<void>;
  refreshAll: () => Promise<void>;

  // Category selection
  setCurrentLiveCategory: (id: string) => void;
  setCurrentVodCategory: (id: string) => void;
  setCurrentSeriesCategory: (id: string) => void;

  // Favorites
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (id: string) => boolean;

  // History & Progress
  addToHistory: (item: HistoryItem) => void;
  saveWatchProgress: (streamKey: string, position: number, duration: number) => void;
  getWatchProgress: (streamKey: string) => { position: number; duration: number } | null;

  // Search
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;

  // UI helpers
  setToast: (toast: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // ── Initial State ─────────────────────────────────────────────────────────

  credentials: null,
  isAuthenticated: false,
  userInfo: null,
  serverInfo: null,
  profiles: loadProfiles(),

  liveCategories: [],
  vodCategories: [],
  seriesCategories: [],

  currentLiveCategory: 'all',
  currentVodCategory: 'all',
  currentSeriesCategory: 'all',

  liveStreams: [],
  vodStreams: [],
  seriesStreams: [],

  favorites: loadFavorites(),
  watchHistory: loadHistory(),
  watchProgress: loadProgress(),

  searchQuery: '',
  searchResults: { live: [], vod: [], series: [] },

  isLoading: false,
  error: null,
  toast: null,

  // ── Auth Actions ──────────────────────────────────────────────────────────

  login: async (serverUrl, username, password) => {
    set({ isLoading: true, error: null });
    try {
      const api = createApiInstance(serverUrl, username, password);
      const auth = await api.authenticate();

      if (!auth.user_info || auth.user_info.auth === 0) {
        set({ isLoading: false, error: 'Identifiants incorrects' });
        return false;
      }

      const creds: Credentials = { serverUrl, username, password };
      saveCredentials(creds);

      set({
        credentials: creds,
        isAuthenticated: true,
        userInfo: auth.user_info,
        serverInfo: auth.server_info,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion';
      set({ isLoading: false, error: message, isAuthenticated: false });
      return false;
    }
  },

  logout: () => {
    clearCredentials();
    set({
      credentials: null,
      isAuthenticated: false,
      userInfo: null,
      serverInfo: null,
      liveCategories: [],
      vodCategories: [],
      seriesCategories: [],
      liveStreams: [],
      vodStreams: [],
      seriesStreams: [],
      currentLiveCategory: 'all',
      currentVodCategory: 'all',
      currentSeriesCategory: 'all',
    });
  },

  initAuth: async () => {
    const creds = loadCredentials();
    if (!creds) return;

    set({ isLoading: true });
    try {
      const api = createApiInstance(creds.serverUrl, creds.username, creds.password);
      const auth = await api.authenticate();

      if (auth.user_info && auth.user_info.auth !== 0) {
        set({
          credentials: creds,
          isAuthenticated: true,
          userInfo: auth.user_info,
          serverInfo: auth.server_info,
          isLoading: false,
        });
      } else {
        clearCredentials();
        set({ isLoading: false });
      }
    } catch {
      // Silently fail on init — user will see login screen
      set({ isLoading: false });
    }
  },

  addProfile: (profileData) => {
    const profile: ServerProfile = {
      ...profileData,
      id: `profile_${Date.now()}`,
      createdAt: Date.now(),
    };
    const profiles = storageAddProfile(profile);
    set({ profiles });
  },

  removeProfile: (id) => {
    const profiles = storageDeleteProfile(id);
    set({ profiles });
  },

  loginWithProfile: async (profile) => {
    return get().login(profile.serverUrl, profile.username, profile.password);
  },

  // ── Data Fetching ─────────────────────────────────────────────────────────

  fetchLiveCategories: async () => {
    const api = getApiInstance();
    if (!api) return;
    try {
      const categories = await api.getLiveCategories();
      const allCategory = { category_id: 'all', category_name: 'Tous', parent_id: 0 };
      set({ liveCategories: [allCategory, ...categories] });
    } catch (err) {
      console.error('fetchLiveCategories:', err);
    }
  },

  fetchLiveStreams: async (categoryId) => {
    const api = getApiInstance();
    if (!api) return;
    const id = categoryId ?? get().currentLiveCategory;
    set({ isLoading: true });
    try {
      const streams = await api.getLiveStreams(id === 'all' ? undefined : id);
      set({ liveStreams: streams, isLoading: false });
    } catch (err) {
      console.error('fetchLiveStreams:', err);
      set({ isLoading: false, error: 'Erreur chargement Live TV' });
    }
  },

  fetchVodCategories: async () => {
    const api = getApiInstance();
    if (!api) return;
    try {
      const categories = await api.getVodCategories();
      const allCategory = { category_id: 'all', category_name: 'Tous', parent_id: 0 };
      set({ vodCategories: [allCategory, ...categories] });
    } catch (err) {
      console.error('fetchVodCategories:', err);
    }
  },

  fetchVodStreams: async (categoryId) => {
    const api = getApiInstance();
    if (!api) return;
    const id = categoryId ?? get().currentVodCategory;
    set({ isLoading: true });
    try {
      const streams = await api.getVodStreams(id === 'all' ? undefined : id);
      set({ vodStreams: streams, isLoading: false });
    } catch (err) {
      console.error('fetchVodStreams:', err);
      set({ isLoading: false, error: 'Erreur chargement Films' });
    }
  },

  fetchSeriesCategories: async () => {
    const api = getApiInstance();
    if (!api) return;
    try {
      const categories = await api.getSeriesCategories();
      const allCategory = { category_id: 'all', category_name: 'Tous', parent_id: 0 };
      set({ seriesCategories: [allCategory, ...categories] });
    } catch (err) {
      console.error('fetchSeriesCategories:', err);
    }
  },

  fetchSeriesStreams: async (categoryId) => {
    const api = getApiInstance();
    if (!api) return;
    const id = categoryId ?? get().currentSeriesCategory;
    set({ isLoading: true });
    try {
      const streams = await api.getSeries(id === 'all' ? undefined : id);
      set({ seriesStreams: streams, isLoading: false });
    } catch (err) {
      console.error('fetchSeriesStreams:', err);
      set({ isLoading: false, error: 'Erreur chargement Séries' });
    }
  },

  refreshAll: async () => {
    const store = get();
    await Promise.all([
      store.fetchLiveCategories(),
      store.fetchVodCategories(),
      store.fetchSeriesCategories(),
    ]);
    set({ toast: { message: 'Contenu mis à jour', type: 'success' } });
  },

  // ── Category Selection ────────────────────────────────────────────────────

  setCurrentLiveCategory: (id) => {
    set({ currentLiveCategory: id });
    get().fetchLiveStreams(id);
  },

  setCurrentVodCategory: (id) => {
    set({ currentVodCategory: id });
    get().fetchVodStreams(id);
  },

  setCurrentSeriesCategory: (id) => {
    set({ currentSeriesCategory: id });
    get().fetchSeriesStreams(id);
  },

  // ── Favorites ─────────────────────────────────────────────────────────────

  toggleFavorite: (item) => {
    const favorites = storageFavorite(item);
    set({ favorites });
  },

  isFavorite: (id) => {
    return get().favorites.some((f) => f.id === id);
  },

  // ── History & Progress ────────────────────────────────────────────────────

  addToHistory: (item) => {
    const watchHistory = storageAddHistory(item);
    set({ watchHistory });
  },

  saveWatchProgress: (streamKey, position, duration) => {
    const watchProgress = storageUpdateProgress(streamKey, position, duration);
    set({ watchProgress });
  },

  getWatchProgress: (streamKey) => {
    const progress = get().watchProgress[streamKey];
    if (!progress) return null;
    return { position: progress.position, duration: progress.duration };
  },

  // ── Search ────────────────────────────────────────────────────────────────

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  performSearch: async (query) => {
    const api = getApiInstance();
    if (!api || !query.trim()) {
      set({ searchResults: { live: [], vod: [], series: [] } });
      return;
    }

    const { liveStreams, vodStreams, seriesStreams } = get();

    // If streams not yet loaded, fetch all first
    const live = liveStreams.length > 0 ? liveStreams : await api.getLiveStreams();
    const vod = vodStreams.length > 0 ? vodStreams : await api.getVodStreams();
    const series = seriesStreams.length > 0 ? seriesStreams : await api.getSeries();

    const results = await api.searchAll(query, live, vod, series);
    set({ searchResults: results });
  },

  // ── UI Helpers ────────────────────────────────────────────────────────────

  setToast: (toast) => {
    set({ toast });
    if (toast) {
      setTimeout(() => {
        // Only clear if it's the same toast
        const current = get().toast;
        if (current?.message === toast.message) {
          set({ toast: null });
        }
      }, 3000);
    }
  },

  clearError: () => set({ error: null }),
}));
