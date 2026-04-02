import type {
  Credentials,
  ServerProfile,
  FavoriteItem,
  HistoryItem,
  WatchProgress,
} from '../types';

// ─── Keys ────────────────────────────────────────────────────────────────────

const KEYS = {
  CREDENTIALS: 'aura_credentials',
  PROFILES: 'aura_profiles',
  FAVORITES: 'aura_favorites',
  HISTORY: 'aura_history',
  PROGRESS: 'aura_progress',
  SETTINGS: 'aura_settings',
} as const;

const MAX_HISTORY = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

function remove(key: string): void {
  localStorage.removeItem(key);
}

// ─── Credentials ─────────────────────────────────────────────────────────────

export function saveCredentials(creds: Credentials): void {
  set(KEYS.CREDENTIALS, creds);
}

export function loadCredentials(): Credentials | null {
  return get<Credentials | null>(KEYS.CREDENTIALS, null);
}

export function clearCredentials(): void {
  remove(KEYS.CREDENTIALS);
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export function saveProfiles(profiles: ServerProfile[]): void {
  set(KEYS.PROFILES, profiles);
}

export function loadProfiles(): ServerProfile[] {
  return get<ServerProfile[]>(KEYS.PROFILES, []);
}

export function addProfile(profile: ServerProfile): ServerProfile[] {
  const profiles = loadProfiles();
  const existing = profiles.findIndex((p) => p.id === profile.id);
  if (existing >= 0) {
    profiles[existing] = profile;
  } else {
    profiles.push(profile);
  }
  saveProfiles(profiles);
  return profiles;
}

export function deleteProfile(id: string): ServerProfile[] {
  const profiles = loadProfiles().filter((p) => p.id !== id);
  saveProfiles(profiles);
  return profiles;
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export function loadFavorites(): FavoriteItem[] {
  return get<FavoriteItem[]>(KEYS.FAVORITES, []);
}

export function saveFavorites(favorites: FavoriteItem[]): void {
  set(KEYS.FAVORITES, favorites);
}

export function toggleFavorite(item: FavoriteItem): FavoriteItem[] {
  const favorites = loadFavorites();
  const idx = favorites.findIndex((f) => f.id === item.id);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.unshift(item);
  }
  saveFavorites(favorites);
  return favorites;
}

export function isFavorite(id: string): boolean {
  return loadFavorites().some((f) => f.id === id);
}

// ─── Watch History ───────────────────────────────────────────────────────────

export function loadHistory(): HistoryItem[] {
  return get<HistoryItem[]>(KEYS.HISTORY, []);
}

export function saveHistory(history: HistoryItem[]): void {
  set(KEYS.HISTORY, history);
}

export function addToHistory(item: HistoryItem): HistoryItem[] {
  const history = loadHistory().filter((h) => h.id !== item.id);
  history.unshift(item);
  const trimmed = history.slice(0, MAX_HISTORY);
  saveHistory(trimmed);
  return trimmed;
}

export function clearHistory(): void {
  remove(KEYS.HISTORY);
}

// ─── Watch Progress ──────────────────────────────────────────────────────────

export function loadProgress(): WatchProgress {
  return get<WatchProgress>(KEYS.PROGRESS, {});
}

export function saveProgress(progress: WatchProgress): void {
  set(KEYS.PROGRESS, progress);
}

export function updateProgress(
  streamKey: string,
  position: number,
  duration: number
): WatchProgress {
  const progress = loadProgress();
  progress[streamKey] = { position, duration, updatedAt: Date.now() };
  saveProgress(progress);
  return progress;
}

export function getProgress(streamKey: string): { position: number; duration: number } | null {
  const progress = loadProgress();
  return progress[streamKey] ?? null;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface AppSettings {
  language: string;
  autoPlay: boolean;
  rememberPosition: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'fr',
  autoPlay: true,
  rememberPosition: true,
};

export function loadSettings(): AppSettings {
  return get<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  set(KEYS.SETTINGS, settings);
}

// ─── Clear All ───────────────────────────────────────────────────────────────

export function clearAll(): void {
  Object.values(KEYS).forEach(remove);
}
