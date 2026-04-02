import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getApiInstance } from '../services/xtreamApi';
import { FullPageLoader } from '../components/UI/LoadingSpinner';
import type { SeriesInfo, Episode } from '../types';

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { seriesStreams, favorites, toggleFavorite, credentials, addToHistory } = useAppStore();

  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [imgError, setImgError] = useState(false);

  const seriesId = parseInt(id || '0');
  const series = seriesStreams.find((s) => s.series_id === seriesId);
  const isFav = favorites.some((f) => f.id === `series_${seriesId}`);

  useEffect(() => {
    const api = getApiInstance();
    if (!api || !seriesId) return;

    setLoading(true);
    api.getSeriesInfo(seriesId)
      .then((info) => {
        setSeriesInfo(info);
        // Set first available season
        const seasonNums = Object.keys(info.episodes).map(Number).sort((a, b) => a - b);
        if (seasonNums.length > 0) setSelectedSeason(seasonNums[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [seriesId]);

  function handleEpisodePlay(episode: Episode) {
    if (!credentials || !series) return;
    const ext = episode.container_extension || 'mkv';
    const api = getApiInstance();
    const streamUrl = api
      ? api.getEpisodeStreamUrl(episode.id, ext)
      : `${credentials.serverUrl}/series/${credentials.username}/${credentials.password}/${episode.id}.${ext}`;

    addToHistory({
      id: `series_${seriesId}_ep_${episode.id}`,
      streamId: seriesId,
      streamType: 'series',
      name: `${series.name} - S${episode.season}E${episode.episode_num}`,
      poster: series.cover,
      watchedAt: Date.now(),
    });

    navigate('/player', {
      state: {
        streamUrl,
        streamId: episode.id,
        streamType: 'series',
        title: `${series?.name} - S${episode.season}E${episode.episode_num} - ${episode.title}`,
        poster: episode.info?.movie_image || series?.cover,
        containerExtension: ext,
      },
    });
  }

  function handleFavToggle() {
    if (!series) return;
    toggleFavorite({
      id: `series_${seriesId}`,
      streamId: seriesId,
      streamType: 'series',
      name: series.name,
      poster: series.cover,
      addedAt: Date.now(),
    });
  }

  const info = seriesInfo?.info || series;
  const poster = (info as { cover?: string; cover_big?: string })?.cover_big || series?.cover || '';
  const episodes: Episode[] = seriesInfo?.episodes?.[selectedSeason.toString()] || [];
  const seasonNums = seriesInfo ? Object.keys(seriesInfo.episodes).map(Number).sort((a, b) => a - b) : [];

  if (loading && !series) return <FullPageLoader />;

  return (
    <div className="min-h-screen" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Hero */}
      <div className="relative h-64">
        {poster && !imgError ? (
          <img
            src={poster}
            alt={series?.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0d0d1a, #1a0d2e)' }}
          >
            <svg className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.1)' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
            </svg>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(0deg, #0a0a0f 0%, rgba(10,10,15,0.3) 50%, rgba(10,10,15,0.7) 100%)' }}
        />

        {/* Back */}
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

        {/* Fav */}
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
          <svg className="w-5 h-5" fill={isFav ? '#e879f9' : 'none'} viewBox="0 0 24 24" stroke={isFav ? '#e879f9' : '#fff'} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="px-4 -mt-12 relative z-10">
        <h1 className="text-xl font-bold text-white mb-1">{series?.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {series?.rating_5based && series.rating_5based > 0 && (
            <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>
              ★ {series.rating_5based.toFixed(1)}
            </span>
          )}
          {series?.releaseDate && (
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {series.releaseDate.substring(0, 4)}
            </span>
          )}
          {series?.genre && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.25)', color: '#c4b5fd' }}>
              {series.genre.split(',')[0].trim()}
            </span>
          )}
          {seasonNums.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}>
              {seasonNums.length} saison{seasonNums.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {series?.plot && (
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {series.plot}
          </p>
        )}

        {/* Season selector */}
        {seasonNums.length > 0 && (
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {seasonNums.map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedSeason(num)}
                  className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: selectedSeason === num ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${selectedSeason === num ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: selectedSeason === num ? '#00d4ff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  Saison {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Episodes list */}
        {loading && !seriesInfo ? (
          <FullPageLoader />
        ) : episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Aucun épisode disponible
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-white/70 mb-1">
              Saison {selectedSeason} — {episodes.length} épisode{episodes.length > 1 ? 's' : ''}
            </h3>
            {episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => handleEpisodePlay(ep)}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-98"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Episode thumbnail */}
                <div
                  className="w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                >
                  {ep.info?.movie_image ? (
                    <img
                      src={ep.info.movie_image}
                      alt={ep.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <svg className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.2)' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">
                    E{ep.episode_num} — {ep.title || `Épisode ${ep.episode_num}`}
                  </p>
                  {ep.info?.duration && (
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {ep.info.duration}
                    </p>
                  )}
                  {ep.info?.plot && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {ep.info.plot}
                    </p>
                  )}
                </div>

                <svg
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: '#00d4ff' }}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
