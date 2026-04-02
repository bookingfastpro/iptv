import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import MovieCard from '../components/Cards/MovieCard';
import SeriesCard from '../components/Cards/SeriesCard';
import { FullPageLoader } from '../components/UI/LoadingSpinner';

export default function Home() {
  const navigate = useNavigate();
  const {
    userInfo,
    vodStreams,
    seriesStreams,
    watchHistory,
    favorites,
    fetchVodStreams,
    fetchVodCategories,
    fetchSeriesStreams,
    fetchSeriesCategories,
    isLoading,
    credentials,
  } = useAppStore();

  useEffect(() => {
    if (vodStreams.length === 0) {
      fetchVodCategories().then(() => fetchVodStreams());
    }
    if (seriesStreams.length === 0) {
      fetchSeriesCategories().then(() => fetchSeriesStreams());
    }
  }, []);

  const recentMovies = [...vodStreams]
    .sort((a, b) => parseInt(b.added) - parseInt(a.added))
    .slice(0, 20);

  const recentSeries = [...seriesStreams]
    .sort((a, b) => parseInt(b.last_modified) - parseInt(a.last_modified))
    .slice(0, 10);

  const historyMovies = watchHistory.filter((h) => h.streamType === 'vod').slice(0, 10);

  const favoriteItems = favorites.slice(0, 10);

  if (isLoading && vodStreams.length === 0) return <FullPageLoader />;

  return (
    <div className="min-h-screen px-4 py-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-wider text-glow-cyan"
            style={{ color: '#00d4ff' }}
          >
            AURA TV
          </h1>
          {userInfo && (
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Bonjour, {userInfo.username}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/search')}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <svg className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Live TV', path: '/live', color: '#ef4444', icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 6H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 14H3V8h18v12zM9 10v8l7-4z"/></svg>
          )},
          { label: 'Films', path: '/movies', color: '#00d4ff', icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
          )},
          { label: 'Séries', path: '/series', color: '#7c3aed', icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8v8l7-4z"/></svg>
          )},
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-2 py-3 rounded-xl transition-all active:scale-95"
            style={{
              background: `${item.color}15`,
              border: `1px solid ${item.color}30`,
            }}
          >
            <div style={{ color: item.color }}>{item.icon}</div>
            <span className="text-xs font-semibold" style={{ color: item.color }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Continue watching */}
      {historyMovies.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white/80">Continuer à regarder</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {historyMovies.map((item) => {
              const movie = vodStreams.find((v) => v.stream_id === item.streamId);
              if (!movie) return null;
              return <MovieCard key={item.id} movie={movie} size="sm" />;
            })}
          </div>
        </section>
      )}

      {/* Favorites */}
      {favoriteItems.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white/80">Mes Favoris</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {favoriteItems.map((item) => {
              if (item.streamType === 'vod') {
                const movie = vodStreams.find((v) => v.stream_id === item.streamId);
                if (movie) return <MovieCard key={item.id} movie={movie} size="sm" />;
              }
              if (item.streamType === 'series') {
                const series = seriesStreams.find((s) => s.series_id === item.streamId);
                if (series) return <SeriesCard key={item.id} series={series} size="sm" />;
              }
              return null;
            })}
          </div>
        </section>
      )}

      {/* Recently Added Movies */}
      {recentMovies.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white/80">Films Récents</h2>
            <button
              onClick={() => navigate('/movies')}
              className="text-xs font-semibold"
              style={{ color: '#00d4ff' }}
            >
              Voir tout
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {recentMovies.map((movie) => (
              <MovieCard key={movie.stream_id} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Added Series */}
      {recentSeries.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white/80">Séries Récentes</h2>
            <button
              onClick={() => navigate('/series')}
              className="text-xs font-semibold"
              style={{ color: '#7c3aed' }}
            >
              Voir tout
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {recentSeries.map((s) => (
              <SeriesCard key={s.series_id} series={s} />
            ))}
          </div>
        </section>
      )}

      {/* Account info card */}
      {userInfo && credentials && (
        <div
          className="p-4 rounded-2xl mb-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #00d4ff22, #7c3aed22)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}
            >
              {userInfo.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{userInfo.username}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {credentials.serverUrl.replace(/^https?:\/\//, '').split(':')[0]}
              </p>
            </div>
            <div className="ml-auto">
              <span
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{
                  background: userInfo.status === 'Active' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                  color: userInfo.status === 'Active' ? '#22c55e' : '#ef4444',
                }}
              >
                {userInfo.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Expire', value: userInfo.exp_date ? new Date(parseInt(userInfo.exp_date) * 1000).toLocaleDateString('fr-FR') : 'N/A' },
              { label: 'Connexions', value: `${userInfo.active_cons}/${userInfo.max_connections}` },
              { label: 'Films', value: vodStreams.length.toLocaleString() },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-0.5 p-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <p className="text-sm font-bold text-white">{stat.value}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
