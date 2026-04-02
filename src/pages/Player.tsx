import { useEffect, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VideoPlayer from '../components/Player/VideoPlayer';
import { useAppStore } from '../store/useAppStore';

interface PlayerState {
  streamUrl: string;
  streamId: number | string;
  streamType: 'live' | 'vod' | 'series';
  title?: string;
  poster?: string;
  containerExtension?: string;
  initialPosition?: number;
}

export default function Player() {
  const navigate = useNavigate();
  const location = useLocation();
  const { saveWatchProgress, addToHistory } = useAppStore();

  const state = location.state as PlayerState | null;
  const [realDuration, setRealDuration] = useState<number | null>(null);

  // Récupérer la vraie durée via le proxy (pour fragmented MP4)
  useEffect(() => {
    if (!state?.streamUrl || state.streamType === 'live') return;
    const isProxied = state.streamUrl.includes('localhost:4000') || state.streamUrl.includes('127.0.0.1:4000');
    if (!isProxied) return;

    const rawUrl = new URL(state.streamUrl).searchParams.get('url');
    if (!rawUrl) return;

    fetch(`http://localhost:4000/duration?url=${encodeURIComponent(rawUrl)}`)
      .then(r => r.json())
      .then(data => { if (data.duration) setRealDuration(data.duration); })
      .catch(() => {});
  }, [state?.streamUrl]);

  useEffect(() => {
    // If no stream state passed, go back
    if (!state?.streamUrl) {
      navigate(-1);
    }
  }, [state, navigate]);

  // Add to history on mount
  useEffect(() => {
    if (state && state.streamType !== 'live') {
      addToHistory({
        id: `${state.streamType}_${state.streamId}`,
        streamId: typeof state.streamId === 'string' ? parseInt(state.streamId) : state.streamId,
        streamType: state.streamType,
        name: state.title || 'Inconnu',
        poster: state.poster,
        watchedAt: Date.now(),
      });
    }
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleTimeUpdate = useCallback(
    (position: number, duration: number) => {
      if (!state || state.streamType === 'live') return;
      const key = `${state.streamType}_${state.streamId}`;
      saveWatchProgress(key, position, duration);
    },
    [state, saveWatchProgress]
  );

  if (!state?.streamUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black"
      style={{ paddingTop: 0, paddingBottom: 0 }}
    >
      <VideoPlayer
        src={state.streamUrl}
        title={state.title}
        poster={state.poster}
        streamType={state.streamType}
        initialPosition={state.initialPosition || 0}
        knownDuration={realDuration}
        onBack={handleBack}
        onTimeUpdate={state.streamType !== 'live' ? handleTimeUpdate : undefined}
      />
    </div>
  );
}
