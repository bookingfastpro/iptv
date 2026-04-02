import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getApiInstance } from '../services/xtreamApi';
import { FullPageLoader } from '../components/UI/LoadingSpinner';
import type { VodInfo } from '../types';

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vodStreams, favorites, toggleFavorite, getWatchProgress, credentials, addToHistory } = useAppStore();

  const [vodInfo, setVodInfo] = useState<VodInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const streamId = parseInt(id || '0');
  const movie = vodStreams.find((v) => v.stream_id === streamId);
  const isFav = favorites.some((f) => f.id === `vod_${streamId}`);
  const progress = getWatchProgress(`vod_${streamId}`);
  const progressPct = progress && progress.duration > 0
    ? Math.min(100, (progress.position / progress.duration) * 100)
    : 0;

  useEffect(() => {
    const api = getApiInstance();
    if (!api || !streamId) return;

    setLoading(true);
    api.getVodInfo(streamId)
      .then(setVodInfo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [streamId]);

  function handlePlay(resume = false) {
    if (!credentials || !movie) return;
    const ext = movie.container_extension || 'mp4';
    const api = getApiInstance();
    const streamUrl = api
      ? api.getVodStreamUrl(streamId, ext)
      : `${credentials.serverUrl}/movie/${credentials.username}/${credentials.password}/${streamId}.${ext}`;

    addToHistory({
      id: `vod_${streamId}`,
      streamId,
      streamType: 'vod',
      name: movie.name,
      poster: movie.stream_icon,
      watchedAt: Date.now(),
    });

    navigate('/player', {
      state: {
        streamUrl,
        streamId,
        streamType: 'vod',
        title: movie.name,
        poster: movie.stream_icon || vodInfo?.info?.movie_image,
        containerExtension: ext,
        initialPosition: resume && progress ? progress.position : 0,
      },
    });
  }

  function handleFavToggle() {
    if (!movie) return;
    toggleFavorite({
      id: `vod_${streamId}`,
      streamId,
      streamType: 'vod',
      name: movie.name,
      poster: movie.stream_icon,
      addedAt: Date.now(),
    });
  }

  const info = vodInfo?.info;
  const poster = info?.cover_big || info?.movie_image || movie?.stream_icon || '';

  if (loading && !movie) return <FullPageLoader />;

  return (
    <div className="min-h-screen" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Backdrop / poster hero */}
      <div className="relative h-72">
        {poster && !imgError ? (
          <img
            src={poster}
            alt={movie?.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0d0d1a, #1a0d2e)' }}
          >
            <svg className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.1)' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
          </div>
        )}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(0deg, #0a0a0f 0%, rgba(10,10,15,0.4) 60%, rgba(10,10,15,0.7) 100%)' }}
        />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute flex items-center justify-center w-10 h-10 rounded-full"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
            left: '1rem',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Favorite button */}
        <button
          onClick={handleFavToggle}
          className="absolute flex items-center justify-center w-10 h-10 rounded-full"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
            right: '1rem',
            background: isFav ? 'rgba(232,121,249,0.2)' : 'rgba(0,0,0,0.5)',
            border: `1px solid ${isFav ? '#e879f9' : 'rgba(255,255,255,0.2)'}`,
          }}
        >
          <svg
            className="w-5 h-5"
            fill={isFav ? '#e879f9' : 'none'}
            viewBox="0 0 24 24"
            stroke={isFav ? '#e879f9' : '#fff'}
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="flex gap-4 items-end mb-4">
          {/* Small poster */}
          <div
            className="w-24 h-36 rounded-xl overflow-hidden flex-shrink-0"
            style={{ border: '2px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
          >
            {poster && !imgError ? (
              <img src={poster} alt={movie?.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: '#1a1a2e' }}>
                <svg className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-lg font-bold text-white leading-tight">{movie?.name || info?.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {info && info.rating != null && (info.rating as number) > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#fbbf24' }}>
                  ★ {typeof info.rating === 'number' ? info.rating.toFixed(1) : String(info.rating)}
                </span>
              )}
              {info?.releasedate && (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {String(info.releasedate).substring(0, 4)}
                </span>
              )}
              {info?.duration && (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {info.duration}
                </span>
              )}
              {info?.genre && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(124,58,237,0.25)', color: '#c4b5fd' }}
                >
                  {info.genre.split(',')[0].trim()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Play buttons */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => handlePlay(false)}
            className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(0,212,255,0.25)',
            }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Regarder
          </button>

          {progressPct > 10 && (
            <button
              onClick={() => handlePlay(true)}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
              style={{
                background: 'rgba(0,212,255,0.15)',
                color: '#00d4ff',
                border: '1px solid rgba(0,212,255,0.3)',
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
              </svg>
              Reprendre ({Math.round(progressPct)}%)
            </button>
          )}
        </div>

        {/* Progress bar if watching */}
        {progressPct > 0 && progressPct < 95 && (
          <div className="mb-4">
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${progressPct}%`, background: '#00d4ff' }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Vu à {Math.round(progressPct)}%
            </p>
          </div>
        )}

        {/* Description */}
        {(info?.description || info?.plot) && (
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white/70 mb-2">Synopsis</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {info.description || info.plot}
            </p>
          </div>
        )}

        {/* Details grid */}
        {info && (
          <div
            className="rounded-xl p-4 mb-4"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <h3 className="text-sm font-bold text-white/70 mb-3">Détails</h3>
            <div className="flex flex-col gap-2">
              {info.director && (
                <div className="flex gap-2">
                  <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>Réalisateur</span>
                  <span className="text-xs text-white/70 flex-1">{info.director}</span>
                </div>
              )}
              {info.cast && (
                <div className="flex gap-2">
                  <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>Casting</span>
                  <span className="text-xs text-white/70 flex-1 line-clamp-2">{info.cast}</span>
                </div>
              )}
              {info.country && (
                <div className="flex gap-2">
                  <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>Pays</span>
                  <span className="text-xs text-white/70 flex-1">{info.country}</span>
                </div>
              )}
              {info.genre && (
                <div className="flex gap-2">
                  <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>Genre</span>
                  <span className="text-xs text-white/70 flex-1">{info.genre}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
