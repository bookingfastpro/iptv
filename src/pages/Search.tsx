import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import SearchInput from '../components/UI/SearchInput';
import MovieCard from '../components/Cards/MovieCard';
import SeriesCard from '../components/Cards/SeriesCard';
import ChannelCard from '../components/Cards/ChannelCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';

type Tab = 'all' | 'live' | 'vod' | 'series';

const TAB_LABELS: Record<Tab, string> = {
  all: 'Tout',
  live: 'Live',
  vod: 'Films',
  series: 'Séries',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Search() {
  const navigate = useNavigate();
  const { searchResults, performSearch, credentials } = useAppStore();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searching, setSearching] = useState(false);

  const debouncedQuery = useDebounce(query, 350);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) return;
      setSearching(true);
      await performSearch(q);
      setSearching(false);
    },
    [performSearch]
  );

  useEffect(() => {
    doSearch(debouncedQuery);
  }, [debouncedQuery, doSearch]);

  const hasResults =
    searchResults.live.length > 0 ||
    searchResults.vod.length > 0 ||
    searchResults.series.length > 0;

  const totalCount =
    searchResults.live.length + searchResults.vod.length + searchResults.series.length;

  const tabCounts: Record<Tab, number> = {
    all: totalCount,
    live: searchResults.live.length,
    vod: searchResults.vod.length,
    series: searchResults.series.length,
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Header */}
      <div
        className="px-4 pt-3 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <h1 className="font-bold text-white">Recherche</h1>
          {searching && <LoadingSpinner size="sm" />}
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Films, séries, chaînes..."
          autoFocus
        />
      </div>

      {/* Tabs (only shown when there are results) */}
      {hasResults && (
        <div
          className="flex overflow-x-auto no-scrollbar px-4 pt-2 pb-1 gap-2 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => {
            const count = tabCounts[tab];
            if (tab !== 'all' && count === 0) return null;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: isActive ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isActive ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.5)',
                }}
              >
                {TAB_LABELS[tab]}
                {count > 0 && (
                  <span
                    className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                    style={{
                      background: isActive ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.1)',
                      color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                      fontSize: '0.6rem',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4">
        {/* Empty state */}
        {!query.trim() && (
          <div className="flex flex-col items-center justify-center pt-16 gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg className="w-9 h-9" style={{ color: 'rgba(255,255,255,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Recherchez parmi tous vos contenus
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              {['Action', 'Comédie', 'Sport', 'News'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: 'rgba(0,212,255,0.1)',
                    border: '1px solid rgba(0,212,255,0.2)',
                    color: '#00d4ff',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {query.trim() && !searching && !hasResults && (
          <div className="flex flex-col items-center justify-center pt-16 gap-3">
            <svg className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.15)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Aucun résultat pour "{query}"
            </p>
          </div>
        )}

        {/* Live channels */}
        {(activeTab === 'all' || activeTab === 'live') && searchResults.live.length > 0 && (
          <section className="mb-5">
            <h3 className="text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
              CHAÎNES LIVE ({searchResults.live.length})
            </h3>
            <div className="flex flex-col">
              {searchResults.live.map((ch) => (
                <ChannelCard
                  key={ch.stream_id}
                  channel={ch}
                  onClick={() => {
                    if (!credentials) return;
                    const streamUrl = `${credentials.serverUrl}/live/${credentials.username}/${credentials.password}/${ch.stream_id}.m3u8`;
                    navigate('/player', {
                      state: {
                        streamUrl,
                        streamId: ch.stream_id,
                        streamType: 'live',
                        title: ch.name,
                        poster: ch.stream_icon,
                      },
                    });
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Movies */}
        {(activeTab === 'all' || activeTab === 'vod') && searchResults.vod.length > 0 && (
          <section className="mb-5">
            <h3 className="text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
              FILMS ({searchResults.vod.length})
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {searchResults.vod.map((movie) => (
                <MovieCard key={movie.stream_id} movie={movie} size="sm" />
              ))}
            </div>
          </section>
        )}

        {/* Series */}
        {(activeTab === 'all' || activeTab === 'series') && searchResults.series.length > 0 && (
          <section className="mb-5">
            <h3 className="text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
              SÉRIES ({searchResults.series.length})
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {searchResults.series.map((s) => (
                <SeriesCard key={s.series_id} series={s} size="sm" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
